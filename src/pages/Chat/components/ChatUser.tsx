import { useNavigate } from "react-router";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useChat } from "../../../components/hooks/ChatHook";
import { useRef } from "react";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { BookmarkSimpleIcon, CalendarCheckIcon, ChatTeardropIcon, DotsThreeOutlineVerticalIcon, MagnifyingGlassIcon, PushPinIcon, TextIndentIcon } from "@phosphor-icons/react";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useUser } from "../../../components/hooks/UserHook";
import { CircleUserRound } from "lucide-react";
import { useNote } from "../../../components/hooks/NoteHook";

export default function ChatUser() {
    const { user } = useUser()
    const { chatWith, typingMap, messages, activeHeader, setActiveHeader } = useChat();
    const { onlineMap } = useContacts()
    const { openMenu, menu, closeMenu } = useContextMenu();
    const { openSideMenu } = useSideMenu()
    const { layout } = useSettings()
    const { showNotification } = useNote()
    const navigate = useNavigate();

    const nameRef = useRef<HTMLDivElement | null>(null);
    const chatUserRef = useRef<HTMLDivElement | null>(null);
    const isFavorite = chatWith?.id === user.id

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!chatUserRef.current || !chatWith) return;

        if (menu.visible) {
            closeMenu()
            return
        }

        const rect = chatUserRef.current.getBoundingClientRect();
        const x = isMobile ? (rect.left + rect.width * 0.52) : (rect.left + rect.width * 0.865);
        const y = isMobile ? (window.innerHeight * 0.075) : (window.innerHeight * 0.055);

        openMenu(x, y, "acc", {
            id: chatWith.id,
            name: chatWith.name ? chatWith.name : chatWith.nick,
            nick: chatWith.nick
        }, undefined, {
            note: chatWith.note,
            is_blocked: chatWith.is_blocked,
            pinned: chatWith.pinned,
            is_group: chatWith.is_group
        });
    };

    const typingNames = typingMap[chatWith?.id || ''] || [];
    const typingText =
        typingNames.length > 0
            ? chatWith?.is_group
                ? `${typingNames.slice(0, 3).join(", ")}${typingNames.length > 3 ? "…" : ""} печатает...`
                : "Печатает..."
            : null;

    const curOnline = chatWith ? chatWith.members.filter(m => onlineMap[m.id]).length - 1 : 0

    const name = () => {
        if (isFavorite) return "Избранное"
        else if (chatWith) return chatWith.name || chatWith.nick
        else return ""
    }

    const img = () => {
        if (isFavorite) return <BookmarkSimpleIcon weight="fill" className="favoriteIcon"/>
        else if (chatWith && chatWith.avatar_url) {
            return (
                <img
                    className="chatUserAvatar"
                    src={chatWith.avatar_url}
                    alt={chatWith.name ?? chatWith.nick}
                />
            )
        } else {
            return <CircleUserRound />
        }
    }

    const status = () => {
        if (isFavorite) return user.nick

        if (!chatWith) return ""

        if (chatWith.is_group) {
            if (typingText) return typingText

            return `${chatWith.members.length} ${
                chatWith.members.length > 5
                    ? "участников"
                    : "участника"
            }${curOnline > 0 ? `, ${curOnline} в сети` : ""}`
        }

        if (typingText) return typingText

        return onlineMap[chatWith.id || ""]
            ? "онлайн"
            : formatLastOnline(chatWith.last_online)
    }

    return (
        <div className="headerDiv" ref={chatUserRef}>
            {isMobile || layout === "hidden" ? (
                <div className="headerButt"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => openSideMenu()}
                >
                    <TextIndentIcon />
                </div>
            ) : ""}
            <div className="header chatUserInfo"
                onClick={() => {
                    if (!chatWith) return;
                    if (chatWith.is_group) navigate(`/room/${chatWith.id}`)
                    else navigate(`/acc/${chatWith.nick}`)
                }} 
                ref={nameRef}
                onContextMenu={(e) => {
                    if (!chatWith) return;
                    e.preventDefault()
                    openMenu(e.clientX, e.clientY, "acc", {id:chatWith.id, name:chatWith.name ? chatWith.name : chatWith.nick, nick:chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick}, undefined,
                        {note:chatWith.note, is_blocked:chatWith.is_blocked, pinned:chatWith.pinned, is_group:chatWith.is_group}
                    )
                }}
            >
                <div className="chatUserMain">
                    <div className="chatUserPick">
                        {img()}
                    </div>
                    <div className="chatUserName">
                        <span>{name()}</span>
                        <span className={`chatOnlineStauts ${typingText ? "chatTyping" : "chatStopTyping"}`}>
                            {status()}
                        </span>
                    </div>
                </div>
                {!isMobile ? (
                    <div className="chatUserMenu" onClick={(e) => e.stopPropagation()}>
                        {messages.find(m => m.is_pinned) ? (
                            <div
                                className="chatUserMenuButt"
                                onClick={() => {
                                    if (activeHeader !== "pinned") setActiveHeader("pinned")
                                    else setActiveHeader("text")
                                }}
                            >
                                {activeHeader === "pinned" ? <ChatTeardropIcon weight="fill" size={22}/> : <PushPinIcon weight="fill" size={22}/>}
                            </div>
                        ) : ""}
                        <div 
                            className="chatUserMenuButt"
                            onClick={() => {
                                if (activeHeader !== "search") setActiveHeader("search")
                                else setActiveHeader("text")
                            }}
                        >
                            {activeHeader === "search" ? <ChatTeardropIcon weight="fill" size={22}/> : <MagnifyingGlassIcon size={22}/>}
                        </div>                        
                        <div 
                            className="chatUserMenuButt" 
                            onClick={() => {
                                setActiveHeader("text")
                                showNotification("info", "В разработке")
                            }}
                        >
                            {activeHeader === "habit" ? <ChatTeardropIcon weight="fill" size={22}/> : <CalendarCheckIcon weight="fill" size={22}/>}
                        </div>
                    </div>
                ) : ""}
                
            </div>
            <div className="headerButt" onClick={handleMenuClick}>
                <DotsThreeOutlineVerticalIcon weight="fill"/>
            </div>
        </div>
    );
}