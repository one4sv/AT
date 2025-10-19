import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import axios from "axios";
import { api } from "../ts/api";
import { showBrowserNotification } from "../ts/utils/NoteRequest";
import { useSettings } from "../hooks/SettingsHook";

const ChatContext = createContext<ChatContextType | null>(null);

export interface chatWithType {
    username?:string | null,
    nick:string,
    id:string,
    last_online:string,
    avatar_url?: string | null,
}
export interface ReactionsType {
    user_id:string,
    reaction:string,
}

export interface ChatContextType {
    chatWith:chatWithType,
    refetchChat:(chatWithId:string) => Promise<void>,
    sendMess:(receiver_id:string, text:string, files?: File[]) => Promise<void>,
    chatLoading:boolean,
    messages:message[],
    list:Acc[],
    search:string,
    setSearch:React.Dispatch<React.SetStateAction<string>>,
    refetchContacts:() => Promise<void>,
    onlineMap: Record<string, boolean>,
    setReaction: (mId: number, reaction:string) => Promise<void>,
    handleTyping:(contactId:string) => void,
    typingStatus:boolean
}

export interface message {
    id:number,
    sender_id:string,
    content:string,
    created_at:Date,
    files?: { url: string, name: string, type: string }[],
    read_by:string[],
    reactions:ReactionsType[]
}

export interface Acc {
    id:string,
    username:string | null,
    nick:string,
    avatar_url?: string | null,
    lastMessage:message | null,
    unread_count:number,
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { showNotification } = useNote();
    const { note, messNote } = useSettings()
    const API_URL = import.meta.env.VITE_API_URL
    const API_WS = import.meta.env.VITE_API_WS
    const [chatWith, setChatWith] = useState<chatWithType>({ username: "", nick: "", id: "", last_online:"" });
    const [messages, setMessages] = useState<message[]>([]);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [list, setList] = useState<Acc[]>([]);
    const [search, setSearch] = useState<string>("");
    const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
    const [isTyping, setIsTyping] = useState(false);
    const [typingStatus, setTypingStatus] = useState(false);
    const typingTimeout = useRef<number | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const chatWithRef = useRef<chatWithType>(chatWith);

    useEffect(() => {
        chatWithRef.current = chatWith;
    }, [chatWith]);

    const refetchChat = async (chatWithId: string) => {
        try {
            setChatLoading(true);
            const res = await axios.get(`${API_URL}chat/${chatWithId}`, { withCredentials: true });
            if (res.data.success) {
                setChatWith({ username: res.data.user.username, nick: res.data.user.nick, id: chatWithId, avatar_url: res.data.user.avatar_url, last_online: res.data.user.last_online });
                setMessages(res.data.messages);
            }
        } catch {
            showNotification("error", "Не удалось получить данные");
        } finally {
            setChatLoading(false);
        }
    };

    const sendMess = async (receiver_id: string, text: string, files: File[] = []) => {
        if (!text.trim() && files.length === 0) return;
        try {
            const formData = new FormData();
            formData.append("receiver_id", receiver_id);
            formData.append("text", text);
            files.forEach(file => formData.append("files", file));

            const res = await axios.post(`${API_URL}chat`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data.success) {
                refetchContacts();
            }
        } catch (error) {
            console.error("Ошибка при отправке:", error);
            showNotification("error", "Не удалось отправить сообщение");
        }
    };

    const refetchContacts = useCallback(async () => {
        if (user.nick === null) return;
        try {
            const res = await axios.post(`${API_URL}contacts`, { search }, { withCredentials: true });
            if (res.data.success) {
                setList(res.data.friendsArr);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error:any) {
            showNotification("error", error?.response?.data?.error);
        }
    }, [search, showNotification, user.nick]);

    useEffect(() => {
        if (!user?.id) return;
        wsRef.current = new WebSocket(`${API_WS}ws?userId=${user.id}`);
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_MESSAGE") {
                const currentChatId = chatWithRef.current.id;
                const messageSenderId = String(data.message.sender_id);

                // Если открыта переписка с этим пользователем — просто добавляем сообщение
                if (messageSenderId === currentChatId || messageSenderId === user.id) {
                    setMessages(prev => [...prev, data.message]);
                }

                // Обновляем список контактов
                refetchContacts();

                // Показываем уведомление, если вкладка не активна и сообщение не наше
                if (document.visibilityState === "hidden" && messageSenderId !== user.id && note && messNote) {
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
                        url: `/chat/${messageSenderId}`,
                    });
                }
            }
            if (data.type === "USER_STATUS") {
                setOnlineMap(prev => ({ ...prev, [data.userId]: data.isOnline }));
                if (chatWithRef.current.id === data.userId) {
                    setChatWith(prev => ({
                        ...prev,
                        last_online: data.isOnline ? "" : data.last_online || prev.last_online,
                    }));
                }
            }
            if (data.type === "MESSAGE_READ") {
                setMessages(prev =>
                    prev.map(m =>
                        m.id === data.messageId
                        ? { ...m, read_by: [...m.read_by, data.userId] }
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
                            // удаляем реакцию
                            return {
                                ...m,
                                reactions: reactions.filter(r => !(r.user_id === data.user_id && r.reaction === data.reaction))
                            };
                        } else {
                            // добавляем/обновляем реакцию
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
            if (data.type === "TYPING") {
                if (data.from === chatWithRef.current.id) {
                    setTypingStatus(true);
                }
            }
            if (data.type === "STOP_TYPING") {
                if (data.from === chatWithRef.current.id) {
                    setTypingStatus(false);
                }
            }
        };
        return () => wsRef.current?.close();
    }, [user.id, refetchContacts, API_WS]);

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

    const handleTyping = (contactId: string) => {
        if (!user?.id || !contactId) return;

        if (!isTyping) {
            wsRef.current?.send(JSON.stringify({
                type: "TYPING",
                to: contactId
            }));
            setIsTyping(true);
        }

        // Очистка предыдущего таймера
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        typingTimeout.current = window.setTimeout(() => {
            wsRef.current?.send(JSON.stringify({
                type: "STOP_TYPING",
                to: contactId
            }));
            setIsTyping(false);
            typingTimeout.current = null; // обязательно сбрасываем ref
        }, 2000); // 2 секунды бездействия
        };
        useEffect(() => {
        return () => {
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, []);
    return (
        <ChatContext.Provider value={{ chatWith, refetchChat, chatLoading, sendMess, messages, list, setSearch, search, refetchContacts, onlineMap, setReaction, handleTyping, typingStatus }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;