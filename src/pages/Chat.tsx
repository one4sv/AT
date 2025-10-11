import { useNavigate, useParams } from "react-router"
import { useChat } from "../components/hooks/ChatHook"
import { useEffect, useRef, useState, Fragment, useMemo } from "react"
import "../scss/Chat.scss"
import { CircleUserRound, Bell, ChevronLeft, SendHorizontal, Paperclip, UserRoundPlus, Search, X, ChevronUp, ChevronDown } from "lucide-react"
import Loader from "../components/ts/Loader"
import { useUser } from "../components/hooks/UserHook"

export default function Chat () {
    const { refetchChat, chatWith, chatLoading, sendMess, messages } = useChat()
    const navigate = useNavigate()
    const { contactId } = useParams()
    const { user } = useUser()
    const [ mess, setMess ] = useState<string>("")
    const [ search, setSearch ] = useState<string>("")
    const [selectedIndex, setSelectedIndex] = useState<number>(0)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [highlightedId, setHighlightedId] = useState<number | null>(null)

    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const chatRef = useRef<HTMLDivElement | null>(null)
    const searchRef = useRef<HTMLDivElement | null>(null)
    const nameRef = useRef<HTMLDivElement | null>(null)
    const searchDivRef = useRef<HTMLDivElement | null>(null)

    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())
    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

    useEffect(() => {
        if (contactId) refetchChat(contactId)
        // else navigate("/")
    }, [contactId])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.ctrlKey) {
                setMess(prev => prev + "\n")
            } else {
                e.preventDefault()
                if (mess.trim() && contactId) {
                    sendMess(contactId, mess.trim())
                    setMess("")
                }
            }
        }
    }

    useEffect(() => {
        const ta = textAreaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.minHeight = "7vh";
        ta.style.height = ta.scrollHeight + "px";
    }, [mess]);

    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages, chatLoading, contactId]);

    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const isSameDay = (a: Date, b: Date) => {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    const formatDateLabel = (d: Date) => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (isSameDay(d, today)) return "сегодня";
        if (isSameDay(d, yesterday)) return "вчера";
        return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    }

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

    const searchedMessages = useMemo(() => {
        if (!search.trim()) return [];
        return messages
            .filter(m =>
                m.content.toLowerCase().includes(search.toLowerCase()) ||
                new Date(m.created_at).toLocaleDateString("ru-RU").includes(search)
            )
            .reverse();
    }, [messages, search]);

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

    const scrollToMessage = (id: number) => {
        const el = messageRefs.current.get(id)
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" })
            setHighlightedId(null)
            requestAnimationFrame(() => {
                setHighlightedId(id)
                setTimeout(() => setHighlightedId(null), 2000)
            })
        }
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchedMessages.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(searchedMessages.length - 1, prev + 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const target = searchedMessages[selectedIndex];
            if (target) scrollToMessage(target.id);
        }
    }

    const handleArrowClick = (dir: "up" | "down") => {
        if (!searchedMessages.length) return;

        let newIndex = selectedIndex;
        if (dir === "up") newIndex = Math.min(searchedMessages.length - 1, selectedIndex + 1);
        if (dir === "down") newIndex = Math.max(0, selectedIndex - 1);

        setSelectedIndex(newIndex);

        const target = searchedMessages[newIndex];
        if (!target) return;

        const el = messageRefs.current.get(target.id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedId(null);
            requestAnimationFrame(() => {
                setHighlightedId(target.id);
                setTimeout(() => setHighlightedId(null), 2000);
            });
        }
    };

    useEffect(() => {
        searchItemRefs.current.clear();
        if (!searchedMessages.length) return;
        const target = searchedMessages[selectedIndex];
        if (!target) return;
        const el = searchItemRefs.current.get(target.id);
        el?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex, searchedMessages]);

    if (chatLoading) return <Loader />

    return(
        <div className="chatDiv">
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
                        <span className="wasOnline">был в сети 16 марта</span>
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

            <div className="chat" ref={chatRef}>
                {messages.map((m, i) => {
                    const currDate = new Date(m.created_at)
                    const prev = messages[i - 1]
                    const prevDate = prev ? new Date(prev.created_at) : null
                    const needDivider = !prevDate || !isSameDay(prevDate, currDate)
                    return (
                        <Fragment key={`${m.id}-${i}`}>
                            {needDivider && <div className="dateDivider">{formatDateLabel(currDate)}</div>}
                            <div className="messageWrapper"
                                ref={(el) => {messageRefs.current.set(m.id, el)}}
                            >
                                <div className={`message ${m.sender_id === contactId ? "ur" : "my"} ${highlightedId === m.id ? "highlight" : ""}`}>
                                    <div className="messageText">{m.content}</div>
                                    <div className="messageDate">{messageGetTime(m.created_at)}</div>
                                </div>
                            </div>
                        </Fragment>
                    )
                })}
            </div>

            <div className="chatTAWrapper">
                <textarea
                    name="chatTA"
                    id="chatTA"
                    className="chatTA"
                    value={mess}
                    ref={textAreaRef}
                    onChange={(e) => setMess(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="chatTAMenu">
                    <div className="chatTAbutt">
                        <Paperclip className="chatFile"/>
                    </div>                    
                    <div className="chatTAbutt" onClick={() => {
                        if (contactId && mess.trim()) {
                            sendMess(contactId, mess.trim())
                            setMess("")
                        }
                    }}>
                        <SendHorizontal className="chatSend" fill="currenColor"/>
                    </div>
                </div>
            </div>
        </div>
    )
}