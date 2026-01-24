import { ChevronDown, ChevronLeft, ChevronUp, CircleUserRound, X, Search } from "lucide-react";
import { useNavigate } from "react-router";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState } from "react";
import type { message } from "../../../components/context/ChatContext";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { CopySimple, DotsThreeOutlineVertical, ShareFat, Trash } from "@phosphor-icons/react";
import { useDelete } from "../../../components/hooks/DeleteHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import PinnedMessages from "./PinnedMessages";
import UserInChatUserList from "./UserInChatUserList";

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
}: ChatUserProps) {
    const { chatWith, onlineMap, typingMap, messages } = useChat();
    const { openMenu, menu, closeMenu } = useContextMenu();
    const { setDeleteConfirm, setDeleteMess } = useDelete()
    const { setChosenMess, chosenMess, setIsChose, isChose, setRedirect } = useMessages()
    const { setBlackout } = useBlackout()
    const navigate = useNavigate();
    
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ hovered, setHovered ] = useState(false);
   
    const nameRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const searchDivRef = useRef<HTMLDivElement | null>(null);
    const chatUserRef = useRef<HTMLDivElement | null>(null);

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
        const x = rect.left + rect.width * 0.86; // 95% от ширины .chatUser
        const y = window.innerHeight * 0.065; // 6.5vh от верха viewport

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

    return (
        <div className="chatUser" ref={chatUserRef}>
            {isMobile && (
                <div className="chatUserBack" onClick={() => navigate("/")}>
                    <ChevronLeft />
                </div>
            )}
            <div className={`chatUserInfo ${isMobile ? "mobile" : ""}`}
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
                <div className="chatUserPick">
                    {chatWith && chatWith.avatar_url ? (
                        <img className="chatUserAvatar" src={chatWith.avatar_url} alt={chatWith.name ?? chatWith.nick} />
                    ) : (
                        <CircleUserRound/>
                    )}
                </div>
                <div className="chatUserName">
                    <span>{chatWith ? chatWith.name || chatWith.nick : ""}</span>
                    <span className={`chatOnlineStauts ${typingText ? "chatTyping" : "chatStopTyping"}`}>
                        {chatWith?.is_group
                            ? typingText
                                ? typingText
                                : `${chatWith.members.length} ${chatWith.members.length > 5 ? "участников" : "участника"}${curOnline > 0 ? `, ${curOnline} в сети`  : ""} `
                                : typingText
                                    ? typingText
                                    : onlineMap[chatWith?.id || ""]
                                        ? "В сети"
                                        : formatLastOnline(chatWith?.last_online)}
                    </span>
                </div>
            </div>
            
            {messages.find(m => m.is_pinned) && (
                <PinnedMessages pms={messages.filter(m => m.is_pinned)} scrollToMessage={scrollToMessage}/>
            )}
            <div className={`chatSearchWrapeer ${isMobile ? "mobile" : ""}`}
                style={{position: search.length > 0 ? "absolute" : "relative", marginLeft:search.length > 0 ? "4.5%" : "0"}} 
                ref={searchRef}
            >
                <div className="chatSearch">
                    <input
                        type="text"
                        placeholder="Поиск по сообщениям"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0) }}
                        onFocus={() => setIsSearchOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {search.length > 0 ? (
                        <X color="white" cursor="pointer" onClick={() => { setSearch(""); setSelectedIndex(0); setIsSearchOpen(false); }}/>
                    ): (
                        <Search/>
                    )}
                </div>
                {search.trim().length > 0 && (
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
            </div>
            <div className="userMenuCall" onClick={handleMenuClick}>
                <DotsThreeOutlineVertical weight="fill"/>
            </div>
            {isChose && (
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
        </div>
    );
}