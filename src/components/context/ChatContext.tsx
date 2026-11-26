import { createContext, useState, useEffect, useLayoutEffect, useCallback, useRef, type SetStateAction } from "react";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import { useSettings } from "../hooks/SettingsHook";
import { useNavigate } from "react-router";
import axios from "axios";
import { NotificationAggregator } from "../ts/utils/NotificationAggregator";
import { useWebSocket } from "../hooks/WebSocketHook";
export interface chatWithType {
    name?: string | null;
    nick: string;
    id: string;
    avatar_url?: string | null;
    note: boolean;
    is_blocked: boolean;
    pinned: boolean;
    am_i_blocked: boolean;
    is_group: boolean;
    can_send_messages?: boolean;
    deletion_pending?: boolean;
    members: {
        id: string;
        nick: string;
        avatar_url: string;
    }[];
    last_online: string;
    chat_id: string;
    welcome_message?: string | null;
}
export interface ReactionsType {
    user_id: string;
    reaction: string;
}
export interface Media {
    url: string;
    name: string;
    type: string;
    message_id: string;
}
export interface message {
    id: number;
    sender_id: string;
    sender_name: string;
    sender_nick: string;
    sender_avatar_url: string;
    content: string;
    entity_type?: "user" | "habit" | "plan" | "post" | "group" | null;
    entity_id?: string | null;
    created_at: Date;
    files?: Media[];
    read_by: string[];
    reactions: ReactionsType[];
    answer_id: number | null;
    edited: boolean;
    redirected_id: number | null;
    redirected_name?: string | null;
    redirected_nick?: string | null;
    redirected_content?: string | null;
    redirected_files?: Media[] | null;
    redirected_answer?: number | null;
    is_system: boolean;
    is_pinned: boolean;
    target_id: string | null;
    habit_invite_habit_id?: number | null;
    habit_invite_recipient_id?: string | null;
    plan_invite_plan_id?: number | null;
    plan_invite_recipient_id?: string | null;
    isPending?: boolean;
    clientId?: number;
    animateIn?: boolean;
}
export type activeHeaderType = "text" | "search" | "pinned" | "habit" | "choosing";
export type LibraryCategory = "media" | "link" | "file" | "activity";
export interface ChatLibrary {
    tabs: Record<LibraryCategory, boolean>;
    activity: {kind: "habit" | "plan" | "goal"; id: string; name: string}[];
    pins: message[];
}
export interface ChatContextType {
    library: ChatLibrary | null;
    chatWith: chatWithType | null;
    refetchChat: (nick: string) => Promise<void>;
    refetchChatWLoading: (nick: string) => Promise<void>;
    refetchGroupChat: (id: string) => Promise<void>;
    refetchGroupChatWLoading: (id: string) => Promise<void>;
    chatLoading: boolean;
    messages: message[];
    setMessages: React.Dispatch<React.SetStateAction<message[]>>;
    searchMess: string;
    setSearchMess: React.Dispatch<React.SetStateAction<string>>;
    setReaction: (mId: number, reaction: string) => Promise<void>;
    handleTyping: (id: string) => void;
    typingMap: Record<string, string[]>;
    stopTyping: () => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    // пагинация
    hasMore: boolean;
    loadingMore: boolean;
    loadOlderMessages: () => Promise<void>;
    loadAroundMessage: (messageId: number) => Promise<boolean>;
    activeHeader: activeHeaderType;
    chatPanelHidden: boolean;
    setChatPanelHidden: React.Dispatch<SetStateAction<boolean>>;
    setActiveHeader: React.Dispatch<SetStateAction<activeHeaderType>>;
}
const ChatContext = createContext<ChatContextType | null>(null);
export const ChatProvider = ({
    children
}: {
    children: ReactNode;
}) => {
    const {
        user,
        isAuthenticated
    } = useUser();
    const { showNotification } = useNote();
    const { t } = useTranslation("common");
    const {
        note,
        messNote
    } = useSettings();
    const {
        ws,
        send
    } = useWebSocket();
    const navigate = useNavigate();
    const [chatWith, setChatWith] = useState<chatWithType | null>(null);
    const [messages, setMessages] = useState<message[]>([]);
    const [libraryState, setLibraryState] = useState<{ id: string; data: ChatLibrary } | null>(null);
    const [libraryRevision, setLibraryRevision] = useState(0);
    const libraryId = chatWith?.chat_id ? String(chatWith.chat_id) : "";
    const library = libraryState?.id === libraryId ? libraryState.data : null;
    const lastMessageId = messages[messages.length - 1]?.id;
    const visibleMessageCount = messages.length;
    const loadedPins = messages.filter(m => m.is_pinned).map(m => m.id).join(",");
    useEffect(() => {
        if (!libraryId || !isAuthenticated) { setLibraryState(null); return; }
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            void api.get("chat/library/" + libraryId, { signal: controller.signal }).then(response => {
                if (!controller.signal.aborted && response.data.success) setLibraryState({ id: libraryId, data: response.data });
            }).catch(() => {});
        }, 100);
        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [libraryId, isAuthenticated, lastMessageId, visibleMessageCount, loadedPins, libraryRevision]);
    useEffect(() => {
        if (!libraryId) return;
        const refresh = () => setLibraryRevision(value => value + 1);
        const events = ["groupUpdated","at-goals-updated","plan-members-updated","plan-invitation-updated","habit-invitation-updated","focus"];
        events.forEach(event => window.addEventListener(event, refresh));
        return () => events.forEach(event => window.removeEventListener(event, refresh));
    }, [libraryId]);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingMap, setTypingMap] = useState<Record<string, string[]>>({});
    const [searchMess, setSearchMess] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeHeader, setActiveHeader] = useState<activeHeaderType>("text");
    const [chatPanelHidden, setChatPanelHidden] = useState(false);
    useLayoutEffect(() => { setChatPanelHidden(false); }, [chatWith?.chat_id, activeHeader]);
    const typingTimeout = useRef<number | null>(null);
    const chatWithRef = useRef<chatWithType | null>(chatWith);
    const notificationAggregator = new NotificationAggregator();
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const chatAbortRef = useRef<AbortController | null>(null);
    const olderAbortRef = useRef<AbortController | null>(null);
    const cancelOlder = useCallback(() => {
        olderAbortRef.current?.abort();
        olderAbortRef.current = null;
        setLoadingMore(false);
    }, []);
    const reactionPendingRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        chatWithRef.current = chatWith;
    }, [chatWith]);
    const refetchChat = async (nick: string) => {
        if (!isAuthenticated) return;
        cancelOlder();
        chatAbortRef.current?.abort();
        const controller = new AbortController();
        chatAbortRef.current = controller;
        try {
            const res = await api.get(
                `chat/${nick}`,
                {
                    params: {
                        limit: 50
                    },
                    signal: controller.signal
                }
            );
            if (controller.signal.aborted) return;
            if (res.data.success) {
                const u = res.data.user;
                setChatWith(
                    {
                        name: u.username,
                        nick: u.nick,
                        id: u.id,
                        avatar_url: u.avatar_url,
                        last_online: u.last_online,
                        note: u.note,
                        is_blocked: u.is_blocked,
                        pinned: u.pinned,
                        am_i_blocked: u.am_i_blocked,
                        is_group: false,
                        members: [],
                        chat_id: res.data.chat_id,
                        welcome_message: res.data.welcome_message ?? null,
                        deletion_pending: Boolean(u.deletion_pending)
                    }
                );
                setMessages(res.data.messages || []);
                setHasMore(res.data.hasMore ?? true);
            } else {
                showNotification("error", "Не удалось получить данные");
                if (window.history.length > 0) navigate(-1); else navigate("/");
            }
        } catch (error) {
            if (axios.isCancel(error)) return;
            showNotification("error", "Не удалось получить данные");
            navigate("/");
        } finally {
            if (!controller.signal.aborted) {
                setChatLoading(false);
            }
        }
    };
    const refetchChatWLoading = async (nick: string) => {
        setChatLoading(true);
        setMessages([]);
        setHasMore(true);
        await refetchChat(nick);
    };
    const refetchGroupChat = async (id: string) => {
        if (!isAuthenticated) return;
        cancelOlder();
        chatAbortRef.current?.abort();
        const controller = new AbortController();
        chatAbortRef.current = controller;
        try {
            const res = await api.get(
                `chat/group/${id}`,
                {
                    params: {
                        limit: 50
                    },
                    signal: controller.signal
                }
            );
            if (controller.signal.aborted) return;
            if (res.data.success) {
                setChatWith(
                    {
                        ...res.data.chat,
                        is_group: true,
                        last_online: "",
                        nick: `group_${id}`,
                        chat_id: res.data.chat.id
                    }
                );
                setMessages(res.data.messages || []);
                setHasMore(res.data.hasMore ?? true);
            } else {
                showNotification("error", res.data.message || "Не удалось получить данные группы");
                navigate("/");
            }
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error(error);
            if (axios.isAxiosError(error)) {
                showNotification("error", error.response?.data?.error || "Не удалось получить данные группы");
            }
            navigate("/");
        } finally {
            if (!controller.signal.aborted) {
                setChatLoading(false);
            }
        }
    };
    const refetchGroupChatWLoading = async (id: string) => {
        setChatLoading(true);
        setMessages([]);
        setHasMore(true);
        await refetchGroupChat(id);
    };
    const loadOlderMessages = useCallback(
        async () => {
            if (!chatWith || loadingMore || olderAbortRef.current || !hasMore || messages.length === 0) return;
            const controller = new AbortController();
            olderAbortRef.current = controller;
            setLoadingMore(true);
            try {
                const oldestId = messages[0].id;
                const url = chatWith.is_group ? `chat/group/${chatWith.id}` : `chat/${chatWith.nick}`;
                const res = await api.get(
                    url,
                    {
                        params: {
                            limit: 40,
                            beforeId: oldestId
                        },
                        signal: controller.signal
                    }
                );
                if (controller.signal.aborted || olderAbortRef.current !== controller) return;
                if (res.data.success) {
                    const older: message[] = res.data.messages || [];
                    if (older.length === 0) {
                        setHasMore(false);
                    } else {
                        setMessages(prev => {
                            const ids = new Set(prev.map(item => item.id));
                            return [...older.filter(item => !ids.has(item.id)), ...prev];
                        });
                        setHasMore(res.data.hasMore ?? older.length === 40);
                    }
                }
            } catch (e) {
                if (!controller.signal.aborted) console.error("Ошибка загрузки старых сообщений:", e);
            } finally {
                if (olderAbortRef.current === controller) {
                    olderAbortRef.current = null;
                    setLoadingMore(false);
                }
            }
        },
        [chatWith, loadingMore, hasMore, messages]
    );
    const loadAroundMessage = useCallback(
        async (messageId: number): Promise<boolean> => {
            if (!chatWith) return false;
            cancelOlder();
            try {
                const url = chatWith.is_group ? `chat/group/${chatWith.id}` : `chat/${chatWith.nick}`;
                const res = await api.get(
                    url,
                    {
                        params: {
                            limit: 60,
                            aroundId: messageId
                        }
                    }
                );
                if (res.data.success && res.data.messages?.length) {
                    cancelOlder();
                    setMessages(res.data.messages);
                    setHasMore(res.data.hasMore ?? true);
                    return true;
                }
                return false;
            } catch (e) {
                console.error("Ошибка загрузки вокруг сообщения:", e);
                return false;
            }
        },
        [chatWith, cancelOlder]
    );

    useEffect(
        () => {
            if (!ws) return;
            const handleMessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);
                if (data.type === "NEW_MESSAGE") {
                    const messageSenderId = String(data.message.sender_id);
                    if (chatWithRef.current && String(chatWithRef.current.chat_id) === String(data.chat_id)) {
                        setMessages(
                            prev => {
                                // Подтверждение своего сообщения выполняется по точному ID из ответа POST /chat.
                                // Не подменяем первое временное сообщение: событие может относиться к другой вкладке.
                                // Обычное добавление
                                if (prev.some(m => m.id === data.message.id)) return prev;
                                return [...prev, {
                                    ...data.message,
                                    animateIn: true
                                }];
                            }
                        );
                    }
                    if (document.visibilityState === "hidden" && messageSenderId !== user.id && note && messNote && data.is_note) {
                        const chatKey = data.is_group ? `g_${data.chat_id}` : `p_${data.nick ?? data.message.sender_id}`;
                        notificationAggregator.enqueueMessage(
                            chatKey,
                            {
                                content: data.message.content,
                                files: data.message.files,
                                is_group: data.is_group,
                                chat_id: data.chat_id,
                                nick: data.nick,
                                username: data.username,
                                chat_name: data.chat_name
                            }
                        );
                    }
                }
                if (data.type === "USER_STATUS") {
                    if (chatWithRef.current && chatWithRef.current.id === data.userId && !chatWithRef.current.is_group) {
                        setChatWith(
                            prev => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    last_online: data.isOnline ? "" : data.last_online || prev.last_online
                                };
                            }
                        );
                    }
                }
                if (data.type === "MESSAGE_READ") {
                    setMessages(
                        prev => prev.map(
                            m => m.id === data.messageId ? {
                                ...m,
                                read_by: [...m.read_by, data.userId]
                            } : m
                        )
                    );
                }
                if (["MESSAGE_PIN_TOGGLED", "MESSAGE_DELETED", "MESSAGE_EDITED", "GROUP_UPDATED"].includes(data.type)) setLibraryRevision(value => value + 1);
                if (data.type === "MESSAGE_PIN_TOGGLED") {
                    setMessages(
                        prev => prev.map(
                            m => m.id === data.message_id ? {
                                ...m,
                                is_pinned: data.is_pinned
                            } : m
                        )
                    );
                }
                if (data.type === "MESSAGE_REACTION") {
                    setMessages(
                        prev => prev.map(
                            m => {
                                if (m.id !== data.messageId) return m;
                                const reactions = m.reactions || [];
                                if (data.removed) {
                                    return {
                                        ...m,
                                        reactions: reactions.filter(r => r.user_id !== data.user_id)
                                    };
                                } else {
                                    return {
                                        ...m,
                                        reactions: [...reactions.filter(r => r.user_id !== data.user_id), {
                                            user_id: data.user_id,
                                            reaction: data.reaction
                                        }]
                                    };
                                }
                            }
                        )
                    );
                }
                if (data.type === "GROUP_UPDATED") {
                    if (chatWithRef.current?.is_group && String(chatWithRef.current.id) === String(data.group_id)) {
                        refetchGroupChat(data.group_id);
                    }
                    if (location.pathname.startsWith("/room/")) {
                        const currentGroupId = location.pathname.split("/room/")[1];
                        if (currentGroupId === String(data.group_id)) {
                            window.dispatchEvent(
                                new CustomEvent(
                                    "groupUpdated",
                                    {
                                        detail: data.group_id
                                    }
                                )
                            );
                        }
                    }
                }
                if (data.type === "KICKED_FROM_GROUP") {
                    const kickedGroupId: string = data.group_id;
                    showNotification(
                        "info",
                        data.reason === "kicked" ? `Вы были исключены из группы "${data.group_name}"` : `Вы покинули группу "${data.group_name}"`
                    );
                    if (chatWithRef.current?.is_group && String(chatWithRef.current?.id) === String(kickedGroupId)) {
                        navigate("/");
                    }
                    if (location.pathname.startsWith("/room/")) {
                        const currentId: string = location.pathname.split("/room/")[1];
                        if (currentId === kickedGroupId) {
                            navigate("/");
                        }
                    }
                }
                if (data.type === "TYPING") {
                    const chatKey = data.chat_id || data.from;
                    setTypingMap(
                        prev => ({
                            ...prev,
                            [chatKey]: [...new Set([...(prev[chatKey] || []), data.sender_name])]
                        })
                    );
                }
                if (data.type === "STOP_TYPING") {
                    const chatKey = data.chat_id || data.from;
                    setTypingMap(
                        prev => ({
                            ...prev,
                            [chatKey]: (prev[chatKey] || []).filter(name => name !== data.sender_name)
                        })
                    );
                }
                if (data.type === "MESSAGE_DELETED") {
                    setMessages(prev => prev.filter(m => String(m.id) !== String(data.messageId)));
                }
                if (data.type === "HABIT_INVITATION_UPDATED" || data.type === "PLAN_INVITATION_UPDATED") {
                    window.dispatchEvent(new CustomEvent(
                        data.type === "PLAN_INVITATION_UPDATED" ? "plan-invitation-updated" : "habit-invitation-updated",
                        { detail: data.message.id }
                    ));
                }
                if (data.type === "MESSAGE_EDITED") {
                    setMessages(
                        prev => prev.map(
                            m => m.id === data.message.id ? {
                                ...data.message,
                                edited: true
                            } : m
                        )
                    );
                }
            };
            ws.addEventListener("message", handleMessage);
            return () => ws.removeEventListener("message", handleMessage);
        },
        [ws, user.id, note, messNote, showNotification, navigate]
    );
    const setReaction = async (mId: number, reaction: string) => {
        const userId = user.id;
        if (!userId || mId <= 0 || reactionPendingRef.current.has(mId)) return;

        const current = messages.find(message => message.id === mId);
        if (!current || current.isPending) return;

        const previousOwnReactions = (current.reactions || []).filter(r => r.user_id === userId);
        const wasReacted = previousOwnReactions.some(r => r.reaction === reaction);
        reactionPendingRef.current.add(mId);

        setMessages(prev => prev.map(message => {
            if (message.id !== mId) return message;
            const reactions = (message.reactions || []).filter(r => r.user_id !== userId);
            return {
                ...message,
                reactions: wasReacted ? reactions : [...reactions, { user_id: userId, reaction }]
            };
        }));

        try {
            const response = await api.post("/reactions", { mId, reaction });
            if (!response.data?.success) throw new Error("Reaction was not saved");
        } catch (err) {
            setMessages(prev => prev.map(message => {
                if (message.id !== mId) return message;
                const reactions = (message.reactions || []).filter(r => r.user_id !== userId);
                return {
                    ...message,
                    reactions: [...reactions, ...previousOwnReactions]
                };
            }));
            showNotification("error", t("chatUi.reactionFailed"));
            console.error("Ошибка при отправке реакции", err);
        } finally {
            reactionPendingRef.current.delete(mId);
        }
    };

    useEffect(
        () => {
            return () => {
                chatAbortRef.current?.abort();
            };
        },
        []
    );
    const stopTyping = useCallback(
        () => {
            if (!user?.id || !chatWithRef.current || !ws) return;
            send(
                JSON.stringify(
                    {
                        type: "STOP_TYPING",
                        to: chatWithRef.current.id,
                        is_group: chatWithRef.current.is_group
                    }
                )
            );
            setIsTyping(false);
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
                typingTimeout.current = null;
            }
        },
        [user?.id, ws, send]
    );
    const handleTyping = (id: string) => {
        if (!user?.id || !chatWithRef.current) return;
        if (!isTyping) {
            send(
                JSON.stringify(
                    {
                        type: "TYPING",
                        to: id,
                        is_group: chatWithRef.current.is_group
                    }
                )
            );
            setIsTyping(true);
        }
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = window.setTimeout(() => {
            stopTyping();
        }, 2000);
    };

    useEffect(
        () => {
            return () => {
                if (typingTimeout.current) {
                    clearTimeout(typingTimeout.current);
                }
            };
        },
        []
    );

    return (
        <ChatContext.Provider
            value={{
                chatWith,
                library,
                refetchChat,
                refetchChatWLoading,
                chatLoading,
                messages,
                setMessages,
                setReaction,
                handleTyping,
                typingMap,
                stopTyping,
                searchInputRef,
                searchMess,
                setSearchMess,
                refetchGroupChat,
                refetchGroupChatWLoading,
                hasMore,
                loadingMore,
                loadOlderMessages,
                loadAroundMessage,
                activeHeader,
                chatPanelHidden,
                setChatPanelHidden,
                setActiveHeader
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
export default ChatContext;
