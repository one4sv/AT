import { useNavigate, useParams } from "react-router";
import { useChat } from "../../components/hooks/ChatHook";
import { useMessages } from "../../components/hooks/MessagesHook";
import { useUser } from "../../components/hooks/UserHook";
import { GroupedVirtuoso, type VirtuosoHandle } from "react-virtuoso";
import "./scss/Chat.scss"

import { useEffect, useMemo, useRef, useState } from "react";
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
import getCornerType from "./components/getCornet";
import SystemMessage from "./components/SystemMessage";

export default function Chat() {
    const { user, isAuthenticated } = useUser();
    const { refetchChatWLoading, chatLoading, messages, chatWith, refetchGroupChatWLoading, searchMess:search, setSearchMess:setSearch, searchInputRef } = useChat();
    const { chosenMess, setChosenMess, isChose, setIsChose, pendingScrollId, setPendingScrollId } = useMessages();
    const { setTitle } = usePageTitle()
    const { nick, id } = useParams();
    const navigate = useNavigate()

    const [ selectedIndex, setSelectedIndex ] = useState(0);
    const [ highlightedId, setHighlightedId ] = useState<number | null>(null);
    const [ showGoDown, setShowGoDown ] = useState(false);
    const [ mess, setMess ] = useState<string>("")

    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const highlightTimeoutRef = useRef<number | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
    const API_URL = import.meta.env.VITE_API_URL

    useEffect(() => {
        setIsChose(false);
        setChosenMess([]);
        if (id) {
            refetchGroupChatWLoading(id);
        }
        else if (nick) {
            refetchChatWLoading(nick);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nick, id]);

    useEffect(() => {
        if (!isAuthenticated && !user) navigate(`/acc/${nick}`)
    }, [isAuthenticated, navigate, nick, user])

    useEffect(() => {
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
        if (!chatLoading && chatWith && (chatWith.nick === nick || String(chatWith.id) === id)) {
            setTitle(chatWith.name || chatWith.nick);
        }
    }, [chatLoading, chatWith, id, nick, setTitle]);


    useEffect(() => {
        if (location.pathname.startsWith("/chat") && !isMobile) {
            textAreaRef.current?.focus();
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                document.activeElement === searchInputRef.current ||
                document.activeElement instanceof HTMLInputElement ||
                document.activeElement instanceof HTMLTextAreaElement ||
                e.ctrlKey ||
                e.altKey ||
                e.metaKey ||
                e.key === "Escape"
            ) {
                return;
            }

            const selection = window.getSelection();
            if (selection?.toString()) return;

            textAreaRef.current?.focus();

            if (e.key.length === 1) {
                e.preventDefault();
                setMess(prev => prev + e.key);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [setMess]);

    const grouped = useMemo(() => {
        const groups: message[][] = [];

        messages.forEach((msg) => {
            const lastGroup = groups[groups.length - 1];

            if (
                !lastGroup ||
                !isSameDay(
                    new Date(lastGroup[0].created_at),
                    new Date(msg.created_at)
                )
            ) {
                groups.push([msg]);
            } else {
                lastGroup.push(msg);
            }
        });

        return groups;
    }, [messages]);

    const groupCounts = grouped.map(g => g.length);
    const flatMessages = grouped.flat();
    
    useEffect(() => {
        if (pendingScrollId === null) return;

        const index = flatMessages.findIndex(
            m => m.id === pendingScrollId
        );

        if (index === -1) return;

        virtuosoRef.current?.scrollToIndex({
            index,
            behavior: "smooth",
            align: "center",
        });

        const timeout = setTimeout(() => {
            setPendingScrollId(null);
        }, 600);

        return () => clearTimeout(timeout);
    }, [pendingScrollId, flatMessages, setPendingScrollId]);

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
                searchInputRef={searchInputRef}
            />
            <GroupedVirtuoso
                className="chat"
                ref={virtuosoRef}
                groupCounts={groupCounts}
                followOutput="smooth"
                overscan={20}
                initialTopMostItemIndex={flatMessages.length - 1}
                atBottomStateChange={(bottom:boolean) => setShowGoDown(!bottom)}
                groupContent={(groupIndex) => (
                    <DateDivider
                        currDate={
                            new Date(grouped[groupIndex][0].created_at)
                        }
                    />
                )}
                itemContent={(index) => {
                    const m = flatMessages[index];

                    const find = messages.find(
                        mess => mess.id === m.answer_id
                    );

                    const answer = find
                        ? {
                            id: find.id,
                            name: find.sender_name,
                            text:
                                find.content ||
                                (find.files?.length
                                    ? `${find.files.length} mediafile`
                                    : "Пересланное сообщение"),
                        }
                        : undefined;

                    const redir_find = messages.find(
                        mess =>
                            mess.id === m.redirected_answer ||
                            mess.redirected_id === m.redirected_answer
                    );

                    const redir_answer = redir_find
                        ? {
                            id: redir_find.id,
                            name: redir_find.redirected_name || "",
                            text:
                                redir_find.content ||
                                (redir_find.files?.length
                                    ? `${redir_find.files.length} mediafile`
                                    : "Пересланное сообщение"),
                        }
                        : undefined;

                    return m.is_system ? (
                        <SystemMessage
                            m={m}
                            answer={answer}
                            scrollToMessage={
                                answer ? scrollToMessage : undefined
                            }
                        />
                    ) : (
                        <Message
                            message={m}
                            highlightedId={highlightedId}
                            messageRefs={messageRefs}
                            answer={answer}
                            redir_answer={redir_answer}
                            scrollToMessage={
                                answer ? scrollToMessage : undefined
                            }
                            cornerType={getCornerType(
                                m.id,
                                messages.map(msg => msg.id),
                                chosenMess.map(cm => cm.id)
                            )}
                        />
                    );
                }}
            />

            <ChatTAWrapper showGoDown={showGoDown} handleGoDown={() => virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" })} scrollToMessage={scrollToMessage} textAreaRef={textAreaRef} mess={mess} setMess={setMess}/>
        </div>
    );
}
