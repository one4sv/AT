import { useNavigate, useParams } from "react-router";
import { useChat } from "../../components/hooks/ChatHook";
import { useMessages } from "../../components/hooks/MessagesHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Chat.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import DateDivider from "./utils/DateDivider";
import Message from "./components/Message";
import ChatUser from "./components/ChatUser";
import { ChatTAWrapper } from "./components/ChatTAWrapper";
import { isSameDay } from "./utils/funcs/isSameDay";
import { isMobile } from "react-device-detect";
import { api } from "../../components/ts/api";
import type { message } from "../../components/context/ChatContext";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import getCornerType from "./utils/funcs/getCornet";
import SystemMessage from "./utils/SystemMessage";
import Loader from "../../components/ts/Loader";
import { LoaderSmall } from "../../components/ts/LoaderSmall";
import { useChatMessageScroll } from "../../components/hooks/utils/useChatMessageScroll";

export default function Chat() {
    const { user, loadingUser } = useUser();
    const {
        refetchChatWLoading,
        chatLoading,
        messages,
        chatWith,
        refetchGroupChatWLoading,
        searchMess: search,
        searchInputRef,
        hasMore,
        loadingMore,
        loadOlderMessages,
        activeHeader,
        setActiveHeader
    } = useChat();

    const {
        chosenMess,
        setChosenMess,
        pendingScrollId,
        setPendingScrollId,
    } = useMessages();

    const { setTitle } = usePageTitle();
    const { nick, id } = useParams();
    const navigate = useNavigate();
    const [ showGoDown, setShowGoDown ] = useState(false);
    const [ mess, setMess ] = useState<string>("");

    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const {
        scrollToMessage,
    } = useChatMessageScroll();
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const isLoadingMoreRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const initialScrolledRef = useRef(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        setActiveHeader("text")
        setChosenMess([]);
        initialScrolledRef.current = false;

        if (id) {
            refetchGroupChatWLoading(id);
        } else if (nick) {
            refetchChatWLoading(nick);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nick, id]);

    useEffect(() => {
        if (!user.id && !loadingUser) navigate(`/acc/${nick}`);
    }, [loadingUser, navigate, nick, user]);

    useEffect(() => {
        const unread = messages.filter(
        (m) => !m.read_by.includes(user.id!) && m.sender_id !== user.id
        );

        if (unread.length) {
        unread.forEach((m) =>
            api.post(`chat/read`, { messageId: m.id }, { withCredentials: true })
        );
        }
    }, [API_URL, messages, user.id]);

    const searchedMessages = useMemo(() => {
        if (!search.trim()) return [];
        return messages
        .filter(
            (m) => (m.content.toLowerCase().includes(search.toLowerCase()) ||
            new Date(m.created_at).toLocaleDateString("ru-RU").includes(search)) &&
            !m.is_system
        )
        .reverse();
    }, [messages, search]);

    useEffect(() => {
        if (
            !chatLoading &&
            chatWith &&
            (chatWith.nick === nick || String(chatWith.id) === id)
        ) {
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
            setMess((prev) => prev + e.key);
        }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setMess, searchInputRef]);

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

    useEffect(() => {
        if (pendingScrollId === null) return;

        scrollToMessage(pendingScrollId).finally(() => {
        setTimeout(() => setPendingScrollId(null), 600);
        });
    }, [pendingScrollId, scrollToMessage, setPendingScrollId]);

    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        const onScroll = () => {
        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowGoDown(distanceFromBottom > 250);

        if (
            el.scrollTop < 150 &&
            hasMore &&
            !isLoadingMoreRef.current &&
            !loadingMore
        ) {
            isLoadingMoreRef.current = true;
            prevScrollHeightRef.current = el.scrollHeight;

            loadOlderMessages().finally(() => {
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                const newHeight = chatContainerRef.current.scrollHeight;
                chatContainerRef.current.scrollTop =
                    newHeight - prevScrollHeightRef.current;
                }
                isLoadingMoreRef.current = false;
            });
            });
        }
        };

        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, loadOlderMessages]);

    useEffect(() => {
        if (
            !chatLoading &&
            messages.length > 0 &&
            chatContainerRef.current &&
            !initialScrolledRef.current
        ) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
            initialScrolledRef.current = true;
        }
    }, [chatLoading, messages.length]);

    if (chatLoading) return <Loader />;

    return (
        <div className="chatDiv">
            <ChatUser />
            <div className={`chat AH${activeHeader}`} ref={chatContainerRef}>
                {loadingMore && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "12px 0",
                    }}
                >
                    <LoaderSmall />
                </div>
                )}

                {grouped.map((group) => (
                <div key={group[0].id}>
                    <DateDivider currDate={new Date(group[0].created_at)} />

                    {group.map((m) => {
                    const find = messages.find((mess) => mess.id === m.answer_id);
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
                        (mess) =>
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
                            key={m.id}
                            m={m}
                            answer={answer}
                        />
                    ) : (
                        <Message
                            key={m.id}
                            message={m}
                            answer={answer}
                            redir_answer={redir_answer}
                            cornerType={getCornerType(
                                m.id,
                                messages.map((msg) => msg.id),
                                chosenMess.map((cm) => cm.id)
                            )}
                        />
                    );
                    })}
                </div>
                ))}
            </div>
            <ChatTAWrapper
                showGoDown={showGoDown}
                handleGoDown={() => {
                    chatContainerRef.current?.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: "smooth",
                    });
                }}
                textAreaRef={textAreaRef}
                mess={mess}
                setMess={setMess}
                activeHeader={activeHeader}
                searchedMessages={searchedMessages}
            />
        </div>
    );
}