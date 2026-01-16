import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import axios from "axios";
import { api } from "../ts/api";
import { showBrowserNotification } from "../ts/utils/NoteRequest";
import { useSettings } from "../hooks/SettingsHook";
import { useNavigate } from "react-router";

const ChatContext = createContext<ChatContextType | null>(null);

export interface chatWithType {
    username?: string | null,
    nick: string,
    id: string,
    last_online: string,
    avatar_url?: string | null,
    note:boolean,
    is_blocked:boolean,
    pinned:boolean,
    am_i_blocked:boolean
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
    chatWith: chatWithType,
    refetchChat: (nick: string) => Promise<void>,
    sendMess: (receiver_nick: string, text: string, files?: File[], answer_id?: string) => Promise<void>,  // Изменено на receiver_nick
    chatLoading: boolean,
    messages: message[],
    list: Acc[],
    search: string,
    setSearch: React.Dispatch<React.SetStateAction<string>>,
    refetchContacts: () => Promise<void>,
    refetchContactsWTLoading: () => Promise<void>,
    onlineMap: Record<string, boolean>,
    setReaction: (mId: number, reaction: string) => Promise<void>,
    handleTyping: (nick: string) => void,
    typingStatus: boolean,
    loadingList: boolean,
    editMess:(messageId: number, text: string, newFiles: File[], keptUrls: string[], answer_id?: string)=>Promise<void>
}

export interface message {
    id: number,
    sender_id: string,
    content: string,
    created_at: Date,
    files?: Media[],
    read_by: string[],
    reactions: ReactionsType[],
    answer_id:number | null,
    edited:boolean
}

export interface Acc {
    id: string,
    username: string | null,
    nick: string,
    avatar_url?: string | null,
    lastMessage: message | null,
    unread_count: number,
    note:boolean,
    is_blocked:boolean,
    pinned:boolean
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { showNotification } = useNote();
    const { note, messNote } = useSettings();
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_API_URL;
    const API_WS = import.meta.env.VITE_API_WS;

    const [chatWith, setChatWith] = useState<chatWithType>({ username: "", nick: "", id: "", last_online: "", note:true, is_blocked:false, pinned:false, am_i_blocked:false });
    const [messages, setMessages] = useState<message[]>([]);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [list, setList] = useState<Acc[]>([]);
    const [loadingList, setLoadingList] = useState(true);
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

    const refetchChat = async (nick: string) => {
        try {
            setChatLoading(true);
            const res = await api.get(`${API_URL}chat/${nick}`, { withCredentials: true });
            if (res.data.success) {
                setChatWith({ username: res.data.user.username, nick: nick, id: res.data.user.id, avatar_url: res.data.user.avatar_url,
                    last_online: res.data.user.last_online, note:res.data.user.note, is_blocked:res.data.user.is_blocked, pinned:res.data.user.pinned, am_i_blocked:res.data.user.am_i_blocked });
                setMessages(res.data.messages);
            } else {
                showNotification("error", "Не удалось получить данные");
                if (window.history.length > 2) {
                    navigate(-1);
                } else {
                    navigate("/");
                }
            }
        } catch {
            showNotification("error", "Не удалось получить данные");
            if (window.history.length > 2) {
                navigate(-1);
            } else {
                navigate("/");
            }
        } finally { 
            setChatLoading(false);
        }
    };
    const sendMess = async (receiver_nick: string, text: string, files: File[] = [], answer_id?:string) => {
        if (!text.trim() && files.length === 0) return;
        try {
            const formData = new FormData();
            formData.append("receiver_nick", receiver_nick);
            formData.append("text", text);
            if (answer_id) formData.append("answer_id", answer_id)
            files.forEach(file => formData.append("files", file));
            const res = await axios.post(`${API_URL}chat`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                refetchContactsWTLoading();
            }
        } catch (error) {
            console.error("Ошибка при отправке:", error);
            showNotification("error", "Не удалось отправить сообщение");
        }
    };

    const editMess = async (messageId: number, text: string, newFiles: File[] = [], keptUrls: string[] = [], answer_id?: string) => {
        try {
            const formData = new FormData();
            formData.append("text", text);
            if (answer_id) formData.append("answer_id", answer_id);
            formData.append("kept_urls", JSON.stringify(keptUrls));
            newFiles.forEach(file => formData.append("files", file));
            const res = await axios.patch(`${API_URL}messages/${messageId}`, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                refetchContactsWTLoading();
            }
        } catch (error) {
            console.error("Ошибка при редактировании:", error);
            showNotification("error", "Не удалось отредактировать сообщение");
        }
    };

    const refetchContactsWTLoading = useCallback(async () => {
        if (user.nick === null) return;
        try {
            const res = await api.post(`${API_URL}contacts`, { search });
            if (res.data.success) {
                setList(res.data.friendsArr);
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
            if (data.type === "NEW_MESSAGE") {
                const messageSenderId = String(data.message.sender_id);
                if (messageSenderId === user.id || messageSenderId === chatWithRef.current.id) {
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
                        url: `/chat/${data.nick}`,  // Изменено на data.nick
                    });
                }
            }
            if (data.type === "USER_STATUS") {
                setOnlineMap(prev => ({ ...prev, [data.nick]: data.isOnline }));  // Изменено на [data.nick]
                if (chatWithRef.current.nick === data.nick) {  // Изменено на .nick
                    setChatWith(prev => ({
                        ...prev,
                        last_online: data.isOnline ? "" : data.last_online || prev.last_online,
                    }));
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
            if (data.type === "TYPING") {
                if (data.from === chatWithRef.current.nick) {
                    setTypingStatus(true);
                }
            }
            if (data.type === "STOP_TYPING") {
                if (data.from === chatWithRef.current.nick) {
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
        <ChatContext.Provider value={{ chatWith, refetchChat, chatLoading, sendMess, messages, list, setSearch, search,
            refetchContacts, onlineMap, setReaction, handleTyping, typingStatus, loadingList, refetchContactsWTLoading, editMess }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;