import { createContext, useState, useEffect, useCallback} from "react";
import { type ReactNode } from "react";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";
import axios from "axios";

const ChatContext = createContext<ChatContextType | null>(null)
export interface chatWithType {
    username:string, 
    nick:string
}
export interface ChatContextType {
    chatWith:chatWithType,
    refetchChat:(chatWithId:string) => Promise<void>,
    sendMess:(receiver_id:string, text:string) => Promise<void>
    chatLoading:boolean,
    messages:message[],
    list:Acc[],
    search:string,
    setSearch:React.Dispatch<React.SetStateAction<string>>,
    refetchContacts:() => Promise<void>
}
export interface message {
    id:number,
    sender_id:number,
    content:string,
    created_at:Date
}
export interface Acc {
    id:number,
    username:string | null,
    nick:string,
    lastMessage:message | null,
}

export const ChatProvider = ({children}:{children : ReactNode}) => {
    const { user } = useUser()
    const { showNotification } = useNote()
    const [ chatWith, setChatWith ] = useState<chatWithType>({username:"", nick:"" })
    const [ messages, setMessages ] = useState<message[]>([])
    const [ chatLoading, setChatLoading ] = useState<boolean>(true)
    const [ list, setList ] = useState<Acc[]>([])
    const [ search, setSearch ] = useState<string>("")

    const refetchChat = async(chatWithId:string) => {
        try {
            setChatLoading(true)
            const res = await axios.get(`http://localhost:3001/chat/${chatWithId}`, {withCredentials:true})
            if (res.data.success) {
                setChatWith({username:res.data.user.username, nick:res.data.user.nick})
                setMessages(res.data.messages)
            }
        } catch {
            showNotification("error", "Не удалось получить данные")
        }
        finally {setChatLoading(false)}
    }

    const sendMess = async(receiver_id:string, text:string) => {
        if (text !== "" && receiver_id) {
            try {
                const res = await axios.post("http://localhost:3001/chat", { receiver_id:receiver_id, text:text }, { withCredentials:true })
                if (res.data.success) {
                    console.log("Send:", text)
                    setMessages(prev => [...prev, res.data.message])
                }
            } catch {
                showNotification("error", "Не удалось отправить")
            }
        }
    }
    const refetchContacts = useCallback(async() => {
        if (!user) return
        try {
            const res = await axios.post("http://localhost:3001/contacts", { search }, {withCredentials:true})
            if (res.data.success) {
                setList(res.data.friendsArr)
            }
        }
        catch {
            showNotification("error", "Ошибка сервера")
        }
    }, [search, user])

    useEffect(() => {
        const timer = setTimeout(() => {
            refetchContacts();
        }, 100);
        return () => clearTimeout(timer);
    }, [search, refetchContacts]);
    
    return (
        <ChatContext.Provider value={{chatWith, refetchChat, chatLoading, sendMess, messages, list, setSearch, search, refetchContacts}}>
            {children}
        </ChatContext.Provider>
    )
}

export default ChatContext;