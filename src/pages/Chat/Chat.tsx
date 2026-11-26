import { useNavigate, useParams, useLocation } from "react-router";
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
import ChatActionPanel from "./components/ChatActionPanel";
import { isSameDay } from "./utils/funcs/isSameDay";
import { isMobile } from "react-device-detect";
import { api } from "../../components/ts/api";
import type { message } from "../../components/context/ChatContext";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import getCornerType from "./utils/funcs/getCornet";
import SystemMessage from "./utils/SystemMessage";
import Skeleton from "../../components/ts/Skeleton";
import WelcomeMessage from "./components/WelcomeMessage";
import { useChatMessageScroll } from "../../components/hooks/utils/useChatMessageScroll";
import { todayStrFunc, clockInAppZone } from "../../components/ts/utils/dateToStr";
import { parseSavedMessageSuggestion } from "../../components/ts/utils/savedMessageSuggestion";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { useGroup } from "../../components/hooks/GroupHook";
import useLocalStorage from "../../components/hooks/utils/useLocalStorage";
const HISTORY_PREFETCH_REMAINING = 15;

type HistoryAnchor = { id: string; offset: number };
type HistoryLoad = { anchor: HistoryAnchor | null; finished: boolean };

function captureHistoryAnchor(el: HTMLDivElement): HistoryAnchor | null {
    const top = el.getBoundingClientRect().top;
    const visibleTop = top + (parseFloat(getComputedStyle(el).scrollPaddingTop) || 0);
    const nodes = el.querySelectorAll<HTMLElement>("[data-history-message-id]");
    // The first message crossing the visible top, even if it is below a loading placeholder.
    for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom > visibleTop) return { id: node.dataset.historyMessageId!, offset: rect.top - top };
    }
    return null;
}

function restoreHistoryAnchor(el: HTMLDivElement, anchor: HistoryAnchor | null) {
    if (!anchor) return;
    const node = el.querySelector<HTMLElement>(`[data-history-message-id="${anchor.id}"]`);
    if (!node) return;
    const delta = node.getBoundingClientRect().top - el.getBoundingClientRect().top - anchor.offset;
    if (Math.abs(delta) > .5) el.scrollTop += delta;
}

