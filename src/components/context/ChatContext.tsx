import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import { showBrowserNotification } from "../ts/utils/NoteRequest";
import { useSettings } from "../hooks/SettingsHook";
import { useNavigate } from "react-router";
import axios from "axios";

const ChatContext = createContext<ChatContextType | null>(null);

export interface chatWithType {
    name?: string | null,
    nick: string,
    id: string,
    avatar_url?: string | null,
    note:boolean,
    is_blocked:boolean,
    pinned:boolean,
    am_i_blocked:boolean,
    is_group:boolean,
    members: { id:string, nick:string, avatar_url:string }[],
    last_online: string,
}
export interface ReactionsType {
    user_id: string,
    reaction: string,
}

export interface Media {
    url: string,
    name: string,
    type: string,
    message_id:string
}

export interface ChatContextType {
    chatWith: chatWithType | null,
    refetchChat: (nick: string) => Promise<void>,
    refetchChatWLoading: (nick: string) => Promise<void>,
    refetchGroupChat: (id: string) => Promise<void>,
    refetchGroupChatWLoading: (id: string) => Promise<void>,
    chatLoading: boolean,
    messages: message[],
    list: Contact[],
    search: string,
    setSearch: React.Dispatch<React.SetStateAction<string>>,
    refetchContacts: () => Promise<void>,
    refetchContactsWTLoading: () => Promise<void>,
    onlineMap: Record<string, boolean>,
    setReaction: (mId: number, reaction: string) => Promise<void>,
    handleTyping: (nick: string) => void,
    typingStatus: boolean,
    loadingList: boolean,
}

export interface message {
    id: number,
    sender_id: string,
    sender_name: string,
    sender_nick: string,
    content: string,
    created_at: Date,
    files?: Media[],
    read_by: string[],
    reactions: ReactionsType[],
    answer_id: number | null,
    edited: boolean,
    redirected_id: number | null,  
    redirected_name?: string | null,  
    redirected_nick?: string | null,  
    redirected_content?: string | null, 
    redirected_files?: Media[] | null,  
    redirected_answer?: number | null,
    is_system: boolean,
    is_pinned:boolean,
    target_id:string | null,
}

export interface Contact {
    id: string,
    name: string | null,
    nick: string,
    avatar_url?: string | null,
    lastMessage: message | null,
    unread_count: number,
    note:boolean,
    is_blocked:boolean,
    pinned:boolean,
    is_group:boolean,
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { showNotification } = useNote();
    const { note, messNote } = useSettings();
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_API_URL;
    const API_WS = import.meta.env.VITE_API_WS;

    const [ chatWith, setChatWith ] = useState<chatWithType | null>(null);
    const [ messages, setMessages ] = useState<message[]>([]);
    const [ chatLoading, setChatLoading ] = useState<boolean>(true);
    const [ list, setList ] = useState<Contact[]>([]);
    const [ loadingList, setLoadingList ] = useState(true);
    const [ search, setSearch ] = useState<string>("");
    const [ onlineMap, setOnlineMap ] = useState<Record<string, boolean>>({});
    const [ isTyping, setIsTyping ] = useState(false);
    const [ typingStatus, setTypingStatus ] = useState(false);
    
    const typingTimeout = useRef<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const chatWithRef = useRef<chatWithType>(chatWith);

    useEffect(() => {
        chatWithRef.current = chatWith;
    }, [chatWith]);

    const refetchChat = async (nick: string) => {
        try {
            const res = await api.get(`${API_URL}chat/${nick}`);
            if (res.data.success) {
                setChatWith({ name: res.data.user.username, nick: res.data.user.nick, id: res.data.user.id, avatar_url: res.data.user.avatar_url,
                    last_online: res.data.user.last_online, note:res.data.user.note, is_blocked:res.data.user.is_blocked, pinned:res.data.user.pinned, am_i_blocked:res.data.user.am_i_blocked,
                    is_group:false, members: [] });
                setMessages(res.data.messages);
            } else {
                showNotification("error", "Не удалось получить данные");
                if (window.history.length > 0) {
                    navigate(-1);
                } else {
                    navigate("/");
                }
            }
        } catch {
            showNotification("error", "Не удалось получить данные");
            if (window.history.length > 0) {
                navigate('/');
            } else {
                // navigate("/");
            }
        } finally { 
            setChatLoading(false);
        }
    };

