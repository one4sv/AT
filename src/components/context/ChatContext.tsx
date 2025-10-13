import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { type ReactNode } from "react";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import axios from "axios";

const ChatContext = createContext<ChatContextType | null>(null);

export interface chatWithType {
    username?:string | null, 
    nick:string,
    id:string,
    last_online:string,
    avatar_url?: string | null,
}
export interface ChatContextType {
    chatWith:chatWithType,
    refetchChat:(chatWithId:string) => Promise<void>,
    sendMess:(receiver_id:string, text:string) => void,
    chatLoading:boolean,
    messages:message[],
    list:Acc[],
    search:string,
    setSearch:React.Dispatch<React.SetStateAction<string>>,
    refetchContacts:() => Promise<void>,
    onlineMap: Record<string, boolean>,
}
export interface message {
    id:number,
    sender_id:string,
    content:string,
    created_at:Date
}
export interface Acc {
    id:string,
    username:string | null,
    nick:string,
    avatar_url?: string | null,
    lastMessage:message | null,
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const { showNotification } = useNote();
    const API_URL = import.meta.env.VITE_API_URL
    const API_WS = import.meta.env.VITE_API_WS

    const [chatWith, setChatWith] = useState<chatWithType>({ username: "", nick: "", id: "", last_online:"" });
    const [messages, setMessages] = useState<message[]>([]);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [list, setList] = useState<Acc[]>([]);
    const [search, setSearch] = useState<string>("");
    const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

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

    const sendMess = async (receiver_id: string, text: string) => {
        if (!text.trim()) return;

        try {
            // Отправляем через WebSocket, сервер вставит в БД и рассылает всем
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: "SEND_MESSAGE",
                    receiver_id,
                    text
                }));
            }
        } catch (error) {
            console.error("Ошибка при отправке:", error);
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

                // если сообщение от текущего собеседника, добавляем в чат
                if (messageSenderId === currentChatId || messageSenderId === user.id) {
                    setMessages(prev => [...prev, data.message]);
                }

                // всегда обновляем список контактов
                refetchContacts();
            }
            if (data.type === "USER_STATUS") {
                // 🔹 обновляем онлайн-статус всех пользователей
                setOnlineMap(prev => ({ ...prev, [data.userId]: data.isOnline }));

                // 🔹 для открытого чата обновляем last_online
                if (chatWithRef.current.id === data.userId) {
                setChatWith(prev => ({
                    ...prev,
                    last_online: data.isOnline ? "" : data.last_online || prev.last_online,
                }));
                }
            }
        };

        return () => wsRef.current?.close();
    }, [user.id, refetchContacts]);

    useEffect(() => {
        const timer = setTimeout(refetchContacts, 100);
        return () => clearTimeout(timer);
    }, [search, refetchContacts]);
    // console.log(onlineMap)

    return (
        <ChatContext.Provider value={{ chatWith, refetchChat, chatLoading, sendMess, messages, list, setSearch, search, refetchContacts, onlineMap }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;