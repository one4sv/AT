import { useTranslation } from "react-i18next";
import { BookmarkSimpleIcon, CircleIcon, UserIcon } from "@phosphor-icons/react"
import "./scss/ChatWithInfo.scss"
import "../../pages/Acc/scss/AccInfo.scss"
import { useBlackout } from "../hooks/BlackoutHook"
import { useChat } from "../hooks/ChatHook"
import useContactAlias from "../hooks/utils/useContactAlias"
import useCompactLayout from "../hooks/utils/useCompactLayout"
import { useUser } from "../hooks/UserHook"
import { useNavigate } from "react-router"
import ChatMedia from "./components/ChatMedia"
import { api } from "../ts/api";
import { useContacts } from "../hooks/ContactsHook"
import formatLastOnline from "../ts/utils/formatOnline"
import { useEffect, useRef, useState } from "react";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useContextMenu } from "../hooks/ContextMenuHook";

export default function ChatWithInfo() {
    const { t } = useTranslation("common");
    const isMobile = useCompactLayout();
    const { chatWith, library } = useChat()
    const { user } = useUser()
    const isFavorite = !!chatWith && !chatWith.is_group && chatWith.id === user.id;
    const savedChatId = isFavorite && chatWith?.chat_id ? String(chatWith.chat_id) : "";
    const [savedSummary, setSavedSummary] = useState<{ id: string; counts: Record<"media" | "link" | "file", number> } | null>(null);
    const [summaryFailed, setSummaryFailed] = useState(false);
    const [summaryRetry, setSummaryRetry] = useState(0);
    const counts = savedSummary?.id === savedChatId ? savedSummary.counts : null;
    useEffect(() => {
        if (!savedChatId) { setSavedSummary(null); return; }
        const controller = new AbortController();
        setSummaryFailed(false);
        void api.get("chat/library/" + savedChatId, { params: { summary: 1 }, signal: controller.signal }).then(response => {
            const data = response.data.counts;
            if (!response.data.success || !data || ![data.media, data.link, data.file].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error("Invalid library summary");
            if (!controller.signal.aborted) setSavedSummary({ id: savedChatId, counts: data });
        }).catch(() => { if (!controller.signal.aborted) setSummaryFailed(true); });
        return () => controller.abort();
    }, [savedChatId, library, summaryRetry]);
    const [alias] = useContactAlias(chatWith?.is_group ? undefined : chatWith?.id);
    const { setBlackout } = useBlackout()
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
            const body = sheet.querySelector(".chatMediaBody.active");
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
                    const body = sheet.querySelector(".chatMediaBody.active");
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
            {isFavorite ? <div className="chatSavedInfo">
                <BookmarkSimpleIcon weight="regular" aria-hidden="true"/>
                <div className="chatSavedTitle">{t("chatUi.favorites")}</div>
                <div className="chatSavedSubtitle">{t("chatMedia.savedStorage")}</div>
                <div className="chatSavedStats" aria-busy={!counts && !summaryFailed}>
                    {(["media", "link", "file"] as const).map(category => <div className="chatSavedStat" key={category}>
                        <span className="chatSavedStatCount">{counts ? counts[category].toLocaleString() : "—"}</span>
                        <span className="chatSavedStatLabel">{t("chatMedia.savedCount." + category)}</span>
                    </div>)}
                </div>
                {summaryFailed && <button type="button" className="chatSavedRetry" onClick={() => setSummaryRetry(value => value + 1)}>{t("chatMedia.retry")}</button>}
            </div> : <div className="accInfoMain chatWithInfoMain" onClick={() => {                    
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
            </div>}
            </div></div>
            <ChatMedia key={chatWith.chat_id}/>
        </div>
    )
}