import { useParams } from "react-router"
import { useChat } from "../../components/hooks/ChatHook"
import { useEffect, useRef, useState, Fragment, useMemo } from "react"
import "./scss/Chat.scss"
import Loader from "../../components/ts/Loader"
import ChatUser from "./components/ChatUser"
import Message from "./components/Message"
import axios from "axios"
import { useUser } from "../../components/hooks/UserHook"
import { ChatTAWrapper } from "./components/ChatTAWrapper"
import DateDivider from "./components/DateDivider"
import { isSameDay } from "./utils/isSameDay"
import { isMobile } from "react-device-detect"

export default function Chat () {
    const { user } = useUser()
    const { refetchChat, chatLoading, messages} = useChat()
    const { nick } = useParams()
    const [ search, setSearch ] = useState<string>("")
    const [ selectedIndex, setSelectedIndex ] = useState<number>(0)
    const [ highlightedId, setHighlightedId ] = useState<number | null>(null)
    const [ isChose, setIsChose ] = useState<boolean>(false)
    const [ chosenMess, setChosenMess ] = useState<number[]>([])
    const [ showGoDown, setShowGoDown ] = useState<boolean>(false)

    const chatRef = useRef<HTMLDivElement | null>(null)
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())
    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())
    const API_URL = import.meta.env.VITE_API_URL
    const isFirstLoad = useRef(true)

    useEffect(() => {
        if (nick) {
            setIsChose(false)
            setChosenMess([])
            refetchChat(nick)
            isFirstLoad.current = true
        }
    }, [nick])

    useEffect(() => {
        if (!nick || !user?.id) return;
        const unreadMessages = messages.filter(
            m => !m.read_by.includes(user.id!) && m.sender_id !== user.id
        );
        if (unreadMessages.length > 0 && nick) {
            unreadMessages.forEach(m => {
            axios.post(`${API_URL}chat/read`, { messageId: m.id }, { withCredentials: true });
            });
        }
        console.log(unreadMessages)
    }, [nick, messages, user.id]);

    useEffect(() => {
        if (!isFirstLoad.current) return;
        const el = chatRef.current;
        if (!el || chatLoading) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
        isFirstLoad.current = false;
    }, [messages, chatLoading]);

    useEffect(() => {
        const el = chatRef.current;
        if (!el) return;

        const handleScroll = () => {
            const threshold = 300; // Порог в пикселях от низа
            const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
            setShowGoDown(!isNearBottom);
        };

        el.addEventListener("scroll", handleScroll);

        // Вызовем обработчик сразу, чтобы правильно выставить состояние
        handleScroll();

        return () => el.removeEventListener("scroll", handleScroll);
    }, [chatRef.current]);


    const handleGoDown = () => {
        const el = chatRef.current;
        if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    };

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
        const el = chatRef.current;
        if (!el || chatLoading) return;

        const threshold = 300; // порог в пикселях, чтобы считать, что чат «внизу»
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        if (isFirstLoad.current) {
            // При первой загрузке просто скроллим вниз
            requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight;
            });
            isFirstLoad.current = false;
        } else if (isNearBottom) {
            requestAnimationFrame(() => {
                el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            });
        }
    }, [messages, chatLoading]);

    if (chatLoading) return <Loader />

    return(
        <div className={`chatDiv ${isMobile ? "mobile" : ""}`}>
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
                isChose={isChose}
                setIsChose={setIsChose}
                chosenMess={chosenMess}
                setChosenMess={setChosenMess}
            />
            <div className="chat" ref={chatRef}>
                {messages.map((m, i) => {
                    const currDate = new Date(m.created_at)
                    const prev = messages[i - 1]
                    const prevDate = prev ? new Date(prev.created_at) : null
                    const needDivider = !prevDate || !isSameDay(prevDate, currDate)
                    const isMy = m.sender_id === user.id
                    return (
                        <Fragment key={`${m.id}-${i}`}>
                            {needDivider && <DateDivider currDate={currDate}/>}
                            <Message message={m} isMy={isMy} highlightedId={highlightedId} messageRefs={messageRefs} isChose={isChose} setIsChose={setIsChose} chosenMess={chosenMess} setChosenMess={setChosenMess}/>
                        </Fragment>
                    )
                })}
            </div>
            <ChatTAWrapper showGoDown={showGoDown} handleGoDown={handleGoDown}/>
        </div>
    )
}