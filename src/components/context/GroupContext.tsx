import { createContext, useCallback, useState, type ReactNode } from "react";
import type { Habit } from "./HabitsContext";
import { api } from "../ts/api";
import { useNavigate } from "react-router-dom";
import { useNote } from "../hooks/NoteHook";
import type { Media } from "./ChatContext";

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
}

export const GroupProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();
    const navigate = useNavigate();
    const [ group, setGroup ] = useState<Group>({ id: "", name: "", desc: null, avatar_url: null });
    const [ media, setMedia ] = useState<Media[]>([]);
    const [ members, setMembers ] = useState<Member[]>([]);  
    const [ habits, setHabits ] = useState<Habit[]>([]);
    const [ groupLoading, setGroupLoading ] = useState<boolean>(true);
    const [ newAva, setNewAva ] = useState<File | undefined>(undefined);

    const API_URL = import.meta.env.VITE_API_URL;

    const refetchGroup = useCallback(async (id: string) => {
        try {
            const res = await api.get(`${API_URL}group/${id}`);
            if (res.data.success) {
                setGroup(res.data.acc);
                setHabits(res.data.habits);
                setMembers(res.data.members);
                setMedia(res.data.media);
            } else {
                showNotification("error", "Не удалось найти группу");
                navigate("/");
            }
        } catch {
            showNotification("error", "Не удалось найти группу");
            navigate("/"); 
        } finally {
            setGroupLoading(false);
        }
    }, [API_URL, showNotification]);

    const refetchGroupLoading = useCallback(async (id: string) => {
        setGroupLoading(true);
        await refetchGroup(id);
    }, [refetchGroup]);

    return (
        <GroupContext.Provider value={{ refetchGroup, group, habits, members, media, groupLoading, refetchGroupLoading, newAva, setNewAva }}>
        {children}
        </GroupContext.Provider>
    );
};

export default GroupContext