    const refetchGroupChatWLoading = async (nick: string) => {
        setChatLoading(true);
        await refetchChat(nick);
    }

    const refetchGroupChat = async (id: string) => {
        try {
            const res = await api.get(`${API_URL}chat/group/${id}`);
            if (res.data.success) {
                setChatWith({
                    ...res.data.chat,
                    is_group: true,
                    last_online: "",
                    nick: `group_${id}`,
                })
                setMessages(res.data.messages);
            } else {
                showNotification("error", res.data.message || "Не удалось получить данные группы");
                navigate("/");
            }
        } catch (error) {
            console.error(error);
            if (axios.isAxiosError(error)) {
                showNotification("error", error.response?.data?.error || "Не удалось получить данные группы");
            }
            navigate("/");
        } finally {
            setChatLoading(false);
        }
    };

    const refetchChatWLoading = async (id: string) => {
        setChatLoading(true);
        await refetchChat(id);
    }

    const refetchContactsWTLoading = useCallback(async () => {
        if (user.nick === null) return;
        try {
            const res = await api.post(`${API_URL}contacts`, { search });
            if (res.data.success) {
                const sortedList = res.data.friendsArr.slice().sort((a:Contact, b:Contact) => {
                    if (a.pinned !== b.pinned) {
                        return a.pinned ? -1 : 1; 
                    }

                    const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
                    const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;

                    return timeB - timeA;
                });
                setList(sortedList);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            showNotification("error", error?.response?.data?.error);
        } finally {
            setLoadingList(false);
        }
    }, [API_URL, search, showNotification, user.nick]);

    const refetchContacts = useCallback(async () => {
        setLoadingList(true);
        await refetchContactsWTLoading();
    }, [refetchContactsWTLoading]);


    useEffect(() => {
        if (!user?.id) return;
        wsRef.current = new WebSocket(`${API_WS}ws?userId=${user.id}`);
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.type)
            if (data.type === "NEW_MESSAGE") {
                const messageSenderId = String(data.message.sender_id);
                if (messageSenderId === user.id || (chatWithRef.current && messageSenderId === chatWithRef.current.id) || (chatWithRef.current?.is_group)) {
                    setMessages(prev => {
                        return [...prev, data.message];
                    });
                }
                refetchContactsWTLoading();
                if (document.visibilityState === "hidden" && messageSenderId !== user.id && note && messNote && data.is_note) {
                    const senderName = data.username
                        ? `${data.username} | ${data.nick}`
                        : data.nick || "Новый собеседник";
                    const bodyText =
                        data.message.content && data.message.content.trim() !== ""
                            ? data.message.content
                            : `${data.message.files?.length || 0} медиафайл(ов)`;
                    showBrowserNotification(senderName, {
                        body: bodyText,
                        icon: "/favicon.png",
                        url: data.is_group
                            ? `/chat/g/${data.chat_id}`
                            : `/chat/${data.nick}`,  // Изменено на data.nick
                    });
                }
            }
            if (data.type === "USER_STATUS") {
                setOnlineMap(prev => ({
                    ...prev,
                    [data.userId]: data.isOnline
                }));
                if (
                    chatWithRef.current &&
                    chatWithRef.current.id === data.userId &&
                    !chatWithRef.current.is_group
                ) {
                    setChatWith(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        last_online: data.isOnline ? "" : (data.last_online || prev.last_online)
                    };
                    });
                }
            }
            if (data.type === "MESSAGE_READ") {
                console.log(data)
                setMessages(prev =>
                    prev.map(m =>
                        m.id === data.messageId
                        ? { ...m, read_by: [...m.read_by, data.userId] }
                        : m
                    )
                );
                refetchContactsWTLoading()
            }
            if (data.type === "MESSAGE_PIN_TOGGLED") {
                setMessages(prev =>
                    prev.map(m =>
                    m.id === data.message_id
                        ? { ...m, is_pinned: data.is_pinned }
                        : m
                    )
                );
            }
            if (data.type === "MESSAGE_REACTION") {
                setMessages(prev =>
                    prev.map(m => {
                        if (m.id !== data.messageId) return m;
                        const reactions = m.reactions || [];
                        if (data.removed) {
                            return {
                                ...m,
                                reactions: reactions.filter(r => !(r.user_id === data.user_id && r.reaction === data.reaction))
                            };
                        } else {
                            return {
                                ...m,
                                reactions: [
                                    ...reactions.filter(r => !(r.user_id === data.user_id && r.reaction === data.reaction)),
                                    { user_id: data.user_id, reaction: data.reaction }
                                ]
                            };
                        }
                    })
                );
            }
            if (data.type === "GROUP_UPDATED") {
                refetchContactsWTLoading();

                if (chatWith?.is_group && chatWith.id === data.group_id) {
                    refetchGroupChat(data.group_id);
                }

                // Для страницы /room/
                if (location.pathname.startsWith("/room/")) {
                    const currentGroupId = location.pathname.split("/room/")[1];
                    if (currentGroupId === String(data.group_id)) {
                        window.dispatchEvent(new CustomEvent("groupUpdated", { detail: data.group_id }));
                    }
                }
            }
            if (data.type === "KICKED_FROM_GROUP") {
                const kickedGroupId:string = data.group_id;

                showNotification("info", 
                    data.reason === "kicked" 
                    ? `Вы были исключены из группы "${data.group_name}"`
                    : `Вы покинули группу "${data.group_name}"`
                );

                if (chatWith?.is_group && String(chatWith.id) === String(kickedGroupId)) {
                    navigate("/");
                }

                if (location.pathname.startsWith("/room/")) {
                    const currentId:string = location.pathname.split("/room/")[1];
                    if (currentId === kickedGroupId) {
                        navigate("/");
                    }
                }

                // Обновляем список чатов (группа исчезнет из preview)
                refetchContactsWTLoading();
                }
            if (data.type === "TYPING" && chatWith?.is_group === false) {
                if (chatWithRef.current && "nick" in chatWithRef.current && data.from === chatWithRef.current.id) {
                    setTypingStatus(true);
                }
            }
            if (data.type === "STOP_TYPING" && chatWith?.is_group === false) {
                if (chatWithRef.current && "nick" in chatWithRef.current && data.from === chatWithRef.current.id) {
                    setTypingStatus(false);
                }
            }
            if (data.type === "MESSAGE_DELETED") {
                console.log("Received MESSAGE_DELETED", data);
                setMessages(prev =>
                    prev.filter(m => String(m.id) !== String(data.messageId))
                );
                refetchContactsWTLoading()
            }
            if (data.type === "MESSAGE_EDITED") {
                setMessages(prev =>
                    prev.map(m => m.id === data.message.id ? { ...data.message, edited: true } : m)
                );
                refetchContactsWTLoading();
            }
        };
        return () => wsRef.current?.close();
    }, [user.id, refetchContacts, API_WS, note, messNote, refetchContactsWTLoading]);

    const setReaction = async (mId: number, reaction: string) => {
        try {
            await api.post("/reactions", { mId, reaction });
        } catch (err) {
            console.error("Ошибка при отправке реакции", err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(refetchContacts, 100);
        return () => clearTimeout(timer);
    }, [search, refetchContacts]);

    const handleTyping = (nick: string) => {
        if (!user?.id || !nick) return;
        if (!isTyping) {
            wsRef.current?.send(JSON.stringify({
                type: "TYPING",
                to: nick
            }));
            setIsTyping(true);
        }
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }
        typingTimeout.current = window.setTimeout(() => {
            wsRef.current?.send(JSON.stringify({
                type: "STOP_TYPING",
                to: nick
            }));
            setIsTyping(false);
            typingTimeout.current = null;
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, []);

    return (
        <ChatContext.Provider value={{ chatWith, refetchChat, refetchChatWLoading, chatLoading, messages, list, setSearch, search,
            refetchContacts, onlineMap, setReaction, handleTyping, typingStatus, loadingList, refetchContactsWTLoading, refetchGroupChat, refetchGroupChatWLoading }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;