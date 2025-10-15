import { useParams } from "react-router"
import { useChat } from "../components/hooks/ChatHook"
import { useEffect, useRef, useState, Fragment, useMemo } from "react"
import "../scss/Chat.scss"
import { SendHorizontal, Paperclip, } from "lucide-react"
import Loader from "../components/ts/Loader"
import { File, FileText, FileArchive, FileAudio,
  FileCode, FileXls, FilePpt,
  X, Check, SmileySticker
} from "@phosphor-icons/react";
import ChatUser from "../components/ts/ChatUser"
import axios from "axios"
import { useUser } from "../components/hooks/UserHook"
import { Checks } from "@phosphor-icons/react/dist/ssr"
import { Emojies, EmojiesGroups } from "../components/ts/utils/emojies"

export default function Chat () {
    const { user } = useUser()
    const { refetchChat, chatLoading, sendMess, messages, } = useChat()
    const { contactId } = useParams()
    const [ mess, setMess ] = useState<string>("")
    const [ search, setSearch ] = useState<string>("")
    const [ selectedIndex, setSelectedIndex ] = useState<number>(0)
    const [ highlightedId, setHighlightedId ] = useState<number | null>(null)
    const [ files, setFiles ] = useState<File[]>([]) 
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false) 

    const emojiBarRef = useRef<HTMLDivElement | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const chatRef = useRef<HTMLDivElement | null>(null)
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())
    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())
    const inputFileRef = useRef<HTMLInputElement>(null)
    const API_URL = import.meta.env.VITE_API_URL

    useEffect(() => {
        if (contactId) refetchChat(contactId)
        // else navigate("/")
    }, [contactId])

    useEffect(() => {
        if (!contactId || !user?.id) return;
        if (!user?.id) return;
        const unreadMessages = messages.filter(
            m => !m.read_by.includes(user.id!) && m.sender_id !== user.id
        );
        if (unreadMessages.length > 0) {
            unreadMessages.forEach(m => {
            axios.post(`${API_URL}chat/read`, { messageId: m.id }, { withCredentials: true });
            });
        }
    }, [contactId, messages, user.id]);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.ctrlKey) {
                setMess(prev => prev + "\n")
            } else {
                e.preventDefault()
                handleSend()
            }
        }
    }

    const handleSend = async () => {
        if (contactId && (mess.trim() || files.length > 0)) {
            await sendMess(contactId, mess.trim(), files)
            setMess("")
            setFiles([])
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

    const searchedMessages = useMemo(() => {
        if (!search.trim()) return [];
        return messages
            .filter(m =>
                m.content.toLowerCase().includes(search.toLowerCase()) ||
                new Date(m.created_at).toLocaleDateString("ru-RU").includes(search)
            )
            .reverse();
    }, [messages, search]);

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

    const getIconByType = (name: string, type: string) => {
        const ext = name.split(".").pop()?.toLowerCase();
        if (type.startsWith("audio/")) return <FileAudio />;
        if (ext === "zip" || ext === "rar" || ext === "7z") return <FileArchive />;
        if (ext === "pdf") return <FileText />;
        if (["doc", "docx"].includes(ext || "")) return <FileText />;
        if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileXls />;
        if (["ppt", "pptx"].includes(ext || "")) return <FilePpt />;
        if (["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "cpp", "c", "cs", "java"].includes(ext || "")) return <FileCode />;
        return <File />;
    };

    const handleAddEmoji = (emoji:string) => {
        const ta = textAreaRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        setMess(prev => {
            const newValue = prev.slice(0, start) + emoji + prev.slice(end);
            // переносим курсор после вставки
            requestAnimationFrame(() => {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
            return newValue;
        });
    }
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
            emojiBarRef.current &&
            !emojiBarRef.current.contains(e.target as Node) &&
            showEmojiBar
            ) {
            setShowEmojiBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiBar]);


    if (chatLoading) return <Loader />

    return(
        <div className="chatDiv">
            <ChatUser
                search={search}
                setSearch={setSearch}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                searchedMessages={searchedMessages}
                handleSearchKeyDown={handleSearchKeyDown}
                handleArrowClick={handleArrowClick}
                scrollToMessage={scrollToMessage}
                searchItemRefs={searchItemRefs}
            />
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
                                <div className={`message ${m.sender_id === user.id ? "my" : "ur"} ${highlightedId === m.id ? "highlight" : ""}`}>
                                    <div className="messageText">{m.content}</div>
                                    {m.files && m.files.length > 0 && (
                                        <div className="messageFiles">
                                            {m.files.map((file, j) => {
                                                const isImage = file.type.startsWith("image/");
                                                const isVideo = file.type.startsWith("video/");
                                                return (
                                                    <div key={j} className="messageFile">
                                                        {isImage ? (
                                                            <img src={file.url} alt={file.name} className="messageFilePreview" />
                                                        ) : isVideo ? (
                                                            <video src={file.url} className="messageFilePreview" controls />
                                                        ) : (
                                                            <a href={file.url} download={file.name} className="messageFileOther">
                                                                {getIconByType(file.name, file.type)}
                                                                <span className="messageFileName">{file.name}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="messageDate">
                                        {messageGetTime(m.created_at)}
                                        {m.sender_id === user.id && contactId && 
                                            m.read_by.map(id => id.toString()).includes(contactId!) && (
                                                <div className="messageUnread"><Checks/></div>
                                            )
                                        }
                                        {m.sender_id === user.id && contactId && 
                                            !m.read_by.map(id => id.toString()).includes(contactId!) && (
                                                <div className="messageUnread"><Check/></div>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </Fragment>
                    )
                })}
            </div>
           
            <div className="chatTAWrapper">
                {files.length > 0 && (
                    <div className="chatTAFiles">
                        {files.map((file, i) => {
                            const isImage = file.type.startsWith("image/");
                            const isVideo = file.type.startsWith("video/");
                            const previewUrl = URL.createObjectURL(file);
                            return (
                                <div key={i} className="chatTAFile">
                                    <div className="chatTAFileOverlay" onClick={() => {
                                        setFiles(prev => prev.filter((_, idx) => idx !== i));
                                    }}>
                                        <X/>
                                    </div>
                                    {isImage ? (
                                        <img src={previewUrl} alt={file.name} className="chatTAFilePreview" />
                                    ) : isVideo ? (
                                        <video src={previewUrl} className="chatTAFilePreview" controls />
                                    ) : (
                                        <div className="chatTAFileOther">
                                        {getIconByType(file.name, file.type)}
                                        <span className="chatTAFileName">{file.name}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {showEmojiBar && (
                    <div className="emojiBar" ref={emojiBarRef}>
                        {EmojiesGroups.map((g, i) => (
                            <div className="emojiGroup" key={i}>
                                <div className="emojiGroupName">{g.value}</div>
                                <div className="emojiList">
                                    {Emojies.filter(e => e.group === g.group).map((e, j) => (
                                        <div
                                            className="emoji"
                                            key={j}
                                            onClick={() => handleAddEmoji(e.pic)}
                                        >
                                            {e.pic}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <textarea
                    name="chatTA"
                    id="chatTA"
                    className={`chatTA ${files.length > 0 ? "chatTAwFiles" : ""}`}
                    value={mess}
                    ref={textAreaRef}
                    onChange={(e) => setMess(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="chatTAMenu">
                    <input
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        ref={inputFileRef}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            setFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
                        }}
                    />
                    <div className="chatTAbutt" onClick={() => setShowEmojiBar(!showEmojiBar)}>
                        <SmileySticker className="chatSvg" strokeWidth={2.5} width={24} height={24}/>
                    </div>
                    <div className="chatTAbutt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="chatSvg"/>
                    </div>
                    <div className="chatTAbutt" onClick={handleSend}>
                        <SendHorizontal className="chatSend" fill="currenColor"/>
                    </div>
                </div>
            </div>
        </div>
    )
}