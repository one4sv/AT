import { useEffect, useRef, useState } from "react";
import { DotsThreeOutlineVerticalIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useChat } from "../../../components/hooks/ChatHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { usePinnedMessages } from "../../../components/hooks/PinnedMessagesHook";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import type { activeHeaderType, message } from "../../../components/context/ChatContext";
import ChatPinned from "./ChatTa/ChatPinned";
import PmsList from "./ChatTa/PmsList";
import ChatSearch from "./ChatTa/ChatSearch";
import SearchList from "./ChatTa/SearchList";
import ChatChoosingMess from "./ChatTa/ChatChoosingMess";

export default function ChatActionPanel({searchedMessages}: {searchedMessages:message[]}) {
    const { t } = useTranslation("common");
    const { activeHeader, setActiveHeader, searchMess, library } = useChat();
    const { setChosenMess } = useMessages();
    const { pms, setShowList, pmRef } = usePinnedMessages();
    const { openMenu, menu } = useContextMenu();
    const { setDontHandle, dontHandleOther } = useSideMenu();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchDivRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);
    const previousPinCount = useRef(0);
    const suppressClick = useRef(false);
    const blocked = useRef(false);
    blocked.current = menu.visible || dontHandleOther;
    const modes: activeHeaderType[] = pms.length ? ["pinned","search","choosing"] : ["search","choosing"];

    useEffect(() => {
        if (!library) return;
        const shouldOpen = library.pins.length > 0 && (!initialized.current || previousPinCount.current === 0);
        initialized.current = true;
        previousPinCount.current = library.pins.length;
        if (shouldOpen) setActiveHeader(previous => previous === "text" ? "pinned" : previous);
    }, [library, setActiveHeader]);
    useEffect(() => {
        if (activeHeader === "pinned" && library && !pms.length) setActiveHeader("text");
        if (activeHeader !== "pinned") setShowList(false);
        if (activeHeader !== "search") setIsSearchOpen(false);
    }, [activeHeader, library, pms.length, setActiveHeader, setShowList]);
    useEffect(() => {
        if (activeHeader === "search") setIsSearchOpen(searchMess.trim().length > 0);
    }, [activeHeader, searchMess]);

    useEffect(() => {
        const row = rowRef.current;
        if (!row) return;
        let press: {x:number;y:number;id:number;owned:boolean} | null = null;
        const release = () => {
            if (press?.owned) setDontHandle(false);
            press = null;
        };
        const start = (event: TouchEvent) => {
            release();
            suppressClick.current = false;
            if (event.touches.length !== 1 || blocked.current || !(event.target instanceof Element) ||
                event.target.closest("input,textarea,button")) return;
            const touch = event.touches[0];
            press = {x:touch.clientX,y:touch.clientY,id:touch.identifier,owned:false};
        };
        const move = (event:TouchEvent) => {
            if (!press || blocked.current || event.touches.length !== 1 || event.defaultPrevented) { release(); return; }
            const touch = event.touches[0];
            if (touch.identifier !== press.id) { release(); return; }
            const dx = touch.clientX-press.x, dy = touch.clientY-press.y;
            if (!press.owned) {
                if (Math.max(Math.abs(dx),Math.abs(dy)) < 8) return;
                if (Math.abs(dx) <= Math.abs(dy)) { release(); return; }
                press.owned=true;
                suppressClick.current=true;
                setDontHandle(true);
            }
            if (event.cancelable) event.preventDefault();
        };
        const end = (event:TouchEvent) => {
            if (press?.owned && !blocked.current) {
                const touch=Array.from(event.changedTouches).find(touch=>touch.identifier===press?.id);
                if (touch && Math.abs(touch.clientX-press.x)>=40) {
                    const index=modes.indexOf(activeHeader);
                    const next=modes[(index+(touch.clientX<press.x?1:-1)+modes.length)%modes.length];
                    setChosenMess([]);
                    setActiveHeader(next);
                }
            }
            release();
        };
        row.addEventListener("touchstart",start,{passive:true});
        row.addEventListener("touchmove",move,{passive:false});
        row.addEventListener("touchend",end);
        row.addEventListener("touchcancel",release);
        return () => {
            row.removeEventListener("touchstart",start);
            row.removeEventListener("touchmove",move);
            row.removeEventListener("touchend",end);
            row.removeEventListener("touchcancel",release);
            release();
        };
    }, [activeHeader,pms.length,setActiveHeader,setChosenMess,setDontHandle]);

    if (!modes.includes(activeHeader)) return null;
    const showMenu = (x:number,y:number) => openMenu(x,y,"chatAction",{id:"chatAction"});
    return <div className="chatActionPanel" ref={pmRef}>
        <div ref={rowRef} className="chatActionRow" data-context-menu="true" data-context-menu-allow-button
            onContextMenu={event=>{event.preventDefault();event.stopPropagation();showMenu(event.clientX,event.clientY);}}
            onClickCapture={event=>{if(suppressClick.current){suppressClick.current=false;event.preventDefault();event.stopPropagation();}}}>
            <div className="chatActionContent">
                {activeHeader==="pinned" && <ChatPinned/>}
                {activeHeader==="search" && <ChatSearch searchedMessages={searchedMessages} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} isOpen={isSearchOpen} setIsOpen={setIsSearchOpen}/>}
                {activeHeader==="choosing" && <ChatChoosingMess/>}
            </div>
            <button type="button" className="chatActionMenu" aria-label={t("chatUi.openPanel")} onClick={event=>{
                const box=event.currentTarget.getBoundingClientRect();
                showMenu(box.left,box.bottom+4);
            }}><DotsThreeOutlineVerticalIcon weight="fill"/></button>
        </div>
        {activeHeader==="pinned" && <PmsList/>}
        {activeHeader==="search" && <SearchList isOpen={isSearchOpen} searchDivRef={searchDivRef} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} searchedMessages={searchedMessages}/>}
    </div>;
}