export default function Chat() {
    const { t } = useTranslation("common");
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
    const { setBlackout } = useBlackout();
    const { refetchGroup } = useGroup();
    const [savedSmartEnabled] = useLocalStorage("chat_saved_suggestions", true);
    const {
        nick,
        id
    } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
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
    const measuredScrollHeightRef = useRef(0);
    const unreadCapturedRef = useRef(false);
    const prependSnapshotRef = useRef<HistoryLoad | null>(null);
    const [historyCommit, setHistoryCommit] = useState(0);
    const historyRetryAfterRef = useRef(0);
    const API_URL = import.meta.env.VITE_API_URL;
    useEffect(() => {
        const target = new URLSearchParams(location.search).get("message");
        if (!target || !/^\d+$/.test(target)) return;
        const messageId = Number(target);
        if (!Number.isSafeInteger(messageId) || messageId <= 0) return;
        setPendingScrollId(messageId);
        navigate(location.pathname, { replace: true });
    }, [location.pathname, location.search, navigate, setPendingScrollId]);
    useEffect(() => {
        if (!id || !new URLSearchParams(location.search).has("invite") ||
            !chatWith?.is_group || String(chatWith.id) !== id || chatLoading) return;
        let cancelled = false;
        void api.get("group/" + id).then(async response => {
            if (cancelled) return;
            if (!response.data?.success || !response.data?.my_perms?.can_invite_users) {
                navigate(location.pathname, { replace: true });
                return;
            }
            await refetchGroup(id);
            if (cancelled) return;
            setBlackout({ seted: true, module: "CreateChat", point: "InviteUser", isRoot: true });
            navigate(location.pathname, { replace: true });
        }).catch(() => { if (!cancelled) navigate(location.pathname, { replace: true }); });
        return () => { cancelled = true; };
    }, [id, chatWith?.id, chatWith?.is_group, chatLoading,
        location.pathname, location.search, refetchGroup, navigate, setBlackout]);
    const chatReady = !chatLoading && !!chatWith && (id
        ? chatWith.is_group && String(chatWith.id) === id
        : !chatWith.is_group && chatWith.nick === nick);

    useLayoutEffect(() => {
        initialScrolledRef.current = false;
        hadMessagesRef.current = false;
        pinnedBottomRef.current = true;
        measuredScrollHeightRef.current = 0;
        unreadCapturedRef.current = false;
        prependSnapshotRef.current = null;
        isLoadingMoreRef.current = false;
        historyRetryAfterRef.current = 0;
        setUnreadDividerId(null);
    }, [nick, id]);

    useLayoutEffect(() => {
        const userId = user.id;
        if (!chatReady || !userId || unreadCapturedRef.current) return;
        unreadCapturedRef.current = true;
        setUnreadDividerId(messages.find(m =>
            m.sender_id !== userId && !m.read_by?.includes(userId)
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
    const [searchedMessages, setSearchedMessages] = useState<message[]>([]);
    const historyChatId = chatWith?.chat_id;
    useEffect(() => {
        setSearchedMessages([]);
        const query = search.trim();
        if (!chatReady || activeHeader !== "search" || !query || !historyChatId) return;
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            let before: number | undefined;
            try {
                do {
                    const response = await api.get("chat/search/" + historyChatId, {
                        params: { q: query, before }, signal: controller.signal
                    });
                    if (controller.signal.aborted || !response.data.success) return;
                    const batch = response.data.messages as message[];
                    setSearchedMessages(previous => [...previous, ...batch]);
                    before = response.data.next || undefined;
                } while (before && !controller.signal.aborted);
            } catch (error) {
                if (!controller.signal.aborted) console.error("Chat history search", error);
            }
        }, 300);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [chatReady, activeHeader, historyChatId, search]);

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
    const savedChat = chatReady && !id && !!nick && !!user.nick &&
        nick.toLowerCase() === user.nick.toLowerCase() && !chatWith?.is_group;
    const lastMessage = messages[messages.length - 1];
    const smartSuggestion = savedChat && savedSmartEnabled && lastMessage &&
        !lastMessage.is_system && !lastMessage.isPending && !lastMessage.edited &&
        lastMessage.sender_id === user.id &&
        !lastMessage.files?.length && !lastMessage.redirected_id
        ? parseSavedMessageSuggestion(lastMessage.content, todayStrFunc(), clockInAppZone())
        : null;

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
            if (pendingScrollId === null || !chatReady) return;
            pinnedBottomRef.current = false;
            let cancelled = false;
            scrollToMessage(pendingScrollId).finally(
                () => {
                    if (!cancelled) setPendingScrollId(current => current === pendingScrollId ? null : current);
                }
            );
            return () => { cancelled = true; };
        },
        [pendingScrollId, chatReady, scrollToMessage, setPendingScrollId]
    );

    useEffect(
        () => {
            const el = chatContainerRef.current;
            if (!el || !chatReady) return;
            const onScroll = () => {
                const snapshot = prependSnapshotRef.current;
                const contentResized = Math.abs(el.scrollHeight - measuredScrollHeightRef.current) > 1;
                if (snapshot) {
                    // Continue following the reader, not the scrollTop at request start.
                    snapshot.anchor = captureHistoryAnchor(el) || snapshot.anchor;
                    pinnedBottomRef.current = false;
                } else if (contentResized && pinnedBottomRef.current && !isLoadingMoreRef.current && pendingScrollId === null) {
                    el.scrollTop = el.scrollHeight;
                } else {
                    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                    pinnedBottomRef.current = distanceFromBottom < 80;
                }
                measuredScrollHeightRef.current = el.scrollHeight;
                setShowGoDown(el.scrollHeight - el.scrollTop - el.clientHeight > 250);
                if (!initialScrolledRef.current || pendingScrollId !== null || el.scrollHeight <= el.clientHeight + 20 ||
                    !hasMore || !messages.length || isLoadingMoreRef.current || loadingMore ||
                    performance.now() < historyRetryAfterRef.current) return;

                const thresholdId = messages[Math.min(HISTORY_PREFETCH_REMAINING - 1, messages.length - 1)].id;
                const threshold = el.querySelector<HTMLElement>(`[data-history-message-id="${thresholdId}"]`);
                const visibleTop = el.getBoundingClientRect().top + (parseFloat(getComputedStyle(el).scrollPaddingTop) || 0);
                const nearHistory = threshold && threshold.getBoundingClientRect().bottom >= visibleTop;
                if (!nearHistory && el.scrollTop >= 150) return;
                // Do not auto-page while the reader is at the newest messages.
                if (pinnedBottomRef.current && el.scrollTop > 150) return;

                isLoadingMoreRef.current = true;
                pinnedBottomRef.current = false;
                const request: HistoryLoad = { anchor: captureHistoryAnchor(el), finished: false };
                prependSnapshotRef.current = request;
                void loadOlderMessages().finally(() => {
                    if (prependSnapshotRef.current !== request) return;
                    request.finished = true;
                    // Ensure a layout commit even if the response contained no rows.
                    setHistoryCommit(value => value + 1);
                });
            };
            const onInset = (event: Event) => {
                measuredScrollHeightRef.current = el.scrollHeight;
                const snapshot = prependSnapshotRef.current;
                const { padding, top } = (event as CustomEvent<{ padding: number; top: number }>).detail;
                if (snapshot?.anchor) snapshot.anchor.offset += padding - top;
            };
            el.addEventListener("chat-action-inset", onInset);
            el.addEventListener("scroll", onScroll, {
                passive: true
            });
            return () => {
                el.removeEventListener("scroll", onScroll);
                el.removeEventListener("chat-action-inset", onInset);
            };
        },
        [chatReady, hasMore, loadingMore, loadOlderMessages, messages, pendingScrollId]
    );

    useLayoutEffect(
        () => {
            const el = chatContainerRef.current;
            if (!chatReady || !el) return;
            const snapshot = prependSnapshotRef.current;
            if (snapshot) {
                if (pendingScrollId === null) restoreHistoryAnchor(el, snapshot.anchor);
                measuredScrollHeightRef.current = el.scrollHeight;
                pinnedBottomRef.current = false;
                if (snapshot.finished && !loadingMore) {
                    prependSnapshotRef.current = null;
                    isLoadingMoreRef.current = false;
                    historyRetryAfterRef.current = performance.now() + 250;
                }
                return;
            }
            if (!initialScrolledRef.current) {
                el.scrollTop = el.scrollHeight;
                measuredScrollHeightRef.current = el.scrollHeight;
                initialScrolledRef.current = true;
                pinnedBottomRef.current = true;
            } else if (pinnedBottomRef.current && pendingScrollId === null) {
                el.scrollTop = el.scrollHeight;
                measuredScrollHeightRef.current = el.scrollHeight;
            }
        },
        [chatReady, messages, unreadDividerId, pendingScrollId, loadingMore, historyCommit]
    );

    useEffect(() => {
        const el = chatContainerRef.current;
        if (!chatReady || !el || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => {
            const snapshot = prependSnapshotRef.current;
            if (snapshot && pendingScrollId === null) {
                restoreHistoryAnchor(el, snapshot.anchor);
            } else if (initialScrolledRef.current && pinnedBottomRef.current && !isLoadingMoreRef.current && pendingScrollId === null) {
                el.scrollTop = el.scrollHeight;
            }
            measuredScrollHeightRef.current = el.scrollHeight;
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
            {chatReady && <ChatActionPanel key={chatWith?.chat_id} searchedMessages={searchedMessages}/>}
            <div className={`chat AH${activeHeader}${loadingMore ? " historyLoading" : ""}`} ref={chatContainerRef}>
                {loadingMore && <Skeleton type="chatHistory" count={3} /> }

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
                                        smartSuggestion={smartSuggestion && m.id === lastMessage?.id ? smartSuggestion : undefined}
                                        onSmartCreate={() => {
                                            if (!smartSuggestion || !lastMessage || m.id !== lastMessage.id) return;
                                            const fresh = parseSavedMessageSuggestion(m.content, todayStrFunc(), clockInAppZone());
                                            if (!fresh) return;
                                            setBlackout({
                                                seted: true,
                                                module: fresh.draft.kind === "habit" ? "AddHabit" : "AddPlan",
                                                commandDraft: fresh.draft
                                            });
                                        }}
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
            />
        </div>
    );
}
