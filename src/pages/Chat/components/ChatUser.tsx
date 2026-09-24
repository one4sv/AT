import { ChevronDown, ChevronUp, CircleUserRound, X } from "lucide-react";
import { useNavigate } from "react-router";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState, type RefObject, type SetStateAction } from "react";
import type { activeHeaderType, message } from "../../../components/context/ChatContext";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { BookmarkSimpleIcon, CalendarCheckIcon, CopySimple, DotsThreeOutlineVerticalIcon, List, MagnifyingGlassIcon, PushPinIcon, ShareFat, TextIndentIcon, Trash } from "@phosphor-icons/react";
import { useDelete } from "../../../components/hooks/DeleteHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { usePinnedMessages } from "../../../components/hooks/PinnedMessagesHook";
import UserInChatUserList from "./UserInChatUserList";
import { useSideMenu } from "../../../components/hooks/SideMenuHook";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useNote } from "../../../components/hooks/NoteHook";

interface ChatUserProps {
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    selectedIndex: number;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    searchedMessages: message[];
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleArrowClick: (dir: "up" | "down") => void;
    scrollToMessage: (id: number) => void;
    searchItemRefs: React.MutableRefObject<Map<number, HTMLDivElement | null>>;
    isChose:boolean,
    setIsChose:React.Dispatch<React.SetStateAction<boolean>>,
    chosenMess:{id:number, text:string}[],
    setChosenMess:React.Dispatch<React.SetStateAction<{id:number, text:string}[]>>,
    searchInputRef: RefObject<HTMLInputElement | null>,
    activeHeader: activeHeaderType,
    setActiveHeader: React.Dispatch<SetStateAction<activeHeaderType>>
}

