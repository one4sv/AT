import { ChevronDown, ChevronLeft, ChevronUp, CircleUserRound, X, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useUser } from "../../../components/hooks/UserHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState } from "react";
import type { message } from "../../../components/context/ChatContext";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { CopySimple, DotsThreeOutlineVertical, ShareFat, Trash } from "@phosphor-icons/react";
import { useDelete } from "../../../components/hooks/DeleteHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";

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
    const { user } = useUser();
    const { chatWith, onlineMap, typingStatus } = useChat();
    const { openMenu, menu, closeMenu } = useContextMenu();
    const { setDeleteConfirm, setDeleteMess, setChosenMess, chosenMess, setIsChose, isChose } = useDelete()
    const { setBlackout } = useBlackout()
    const navigate = useNavigate();
    const { nick } = useParams();
    
    const [ isSearchOpen, setIsSearchOpen ] = useState(false);
    const [ hovered, setHovered ] = useState(false);
   
    const nameRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const searchDivRef = useRef<HTMLDivElement | null>(null);
    const chatUserRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!nameRef.current || !searchRef.current) return;
        if (search.length > 0) {
            nameRef.current.style.width = "0";
            searchRef.current.style.width = "100%";
        } else {
            if (!isMobile) {
                nameRef.current.style.width = "40%";
                searchRef.current.style.width = "50%";
            } else {
                nameRef.current.style.width = "70%";
            }
        }
    }, [search.length]);

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
        if (!chatUserRef.current) return;

        if (menu.visible) {
            closeMenu()
            return
        }

        const rect = chatUserRef.current.getBoundingClientRect();
        const x = rect.left + rect.width * 0.95; // 95% от ширины .chatUser
        const y = window.innerHeight * 0.065; // 6.5vh от верха viewport

        openMenu(x, y, "acc", {
            id: chatWith.id,
            name: chatWith.username ? chatWith.username : chatWith.nick,
            nick: chatWith.nick
        }, undefined, {
            note: chatWith.note,
            is_blocked: chatWith.is_blocked,
            pinned: chatWith.pinned
        });
    };

    return (
        <div className="chatUser" ref={chatUserRef}>
            <div className="chatUserBack" onClick={() => navigate("/")}>
                <ChevronLeft />
            </div>
            <div className={`chatUserInfo ${isMobile ? "mobile" : ""}`}
                onClick={() => navigate(`/acc/${nick}`)} 
                style={{display:search.length > 0 ? "none" : "flex"}} 
                ref={nameRef}
                onContextMenu={(e) => {
                    e.preventDefault()
                    openMenu(e.clientX, e.clientY, "acc", {id:chatWith.id, name:chatWith.username ? chatWith.username : chatWith.nick, nick:chatWith.nick}, undefined,
                        {note:chatWith.note, is_blocked:chatWith.is_blocked, pinned:chatWith.pinned}
                    )
                }}
            >
                <div className="chatUserPick">
                    {chatWith.avatar_url ? (
                        <img className="chatUserAvatar" src={chatWith.avatar_url} alt={chatWith.username ?? chatWith.nick} />
                    ) : (
                        <CircleUserRound/>
                    )}
                </div>
                <div className="chatUserName">
                    <span>{chatWith.username ?? chatWith.nick}</span>
                    <span className={`chatOnlineStauts ${typingStatus ? "chatTyping" : "chatStopTyping"}`}>
                        {typingStatus
                            ? "печатает..."
                            : onlineMap[chatWith?.nick || ""]  // Изменено на .nick
                                ? "В сети"
                                : formatLastOnline(chatWith?.last_online)}
                    </span>
                </div>
            </div>
            <div className="chatUserMenu" ref={searchRef}>
                <div className={`chatSearchWrapeer ${isMobile ? "mobile" : ""}`}>
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
                                    const isMy = m.sender_id === user.id
                                    return (
                                        <div
                                            key={m.id}
                                            className={`chatSearchItem ${selectedIndex === i ? "active" : ""}`}
                                            onClick={() => { setSelectedIndex(i); scrollToMessage(m.id); }}
                                            ref={(el) => { searchItemRefs.current.set(m.id, el) }}
                                        >
                                            <div className="chatSearchPic">
                                                {isMy && user.avatar_url ? (
                                                    <img src={user.avatar_url}/>
                                                ) : !isMy && chatWith.avatar_url ? (
                                                    <img src={chatWith.avatar_url}/>
                                                ) : ("") }
                                            </div>
                                            <div className="chatSearchItemInfo">
                                                <div className="chatSearcSender">
                                                    <span className="chatSearchName">{isMy ? "Вы" : (chatWith?.username || chatWith.nick)}</span>
                                                    <span className="chatSearchDate">{new Date(m.created_at).toLocaleDateString("ru-RU")}</span>
                                                </div>
                                                <div className="chatSearchText">
                                                    <span>{m.content}</span>
                                                </div>
                                            </div>
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
                    <div className="ChosenCountButt">
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