import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
    const panelVisible = modes.includes(activeHeader);
    const [hidden, setHidden] = useState(false);
    const [drag, setDrag] = useState<number | null>(null);
    const hostRef = useRef<HTMLElement | null>(null);
    const hiddenRef = useRef(false);
    hiddenRef.current = hidden;
    const panelHeight = () => pmRef.current?.offsetHeight || 0;
    const hidePanel = () => { setHidden(true); setDrag(null); };

    const applyInset = (host: HTMLElement, next: string) => {
        if (host.style.getPropertyValue("--chat-action-bottom") === next) return;
        const chat = host.querySelector<HTMLDivElement>(":scope > .chat");
        const oldTop = chat?.scrollTop || 0;
        const oldHeight = chat?.scrollHeight || 0;
        const oldPadding = chat ? parseFloat(getComputedStyle(chat).paddingTop) || 0 : 0;
        const previousAnchor = chat?.style.overflowAnchor || "";
        if (chat) chat.style.overflowAnchor = "none";
        host.style.setProperty("--chat-action-bottom", next);
        if (chat) {
            const delta = (parseFloat(getComputedStyle(chat).paddingTop) || 0) - oldPadding;
            // At the start keep the first message accessible; elsewhere preserve the visible content.
            if (oldTop > 2) chat.scrollTop = Math.max(0, oldTop + delta);
            else chat.scrollTop = 0;
            chat.dispatchEvent(new CustomEvent("chat-action-inset", { detail: {height: chat.scrollHeight - oldHeight, top: chat.scrollTop - oldTop} }));
            chat.style.overflowAnchor = previousAnchor;
        }
    };

    useLayoutEffect(() => {
        const panel = pmRef.current;
        const host = panel?.parentElement || hostRef.current;
        if (!host) return;
        hostRef.current = host;
        const updateInset = () => {
            const next = panelVisible && !hidden && panel ? `${Math.ceil(panel.offsetTop + panel.offsetHeight)}px` : "0px";
            applyInset(host, next);
        };
        updateInset();
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateInset);
        if (panel) observer?.observe(panel);
        observer?.observe(host);
        window.addEventListener("resize", updateInset);
        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", updateInset);
        };
    }, [panelVisible, hidden, pmRef]);
    useLayoutEffect(() => () => {
        if (hostRef.current) applyInset(hostRef.current, "0px");
    }, []);

    useEffect(() => {
        const host = hostRef.current;
        const chat = host?.querySelector<HTMLDivElement>(":scope > .chat");
        if (!host || !chat || !panelVisible) return;
        let userUntil = 0;
        let startTop = chat.scrollTop;
        const arm = () => {
            if (performance.now() > userUntil) startTop = chat.scrollTop;
            userUntil = performance.now() + 700;
        };
        const onScroll = () => {
            if (!hiddenRef.current && !blocked.current && performance.now() < userUntil &&
                Math.abs(chat.scrollTop - startTop) >= 24) {
                userUntil = 0;
                hidePanel();
            }
        };
        const onHeader = (event: Event) => {
            const { phase, dy } = (event as CustomEvent<{phase:string;dy:number}>).detail;
            if (phase === "move") {
                setDrag(Math.min(0, Math.max(-panelHeight(), (hiddenRef.current ? -panelHeight() : 0) + dy)));
            } else {
                if (phase === "end") {
                    if (hiddenRef.current && dy >= Math.min(40, panelHeight() / 2)) setHidden(false);
                    else if (!hiddenRef.current && dy <= -40) setHidden(true);
                }
                setDrag(null);
            }
        };
        chat.addEventListener("touchstart", arm, {passive:true});
        chat.addEventListener("touchmove", arm, {passive:true});
        chat.addEventListener("wheel", arm, {passive:true});
        chat.addEventListener("scroll", onScroll, {passive:true});
        host.addEventListener("chat-panel-header-gesture", onHeader);
        return () => {
            chat.removeEventListener("touchstart", arm);
            chat.removeEventListener("touchmove", arm);
            chat.removeEventListener("wheel", arm);
            chat.removeEventListener("scroll", onScroll);
            host.removeEventListener("chat-panel-header-gesture", onHeader);
        };
    }, [panelVisible, pmRef]);

    useEffect(() => {
        setHidden(false);
        setDrag(null);
    }, [activeHeader]);

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
        let press: {x:number;y:number;id:number;axis:"x"|"y"|null} | null = null;
        const release = () => {
            if (press?.axis) setDontHandle(false);
            press = null;
            setDrag(null);
        };
        const start = (event: TouchEvent) => {
            release();
            suppressClick.current = false;
            if (event.touches.length !== 1 || blocked.current || !(event.target instanceof Element) ||
                event.target.closest("input,textarea,button")) return;
            const touch = event.touches[0];
            press = {x:touch.clientX,y:touch.clientY,id:touch.identifier,axis:null};
        };
        const move = (event:TouchEvent) => {
            if (!press || blocked.current || event.touches.length !== 1 || event.defaultPrevented) { release(); return; }
            const touch = event.touches[0];
            if (touch.identifier !== press.id) { release(); return; }
            const dx = touch.clientX-press.x, dy = touch.clientY-press.y;
            if (!press.axis) {
                if (Math.max(Math.abs(dx),Math.abs(dy)) < 8) return;
                press.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                suppressClick.current=true;
                setDontHandle(true);
            }
            if (event.cancelable) event.preventDefault();
            if (press.axis === "y") setDrag(Math.max(-panelHeight(), Math.min(0, dy)));
        };
        const end = (event:TouchEvent) => {
            if (press?.axis && !blocked.current) {
                const touch=Array.from(event.changedTouches).find(touch=>touch.identifier===press?.id);
                if (touch && press.axis === "y" && touch.clientY - press.y <= -Math.min(40, panelHeight() / 2)) setHidden(true);
                if (touch && press.axis === "x" && Math.abs(touch.clientX-press.x)>=40) {
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

    if (!panelVisible) return null;
    const showMenu = (x:number,y:number) => openMenu(x,y,"chatAction",{id:"chatAction"});
    const offset = drag ?? 0;
    const fullyHidden = hidden && drag === null;
    return <div className={`chatActionPanel${drag !== null ? " dragging" : ""}${hidden && drag === null ? " panelHidden" : ""}`} ref={pmRef}
        style={{ transform: fullyHidden ? "translate(-50%, -100%)" : `translate(-50%, ${offset}px)`, clipPath: fullyHidden ? "inset(100% 0 0 0)" : `inset(${-offset}px -8px -8px -8px)` }} inert={fullyHidden}>
        <div ref={rowRef} className="chatActionRow" data-context-menu="true" data-context-menu-allow-button
            onContextMenu={event=>{event.preventDefault();event.stopPropagation();showMenu(event.clientX,event.clientY);}}
            onClickCapture={event=>{if(suppressClick.current){suppressClick.current=false;event.preventDefault();event.stopPropagation();}}}>
            <div className="chatActionContent">
                {activeHeader==="pinned" && <ChatPinned/>}
                {activeHeader==="search" && <ChatSearch searchedMessages={searchedMessages} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} isOpen={isSearchOpen} setIsOpen={setIsSearchOpen}/>}
                {activeHeader==="choosing" && <ChatChoosingMess/>}
            </div>
        </div>
        {activeHeader==="pinned" && <PmsList/>}
        {activeHeader==="search" && <SearchList isOpen={isSearchOpen} searchDivRef={searchDivRef} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} searchedMessages={searchedMessages}/>}
    </div>;
}