export default function ChatUser({
    search,
    setSearch,
    selectedIndex,
    setSelectedIndex,
    searchedMessages,
    handleSearchKeyDown,
    handleArrowClick,
    scrollToMessage,
    searchItemRefs,
    searchInputRef,
    activeHeader,
    setActiveHeader
}: ChatUserProps) {
    const { user } = useUser()
    const { chatWith, typingMap, messages } = useChat();
    const { onlineMap } = useContacts()
    const { openMenu, menu, closeMenu } = useContextMenu();
    const { setDeleteConfirm, setDeleteMess } = useDelete()
    const { setChosenMess, chosenMess, setIsChose, isChose, setRedirect } = useMessages()
    const { setBlackout } = useBlackout()
    const { openSideMenu } = useSideMenu()
    const { layout } = useSettings()
    const { showNotification } = useNote()
    const {
        pms,
        currentpm,
        showNow,
        showList,
        isHolding,
        longPressTriggered,
        pmRef,
        listRef,
        setShowList,
        mouseDown,
        mouseUp,
        scrollToPin,
    } = usePinnedMessages(
        messages.filter(m => m.is_pinned),
        scrollToMessage
    )

    const navigate = useNavigate();
    
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ hovered, setHovered ] = useState(false);

    const nameRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const searchDivRef = useRef<HTMLDivElement | null>(null);
    const chatUserRef = useRef<HTMLDivElement | null>(null);
    const isFavorite = chatWith?.id === user.id
    
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchDivRef.current &&
                !searchDivRef.current.contains(e.target as Node) &&
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsSearchOpen(search.trim().length > 0);
    }, [search]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!chatUserRef.current || !chatWith) return;

        if (menu.visible) {
            closeMenu()
            return
        }

        const rect = chatUserRef.current.getBoundingClientRect();
        const x = isMobile ? (rect.left + rect.width * 0.42) : (rect.left + rect.width * 0.865);
        const y = isMobile ? (window.innerHeight * 0.075) : (window.innerHeight * 0.055);

        openMenu(x, y, "acc", {
            id: chatWith.id,
            name: chatWith.name ? chatWith.name : chatWith.nick,
            nick: chatWith.nick
        }, undefined, {
            note: chatWith.note,
            is_blocked: chatWith.is_blocked,
            pinned: chatWith.pinned,
            is_group: chatWith.is_group,
            activeHeader:activeHeader,
            setActiveHeader:setActiveHeader
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
                        {note:chatWith.note, is_blocked:chatWith.is_blocked, pinned:chatWith.pinned, is_group:chatWith.is_group, activeHeader:activeHeader, setActiveHeader:setActiveHeader}
                    )
                }}
            >
                <div className={`chatUserMain ${activeHeader === "user" ? "active" : ""}`}>
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
                <div className={`chatSearchWrapper ${activeHeader === "search" ? "active" : ""}`}
                    ref={searchRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="chatSearch">
                        <input
                            type="text"
                            placeholder="Поиск по сообщениям"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
                            onFocus={() => setIsSearchOpen(true)}
                            onKeyDown={handleSearchKeyDown}
                            ref={searchInputRef}
                        />
                        {search.length > 0 ? (
                            <X color="white" cursor="pointer" onClick={() => { setSearch(""); setSelectedIndex(0); setIsSearchOpen(false); }}/>
                        ): (
                            <MagnifyingGlassIcon/>
                        )}
                    </div>
                </div>
                <div className={`pinnedMessages ${activeHeader === "pinned" ? "active" : ""}`} ref={pmRef} style={{cursor:isHolding ? "grabbing" : "pointer"}} onClick={(e) => e.stopPropagation()}>
                    <div className="pmsMain">
                        <div className="pmShowInfo" onMouseDown={mouseDown}
                            onMouseUp={mouseUp}
                            onClick={() => {
                                if (longPressTriggered.current) return
                                scrollToPin(currentpm, showNow)
                            }}
                        >
                            <span className="pmsCount">
                                {showNow + 1}/{pms.length} закреплённое сообщение
                            </span>
                            <div className="pmsShowNow">
                                <span className="pmsSender">
                                    {currentpm?.sender_id === user.id ? "Вы" : currentpm?.sender_name || currentpm?.sender_nick}: 
                                </span>
                                &nbsp;
                                <span className="pmsText">
                                    {currentpm?.content
                                        ? currentpm?.content
                                        : currentpm?.files && currentpm?.files.length > 0
                                            ? `${currentpm.files?.length} mediafiles`
                                            : "Пересланное сообщение"}
                                </span>
                            </div>
                        </div>
                        <div className="showList" onClick={(e) => {
                            e.preventDefault()
                            setShowList(!showList)
                        }}>
                            <List/>
                        </div>
                    </div>
                </div>
                {!isMobile ? (
                    <div className="chatUserMenu" onClick={(e) => e.stopPropagation()}>
                        {messages.find(m => m.is_pinned) ? (
                            <div
                                className="chatUserMenuButt"
                                onClick={() => {
                                    if (activeHeader !== "pinned") setActiveHeader("pinned")
                                    else setActiveHeader("user")
                                }}
                            >
                                <PushPinIcon weight="fill" size={22}/>
                            </div>
                        ) : ""}
                        <div 
                            className="chatUserMenuButt"
                            onClick={() => {
                                if (activeHeader !== "search") setActiveHeader("search")
                                else setActiveHeader("user")
                            }}
                        >
                            <MagnifyingGlassIcon size={22}/>
                        </div>                        
                        <div 
                            className="chatUserMenuButt" 
                            onClick={() => {
                                if (activeHeader !== "habit") setActiveHeader("habit")
                                else setActiveHeader("user")
                                showNotification("info", "В разработке")
                            }}
                        >
                            <CalendarCheckIcon weight="fill" size={22}/>
                        </div>
                    </div>
                ): ""}
            </div>
            <div className="headerButt" onClick={handleMenuClick}>
                <DotsThreeOutlineVerticalIcon weight="fill"/>
            </div>
            {isChose && ! isMobile && (
                <div className="ChosenCountDiv">
                    <div className="ChosenCount" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => {
                        setIsChose(false)
                        setChosenMess([])
                    }}>
                        {hovered ? (
                            <>Отменить</>
                        ) : (
                            <span>Выбрано: {chosenMess.length} сообщений</span>
                        )}
                    </div>
                    <div className="ChosenCountButt" onClick={() => {
                        if (chosenMess.length === 0) return 
                            const result = chosenMess
                                .sort((a,b) => a.id - b.id)
                                .map(m => m.text)
                                .join("\n")
                            navigator.clipboard.writeText(result)
                    }}>
                        <CopySimple/>
                        Копировать выбронное
                    </div>
                    <div className="ChosenCountButt" onClick={() =>  {
                        setRedirect(messages.filter(m => chosenMess.some(cm => cm.id === m.id)))
                        setBlackout({seted:true, module:"Redirecting"})
                    }}>
                        <ShareFat/>
                        Переслать выбронное
                    </div>
                    <div className="ChosenCountButt delete" onClick={() => {
                        if (chosenMess.length === 0) return
                        setDeleteConfirm({goal:"mess", id:"", name:"сообщений"})
                        setDeleteMess(chosenMess.map((m) => m.id))
                        setBlackout({seted:true, module:"Delete"})
                    }}>
                        <Trash/>
                        Удалить выбранное
                    </div>
                </div>
            )}
            {search.trim().length > 0 && activeHeader === "search" && (
                <div
                    ref={searchDivRef}
                    className={`chatSearchDiv ${isSearchOpen ? "open" : "closed"}`}
                >
                    <div className="chatSearchInfo">
                        <span>{searchedMessages.length} результатов</span>
                        <div>
                            <button onClick={() => handleArrowClick("up")} disabled={!searchedMessages.length}><ChevronUp/></button>
                            <button onClick={() => handleArrowClick("down")} disabled={!searchedMessages.length}><ChevronDown/></button>
                        </div>
                    </div>
                    <div className="chatSearchList">
                        {searchedMessages.map((m, i) => {
                            return (
                                <div
                                    key={m.id}
                                    className={`chatSearchItem ${selectedIndex === i ? "active" : ""}`}
                                    onClick={() => { setSelectedIndex(i); scrollToMessage(m.id); }}
                                    ref={(el) => { searchItemRefs.current.set(m.id, el) }}
                                >
                                    <UserInChatUserList m={m}/>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {messages.find(m => m.is_pinned) && (
                <div className={`pmsList ${showList ? "open" : "close"}`} ref={listRef} onMouseUp={mouseUp}>
                    {pms.map((pm, i) => (
                        <div className="pm" key={pm.id} onClick={() => scrollToPin(pm, i)} onMouseUp={() => {
                            scrollToPin(pm, i)
                            setShowList(false)
                            mouseUp()
                        }}
                        >
                            <UserInChatUserList m={pm}/>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}