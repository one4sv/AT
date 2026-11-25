import { useTranslation } from "react-i18next";
import { ChatTeardropIcon, CheckCircle, Circle, CircleIcon, MagnifyingGlassIcon, PushPinIcon, UserIcon } from "@phosphor-icons/react"
import "./scss/ChatWithInfo.scss"
import "../../pages/Acc/scss/AccInfo.scss"
import { useBlackout } from "../hooks/BlackoutHook"
import { useChat } from "../hooks/ChatHook"
import useContactAlias from "../hooks/utils/useContactAlias"
import useCompactLayout from "../hooks/utils/useCompactLayout"
import { useMessages } from "../hooks/MessagesHook"
import { useNavigate } from "react-router"
import ChatMedia from "./components/ChatMedia"
import { useContacts } from "../hooks/ContactsHook"
import formatLastOnline from "../ts/utils/formatOnline"
import { useEffect, useRef, useState } from "react";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useContextMenu } from "../hooks/ContextMenuHook";

export default function ChatWithInfo() {
    const { t } = useTranslation("common");
    const isMobile = useCompactLayout();
    const { chatWith, activeHeader:header, setActiveHeader:setHeader, messages } = useChat()
    const [alias] = useContactAlias(chatWith?.is_group ? undefined : chatWith?.id);
    const { setBlackout } = useBlackout()
    const { setChosenMess } = useMessages();
    const { onlineMap } = useContacts();

    const navigate = useNavigate()
    const [expanded, setExpanded] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const { dontHandleOther } = useSideMenu();
    const { menu } = useContextMenu();
    const blocked = useRef(false);
    blocked.current = dontHandleOther || menu.visible;
    useEffect(() => {
        setExpanded(false);
    }, [chatWith?.chat_id]);
    useEffect(() => {
        const sheet = sheetRef.current;
        if (!sheet || !isMobile) return;
        let start: { x: number; y: number; id: number; atTop: boolean; owned: boolean } | null = null;
        const onStart = (event: TouchEvent) => {
            start = null;
            if (event.touches.length !== 1 || blocked.current || !(event.target instanceof Element) ||
                event.target.closest(".selector, button, input, textarea, a, [role=button]")) return;
            const touch = event.touches[0];
            const body = sheet.querySelector(".chatMediaBody");
            start = { x: touch.clientX, y: touch.clientY, id: touch.identifier, atTop: !!event.target.closest(".chatInfoSheetHandle") || !body || body.scrollTop <= 2, owned: false };
        };
        const onMove = (event: TouchEvent) => {
            if (!start || event.touches.length !== 1 || blocked.current || event.defaultPrevented) { start = null; return; }
            const touch = event.touches[0];
            if (touch.identifier !== start.id) { start = null; return; }
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (!start.owned && Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) { start = null; return; }
            if (!start.owned && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
                if ((!expanded && dy < 0) || (expanded && start.atTop && dy > 0)) start.owned = true;
                else { start = null; return; }
            }
            if (start.owned && event.cancelable) event.preventDefault();
        };
        const onEnd = (event: TouchEvent) => {
            const current = start;
            start = null;
            if (!current?.owned || blocked.current) return;
            const touch = Array.from(event.changedTouches).find(item => item.identifier === current.id);
            if (!touch) return;
            const dy = touch.clientY - current.y;
            if (Math.abs(dy) >= 32) {
                if (dy > 0) {
                    const body = sheet.querySelector(".chatMediaBody");
                    if (body) body.scrollTop = 0;
                }
                setExpanded(dy < 0);
            }
        };
        const onCancel = () => { start = null; };
        sheet.addEventListener("touchstart", onStart, { passive: true });
        sheet.addEventListener("touchmove", onMove, { passive: false });
        sheet.addEventListener("touchend", onEnd);
        sheet.addEventListener("touchcancel", onCancel);
        return () => {
            sheet.removeEventListener("touchstart", onStart);
            sheet.removeEventListener("touchmove", onMove);
            sheet.removeEventListener("touchend", onEnd);
            sheet.removeEventListener("touchcancel", onCancel);
        };
    }, [isMobile, expanded, chatWith?.chat_id]);

    if (chatWith === null) return

    const presence = !chatWith.is_group && <span className={`accOnlineStauts ${onlineMap[chatWith.id] ? "online" : "offline"}`}>
        <CircleIcon size={16} weight="fill" aria-hidden="true"/>
        {onlineMap[chatWith.id] ? t("online") : formatLastOnline(chatWith.last_online)}
    </span>;

    return (
        <div ref={sheetRef} className={`chatWithInfoDiv${expanded && isMobile ? " infoExpanded" : ""}`}>
            {isMobile && <div className="chatInfoSheetHandle" aria-hidden="true" />}
            <div className="chatInfoCollapse"><div className="chatInfoCollapseInner">
            <div className="accInfoMain chatWithInfoMain" onClick={() => {                    
                if (chatWith.is_group) navigate(`/room/${chatWith.id}`)
                else navigate(`/acc/${chatWith.nick}`)
                setBlackout({seted:false})
            }}>
                <div
                    className="accPic"
                >
                    {chatWith?.avatar_url ? (
                        <img src={chatWith.avatar_url} alt="avatar" className="avatarImg" />
                    ) : (
                        <UserIcon size={128} />
                    )}
                </div>
                <div className="accInfoNames">
                    <div className="accMainInfoStr">
                        <div className="accInput nameInput">{alias || chatWith?.name}</div>
                    </div>
                    <div className="accNickStr">
                        {!isMobile && "@"}
                        <div className="accInput nickInput">{chatWith?.nick}</div>
                    </div>
                    {presence}
                </div>
            </div>
            <div className="settingInnerList">
                <div
                    className="settingInnerButt"
                    onClick={() => {
                        if (header === "search") setHeader("text")
                        else setHeader("search")
                        setBlackout({seted:false})
                    }}
                >
                    {header === "search" ? <ChatTeardropIcon weight="fill" /> : <MagnifyingGlassIcon />}
                    {t(header === "search" ? "chatUi.message" : "chatUi.searchMessages")}
                </div>            
                {messages.find(m => m.is_pinned) ? (
                    <div
                        className="settingInnerButt"
                        onClick={() => {
                            if (header === "pinned") setHeader("text")
                            else setHeader("pinned")
                            setBlackout({seted:false})
                        }}
                    >
                        {header === "pinned" ? <ChatTeardropIcon weight="fill" /> : <PushPinIcon weight="fill"/>}
                        {header === "pinned" ? t("chatUi.message") : t("chatUi.pinnedCount", { count: messages.filter(m => m.is_pinned).length })}
                    </div>
                ) : ""}
                <div
                    className="settingInnerButt"
                    onClick={() => {
                        if (header === "choosing") setHeader("text")
                        else setHeader("choosing");
                        setChosenMess([]);
                        setBlackout({seted:false})
                    }}
                >
                    {header === "choosing" ? <Circle /> : <CheckCircle />}
                    {t(header === "choosing" ? "chatUi.cancelSelection" : "chatUi.selectMessages")}
                </div>
            </div>
            </div></div>
            <ChatMedia/>
        </div>
    )
}