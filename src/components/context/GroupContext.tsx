import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
import { api } from "../ts/api";
import { useNavigate } from "react-router-dom";
import { useNote } from "../hooks/NoteHook";
import type { Media } from "./ChatContext";
import axios from "axios";
import { useChat } from "../hooks/ChatHook";

const GroupContext = createContext<GroupContextType | null>(null);

export interface GroupContextType {
    refetchGroup:(id:string) => Promise<void>,
    refetchGroupWLoading:(id:string) => Promise<void>,
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
    const { onlineMap } = useChat()
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [ group, setGroup ] = useState<Group>({ id: "", name: "", desc: null, avatar_url: null, link: "", invite_expires_at: null });
    const [ media, setMedia ] = useState<Media[]>([]);
    const [ members, setMembers ] = useState<Member[]>([]);  
    const [ habits, setHabits ] = useState<Habit[]>([]);
    const [ groupLoading, setGroupLoading ] = useState<boolean>(false);
    const [ newAva, setNewAva ] = useState<File | undefined>(undefined);

    const refetchGroup = useCallback(async (id: string) => {
        try {
            const res = await api.get(`${API_URL}group/${id}`);
            if (res.data.success) {
                setGroup(res.data.group);
                setHabits(res.data.habits);
                const sortedMembers = res.data.members.slice().sort((a: Member, b: Member) => {
                    const onlineA = onlineMap[a.id] || false;
                    const onlineB = onlineMap[b.id] || false;

                    if (onlineA !== onlineB) {
                        return onlineA ? -1 : 1; // онлайн впереди (true < false)
                    }

                    const timeA = a.last_online ? new Date(a.last_online).getTime() : 0;
                    const timeB = b.last_online ? new Date(b.last_online).getTime() : 0;

                    return timeB - timeA; // по убыванию времени
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

    const refetchGroupWLoading = useCallback(async (id: string) => {
        setGroupLoading(true);
        await refetchGroup(id);
    }, [refetchGroup]);

    console.log()
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            console.log(e.detail, typeof e.detail)
            console.log(group.id, typeof group.id)
            if (group.id && String(e.detail) === String(group.id)) {
                refetchGroup(group.id);
            }
        };

        window.addEventListener("groupUpdated", handler as EventListener);

        return () => {
        window.removeEventListener("groupUpdated", handler as EventListener);
        };
    }, [group.id, refetchGroup]);

    return (
        <GroupContext.Provider value={{ refetchGroup, group, habits, members, media, groupLoading, refetchGroupWLoading, newAva, setNewAva }}>
        {children}
        </GroupContext.Provider>
    );
};

export default GroupContext

