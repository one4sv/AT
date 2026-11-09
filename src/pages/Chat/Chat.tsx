import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useChat } from "../../components/hooks/ChatHook";
import { useMessages } from "../../components/hooks/MessagesHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Chat.scss";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import Skeleton from "../../components/ts/Skeleton";
import { LoaderSmall } from "../../components/ts/LoaderSmall";
import WelcomeMessage from "./components/WelcomeMessage";
import { useChatMessageScroll } from "../../components/hooks/utils/useChatMessageScroll";
import { formatAppDate } from "../../components/ts/utils/dateToStr";
export default function Chat() {
    const { t, i18n } = useTranslation("common");
    const {
        user,
        loadingUser,
        isAuthenticated
    } = useUser();
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
        setPendingScrollId
    } = useMessages();
    const { setTitle } = usePageTitle();
    const {
        nick,
        id
    } = useParams();
    const navigate = useNavigate();
    const [showGoDown, setShowGoDown] = useState(false);
    const [unreadDividerId, setUnreadDividerId] = useState<number | null>(null);
    const [mess, setMess] = useState<string>("");
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const { scrollToMessage } = useChatMessageScroll();
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const isLoadingMoreRef = useRef(false);
    const initialScrolledRef = useRef(false);
    const hadMessagesRef = useRef(false);
    const pinnedBottomRef = useRef(true);
    const unreadCapturedRef = useRef(false);
    const prependSnapshotRef = useRef<{ height: number; top: number; firstId: number } | null>(null);
    const API_URL = import.meta.env.VITE_API_URL;
    const chatReady = !chatLoading && !!chatWith && (id
        ? chatWith.is_group && String(chatWith.id) === id
        : !chatWith.is_group && chatWith.nick === nick);

    useLayoutEffect(() => {
        initialScrolledRef.current = false;
        hadMessagesRef.current = false;
        pinnedBottomRef.current = true;
        unreadCapturedRef.current = false;
        prependSnapshotRef.current = null;
        isLoadingMoreRef.current = false;
        setUnreadDividerId(null);
    }, [nick, id]);

    useLayoutEffect(() => {
        if (!chatReady || !user.id || unreadCapturedRef.current) return;
        unreadCapturedRef.current = true;
        setUnreadDividerId(messages.find(m =>
            m.sender_id !== user.id && !m.read_by?.includes(user.id)
        )?.id ?? null);
    }, [chatReady, messages, user.id]);

    useEffect(
        () => {
            if (loadingUser || !isAuthenticated) return;
            setActiveHeader("text");
            setChosenMess([]);
            if (id) {
                refetchGroupChatWLoading(id);
            } else if (nick) {
                refetchChatWLoading(nick);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [nick, id, loadingUser, isAuthenticated]
    );

    useEffect(
        () => {
            if (!user.id && !loadingUser) navigate(`/acc/${nick}`);
        },
        [loadingUser, navigate, nick, user]
    );

    useEffect(
        () => {
            if (!chatReady || !user.id) return;
            const unread = messages.filter(m => !m.read_by?.includes(user.id!) && m.sender_id !== user.id);
            if (unread.length) {
                unread.forEach(
                    m => api.post(
                        `chat/read`,
                        {
                            messageId: m.id
                        },
                        {
                            withCredentials: true
                        }
                    )
                );
            }
        },
        [API_URL, messages, user.id, chatReady]
    );
    const searchedMessages = useMemo(
        () => {
            if (!search.trim()) return [];
            return messages.filter(
                m => (m.content.toLowerCase().includes(search.toLowerCase()) || formatAppDate(m.created_at).includes(search)) && !m.is_system
            ).reverse();
        },
        [messages, search, i18n.resolvedLanguage]
    );

    useEffect(
        () => {
            if (!chatLoading && chatWith && (chatWith.nick === nick || String(chatWith.id) === id)) {
                setTitle(chatWith.name || chatWith.nick);
            }
        },
        [chatLoading, chatWith, id, nick, setTitle]
    );

    useEffect(
        () => {
            if (location.pathname.startsWith("/chat") && !isMobile) {
                textAreaRef.current?.focus();
            }
        },
        []
    );

    useEffect(
        () => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (document.activeElement === searchInputRef.current || document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || e.ctrlKey || e.altKey || e.metaKey || e.key === "Escape") {
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
            return () => window.removeEventListener("keydown", handleKeyDown);
        },
        [setMess, searchInputRef]
    );
    const grouped = useMemo(
        () => {
            const groups: message[][] = [];
            messages.forEach(
                msg => {
                    const lastGroup = groups[groups.length - 1];
                    if (!lastGroup || !isSameDay(new Date(lastGroup[0].created_at), new Date(msg.created_at))) {
                        groups.push([msg]);
                    } else {
                        lastGroup.push(msg);
                    }
                }
            );
            return groups;
        },
        [messages]
    );

    useEffect(
        () => {
            if (pendingScrollId === null) return;
            pinnedBottomRef.current = false;
            scrollToMessage(pendingScrollId).finally(
                () => {
                    setTimeout(() => setPendingScrollId(null), 600);
                }
            );
        },
        [pendingScrollId, scrollToMessage, setPendingScrollId]
    );

    useEffect(
        () => {
            const el = chatContainerRef.current;
            if (!el || !chatReady) return;
            const onScroll = () => {
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                pinnedBottomRef.current = distanceFromBottom < 80;
                setShowGoDown(distanceFromBottom > 250);
                if (!initialScrolledRef.current || pendingScrollId !== null || el.scrollHeight <= el.clientHeight + 20) return;
                if (el.scrollTop < 150 && hasMore && messages.length > 0 && !isLoadingMoreRef.current && !loadingMore) {
                    isLoadingMoreRef.current = true;
                    const snapshot = { height: el.scrollHeight, top: el.scrollTop, firstId: messages[0].id };
                    prependSnapshotRef.current = snapshot;
                    loadOlderMessages().finally(
                        () => {
                            requestAnimationFrame(() => {
                                if (prependSnapshotRef.current === snapshot) {
                                    const current = chatContainerRef.current;
                                    if (current) current.scrollTop = snapshot.top + current.scrollHeight - snapshot.height;
                                    prependSnapshotRef.current = null;
                                }
                                isLoadingMoreRef.current = false;
                            });
                        }
                    );
                }
            };
            el.addEventListener("scroll", onScroll, {
                passive: true
            });
            return () => el.removeEventListener("scroll", onScroll);
        },
        [chatReady, hasMore, loadingMore, loadOlderMessages, messages, pendingScrollId]
    );

    useLayoutEffect(
        () => {
            const el = chatContainerRef.current;
            if (!chatReady || !el) return;
            const snapshot = prependSnapshotRef.current;
            if (snapshot) {
                if (messages[0]?.id !== snapshot.firstId) {
                    el.scrollTop = snapshot.top + el.scrollHeight - snapshot.height;
                    prependSnapshotRef.current = null;
                }
                return;
            }
            if (!initialScrolledRef.current) {
                el.scrollTop = el.scrollHeight;
                initialScrolledRef.current = true;
                pinnedBottomRef.current = true;
            } else if (pinnedBottomRef.current && pendingScrollId === null) {
                el.scrollTop = el.scrollHeight;
            }
        },
        [chatReady, messages, unreadDividerId, pendingScrollId]
    );

    useEffect(() => {
        const el = chatContainerRef.current;
        if (!chatReady || !el || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => {
            if (initialScrolledRef.current && pinnedBottomRef.current && !isLoadingMoreRef.current && pendingScrollId === null) {
                el.scrollTop = el.scrollHeight;
            }
        });
        observer.observe(el);
        Array.from(el.children).forEach(child => observer.observe(child));
        return () => observer.disconnect();
    }, [chatReady, messages.length, loadingMore, pendingScrollId]);
    useEffect(() => {
        if (!chatLoading && messages.length > 0) hadMessagesRef.current = true;
    }, [chatLoading, messages.length]);

    if (chatLoading) return <Skeleton type="chat" count={5} />;

    return (
        <div className="chatDiv">
            <ChatUser />
            <div className={`chat AH${activeHeader}`} ref={chatContainerRef}>
                {loadingMore && <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "12px 0"
                    }}
                >
                    <LoaderSmall />
                </div>}

                {!hadMessagesRef.current && messages.length === 0 && !id && chatWith &&
                    chatWith.nick === nick && chatWith.id !== user.id && chatWith.welcome_message &&
                    <WelcomeMessage person={chatWith} text={chatWith.welcome_message}/>
                }
                {grouped.map(
                    group => <div key={new Date(group[0].created_at).toDateString()}>
                        <DateDivider currDate={new Date(group[0].created_at)} />

                        {group.map(
                            m => {
                                const find = messages.find(mess => mess.id === m.answer_id);
                                const answer = find ? {
                                    id: find.id,
                                    name: find.sender_name,
                                    text: find.content || (find.files?.length ? t("chatUi.mediaCount", { count: find.files.length }) : t("chatUi.forwardedMessage"))
                                } : undefined;
                                const redir_find = messages.find(mess => mess.id === m.redirected_answer || mess.redirected_id === m.redirected_answer);
                                const redir_answer = redir_find ? {
                                    id: redir_find.id,
                                    name: redir_find.redirected_name || "",
                                    text: redir_find.content || (redir_find.files?.length ? t("chatUi.mediaCount", { count: redir_find.files.length }) : t("chatUi.forwardedMessage"))
                                } : undefined;
                                return <Fragment key={m.clientId ?? m.id}>
                                    {m.id === unreadDividerId && <div className="newMessagesDivider" role="separator" aria-label={t("chatUi.newMessages")}>
                                        <span>{t("chatUi.newMessages")}</span>
                                    </div>}
                                    {m.is_system ? <SystemMessage m={m} answer={answer} /> : <Message
                                        message={m}
                                        answer={answer}
                                        redir_answer={redir_answer}
                                        cornerType={getCornerType(m.id, messages.map(msg => msg.id), chosenMess.map(cm => cm.id))}
                                    />}
                                </Fragment>;
                            }
                        )}
                    </div>
                )}
            </div>
            <ChatTAWrapper
                showGoDown={showGoDown}
                handleGoDown={() => {
                    chatContainerRef.current?.scrollTo(
                        {
                            top: chatContainerRef.current.scrollHeight,
                            behavior: "smooth"
                        }
                    );
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
