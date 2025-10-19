import { Bell, ChevronDown, ChevronLeft, ChevronUp, CircleUserRound, UserRoundPlus, X, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import formatLastOnline from "../../../components/ts/utils/formatOnline";
import { useUser } from "../../../components/hooks/UserHook";
import { useChat } from "../../../components/hooks/ChatHook";
import { useEffect, useRef, useState } from "react";
import type { message } from "../../../components/context/ChatContext";

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
    searchItemRefs
}: ChatUserProps) {
    const { user } = useUser()
    const { chatWith, onlineMap, typingStatus } = useChat()
    const { contactId } = useParams()
    
    const navigate = useNavigate()
    const [ isSearchOpen, setIsSearchOpen ] = useState(false)
    
    const nameRef = useRef<HTMLDivElement | null>(null)
    const searchRef = useRef<HTMLDivElement | null>(null)
    const searchDivRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!nameRef.current || !searchRef.current) return;

        if (search.length > 0) {
            nameRef.current.style.width = "0";
            searchRef.current.style.width = "100%";
        } else {
            nameRef.current.style.width = "40%";
            searchRef.current.style.width = "50%";
        }
    }, [search.length])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                searchDivRef.current &&
                !searchDivRef.current.contains(e.target as Node) &&
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setIsSearchOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        setIsSearchOpen(search.trim().length > 0)
    }, [search])
    return (
        <div className="chatUser">
            <div className="chatUserBack" onClick={() => navigate("/")}>
                <ChevronLeft />
            </div>
            <div className="chatUserInfo" onClick={() => navigate(`/acc/${contactId}`)} ref={nameRef}>
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
                            : onlineMap[chatWith?.id || ""] 
                                ? "В сети" 
                                : formatLastOnline(chatWith?.last_online)}
                    </span>

                </div>
            </div>

            <div className="chatUserMenu" ref={searchRef}>
                <div className="chatSearchWrapeer">
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
                                    const isMy = m.sender_id !== contactId
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
                <div className="menuButt"><UserRoundPlus/></div>
                <div className="menuButt"><Bell/></div>
            </div>
        </div>
    )
}