import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
import { api } from "../ts/api";
import { useNavigate, useParams } from "react-router-dom";
import { useNote } from "../hooks/NoteHook";
import type { Media } from "./ChatContext";
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

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    const { id } = useParams<{ id: string }>();

    const [ group, setGroup ] = useState<Group>({ id: "", name: "", desc: null, avatar_url: null, link: "", invite_expires_at: null });
    const [ media, setMedia ] = useState<Media[]>([]);
    const [ members, setMembers ] = useState<Member[]>([]);  
    const [ habits, setHabits ] = useState<Habit[]>([]);
    const [ groupLoading, setGroupLoading ] = useState<boolean>(true);
    const [ newAva, setNewAva ] = useState<File | undefined>(undefined);

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
        const handler = (e: CustomEvent) => {
            if (group.id && e.detail === id) {
                refetchGroup(group.id);
            }
        };

        window.addEventListener("groupUpdated", handler as EventListener);

        return () => {
        window.removeEventListener("groupUpdated", handler as EventListener);
        };
    }, [group.id, id, refetchGroup]);

    return (
        <GroupContext.Provider value={{ refetchGroup, group, habits, members, media, groupLoading, refetchGroupLoading, newAva, setNewAva }}>
        {children}
        </GroupContext.Provider>
    );
};

export default GroupContext

