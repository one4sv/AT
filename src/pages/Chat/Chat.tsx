import { useParams } from "react-router";
import { useChat } from "../../components/hooks/ChatHook";
import { useMessages } from "../../components/hooks/MessagesHook";
import { useUser } from "../../components/hooks/UserHook";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import "./scss/Chat.scss"

import { useEffect, useMemo, useRef, useState, Fragment } from "react";
import DateDivider from "./components/DateDivider";
import Message from "./components/Message";
import ChatUser from "./components/ChatUser";
import { ChatTAWrapper } from "./components/ChatTAWrapper";

import { isSameDay } from "./utils/isSameDay";
import { isMobile } from "react-device-detect";
import Loader from "../../components/ts/Loader";
import { api } from "../../components/ts/api";
import type { message } from "../../components/context/ChatContext";
import { usePageTitle } from "../../components/hooks/PageContextHook";

export default function Chat() {
    const { user } = useUser();
    const { refetchChat, chatLoading, messages, chatWith } = useChat();
    const { chosenMess, setChosenMess, isChose, setIsChose, pendingScrollId, setPendingScrollId } = useMessages();
    const { setTitle } = usePageTitle()

    const { nick } = useParams();

    const [search, setSearch] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const [showGoDown, setShowGoDown] = useState(false);

    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const highlightTimeoutRef = useRef<number | null>(null);

    const API_URL = import.meta.env.VITE_API_URL

    useEffect(() => {
        if (nick) {
            setIsChose(false);
            setChosenMess([]);
            refetchChat(nick);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nick]);

    useEffect(() => {
        if (!user?.id) return;

        const unread = messages.filter(
            m => !m.read_by.includes(user.id!) && m.sender_id !== user.id
        );

        if (unread.length) {
            unread.forEach(m =>
                api.post(`${API_URL}chat/read`, { messageId: m.id }, { withCredentials: true })
            );
        }
    }, [API_URL, messages, user.id]);

    const handleArrowClick = (dir: "up" | "down") => {
        setHighlightedId(null);
        if (!searchedMessages.length) return;
        let newIndex = selectedIndex;
        if (dir === "down") newIndex = Math.min(searchedMessages.length - 1, selectedIndex + 1);
        if (dir === "up") newIndex = Math.max(0, selectedIndex - 1);
        setSelectedIndex(newIndex);
        const target = searchedMessages[newIndex];
        if (!target) return;
        scrollToMessage(target.id)
    };

    // Поиск сообщений
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
        const index = messages.findIndex(m => m.id === id);
        if (index === -1) return;

        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        setHighlightedId(id);

        virtuosoRef.current?.scrollToIndex({
            index,
            behavior: "smooth",
            align: "center",
        });

        highlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedId(null);
            highlightTimeoutRef.current = null;
        }, 2000);
    };
    
    if (highlightedId !== null) console.log("id", highlightedId)

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchedMessages.length) return;
        setHighlightedId(null);
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, searchedMessages.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            scrollToMessage(searchedMessages[selectedIndex].id);
        }
    };

    useEffect(() => {
        if (pendingScrollId === null) return;

        const index = messages.findIndex(m => m.id === pendingScrollId);

        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        const timeoutId = window.setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({
                index,
                behavior: "smooth",
                align: "start",
            });
            const timeBefScroll = window.setTimeout(() => {
                scrollToMessage(pendingScrollId)
                window.clearTimeout(timeBefScroll);
            }, 400)
        }, 100);

        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
                highlightTimeoutRef.current = null;
            }
            window.clearTimeout(timeoutId);
        }
    }, [pendingScrollId, messages]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
            setIsChose(false);
            setChosenMess([]);
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [setIsChose, setChosenMess]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (!chatLoading && chatWith) {
                setTitle(chatWith.username || chatWith.nick);
            }
        }, 100)
        return () => {
            window.clearTimeout(timeout)
        }
    }, [chatLoading, chatWith]);

    if (chatLoading) return <Loader />;

    return (
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
            <Virtuoso
                className="chat"
                ref={virtuosoRef}
                data={messages}
                followOutput="smooth"
                overscan={10}
                initialTopMostItemIndex={messages.length - 1}
                atBottomStateChange={(bottom:boolean) => setShowGoDown(!bottom)}
                rangeChanged={(range: { startIndex: number; endIndex: number }) => {
                    if (pendingScrollId === null) return;

                    const index = messages.findIndex(m => m.id === pendingScrollId);
                    if (index === -1) return;

                    if (index >= range.startIndex && index <= range.endIndex) {
                        setPendingScrollId(null);
                    }
                }}
                itemContent={(index: number, m: message) => {
                    const currDate = new Date(m.created_at);
                    const prev = messages[index - 1];
                    const needDivider = !prev || !isSameDay(new Date(prev.created_at), currDate);
                    const find = messages.find(mess => mess.id === m.answer_id)
                    const name = find?.sender_name
                    const answer = find ? {id:find.id, name:name!, text:find.content ? find.content : `${find.files?.length} mediafile`} : undefined
                    return (
                        <Fragment key={m.id}>
                            {needDivider && <DateDivider currDate={currDate} />}
                            <Message
                                message={m}
                                highlightedId={highlightedId}
                                messageRefs={messageRefs}
                                answer={answer}
                                scrollToMessage={answer ? scrollToMessage : undefined}
                            />
                        </Fragment>
                    );
                }}
            />

            <ChatTAWrapper showGoDown={showGoDown} handleGoDown={() => virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" })} scrollToMessage={scrollToMessage}/>
        </div>
    );
}
