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
    refetchContacts:() => Promise<void>
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

    const [chatWith, setChatWith] = useState<chatWithType>({ username: "", nick: "", id: "" });
    const [messages, setMessages] = useState<message[]>([]);
    const [chatLoading, setChatLoading] = useState<boolean>(true);
    const [list, setList] = useState<Acc[]>([]);
    const [search, setSearch] = useState<string>("");

    const wsRef = useRef<WebSocket | null>(null);
    const chatWithRef = useRef<chatWithType>(chatWith);

    useEffect(() => {
        chatWithRef.current = chatWith;
    }, [chatWith]);

    const refetchChat = async (chatWithId: string) => {
        try {
            setChatLoading(true);
            const res = await axios.get(`http://localhost:3001/chat/${chatWithId}`, { withCredentials: true });
            if (res.data.success) {
                setChatWith({ username: res.data.user.username, nick: res.data.user.nick, id: chatWithId, avatar_url: res.data.user.avatar_url });
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
            // создаёт чат и сохраняет сообщение
            const res = await axios.post(
                "http://localhost:3001/chat",
                { receiver_id, text },
                { withCredentials: true }
            );

            if (res.data.success && res.data.message) {
                setMessages(prev => [...prev, res.data.message]);
            }

            // передаём сообщение через сокет другим пользователям
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
            const res = await axios.post("http://localhost:3001/contacts", { search }, { withCredentials: true });
            if (res.data.success) {
                setList(res.data.friendsArr);
            }
        } catch (error:any) {
            showNotification("error", error?.response?.data?.error);
        }
    }, [search, showNotification, user.nick]);

    useEffect(() => {
        if (!user?.id) return;

        wsRef.current = new WebSocket(`ws://localhost:3001/ws?userId=${user.id}`);


        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "NEW_MESSAGE") {
                const currentChatId = String(chatWithRef.current.id);
                const messageSenderId = data?.message?.sender_id ? String(data.message.sender_id) : "";
                const incomingChatId = String(data.chatId);

                if (messageSenderId && messageSenderId === currentChatId) {
                    setMessages(prev => [...prev, data.message]);
                } else if (incomingChatId === currentChatId) {
                    setMessages(prev => [...prev, data.message]);
                }
                refetchContacts();
            }
        };

        return () => {
            wsRef.current?.close();
        };
    }, [refetchContacts, user]);

    useEffect(() => {
        const timer = setTimeout(refetchContacts, 100);
        return () => clearTimeout(timer);
    }, [search, refetchContacts]);

    return (
        <ChatContext.Provider value={{ chatWith, refetchChat, chatLoading, sendMess, messages, list, setSearch, search, refetchContacts }}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;