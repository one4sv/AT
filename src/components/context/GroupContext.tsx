import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
import { api } from "../ts/api";
import { useNavigate } from "react-router-dom";
import { useNote } from "../hooks/NoteHook";
import type { Media } from "./ChatContext";
import { useUser } from "../hooks/UserHook";
import { useChat } from "../hooks/ChatHook";
import axios from "axios";

const GroupContext = createContext<GroupContextType | null>(null);

export interface GroupContextType {
    refetchGroup:(id:string) => Promise<void>,
    refetchGroupLoading?:(id:string) => Promise<void>,
    group:Group,
    habits:Habit[],
    members:Member[],
    media:Media[],
    groupLoading:boolean,
    newAva:File | undefined,
    setNewAva:React.Dispatch<React.SetStateAction<File | undefined>>,
} 
export interface Member {
    id: string,
    name: string | null,
    nick: string,
    avatar_url: string | null,
    role: string |  null,
    last_online: string | null,
}
export interface Group {
    id: string,
    name: string,
    desc:  string | null,
    avatar_url: string | null,
    link: string | null,
    invite_expires_at: string | null,
}

export const GroupProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();
    const { user } = useUser();
    const { refetchGroupChatWLoading, chatWith } = useChat();
    const navigate = useNavigate();
    const [ group, setGroup ] = useState<Group>({ id: "", name: "", desc: null, avatar_url: null, link: "", invite_expires_at: null });
    const [ media, setMedia ] = useState<Media[]>([]);
    const [ members, setMembers ] = useState<Member[]>([]);  
    const [ habits, setHabits ] = useState<Habit[]>([]);
    const [ groupLoading, setGroupLoading ] = useState<boolean>(true);
    const [ newAva, setNewAva ] = useState<File | undefined>(undefined);
    const API_WS = import.meta.env.VITE_API_WS;
    const API_URL = import.meta.env.VITE_API_URL;
    
    const wsRef = useRef<WebSocket | null>(null);


    const refetchGroup = useCallback(async (id: string) => {
        try {
            const res = await api.get(`${API_URL}group/${id}`);
            if (res.data.success) {
                setGroup(res.data.group);
                setHabits(res.data.habits);
                const sortedMembers = res.data.members.slice().sort((a:Member, b:Member) => {
                    const timeA = a.last_online ? new Date(a.last_online).getTime() : 0;
                    const timeB = b.last_online ? new Date(b.last_online).getTime() : 0;

                    return timeB - timeA;
                });
                setMembers(sortedMembers);
                setMedia(res.data.media);
            } else {
                console.log(res);
                showNotification("error", res.data.message || "Не удалось найти группу");
                navigate("/");
            }
        } catch (error){
            if (axios.isAxiosError(error)) {
                showNotification("error", error.response?.data?.error || "Не удалось получить данные группы");
            }
            navigate("/"); 
        } finally {
            setGroupLoading(false);
        }
    }, [API_URL, showNotification]);

    const refetchGroupLoading = useCallback(async (id: string) => {
        setGroupLoading(true);
        await refetchGroup(id);
    }, [refetchGroup]);

    useEffect(() => {
        if (!user?.id) return;
        wsRef.current = new WebSocket(`${API_WS}ws?userId=${user.id}`);
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
                if (location.pathname.startsWith("/chat/g") && chatWith && data.group_id === chatWith.id && chatWith?.is_group) {
                    refetchGroupChatWLoading(data.group_id);
                } else if (location.pathname.startsWith("/room/") && data.group_id === group.id) {
                    refetchGroup(group.id);
            }
        }
    }, [API_WS, user?.id, chatWith, refetchGroupChatWLoading, group.id, refetchGroup]);

    return (
        <GroupContext.Provider value={{ refetchGroup, group, habits, members, media, groupLoading, refetchGroupLoading, newAva, setNewAva }}>
        {children}
        </GroupContext.Provider>
    );
};

export default GroupContext
