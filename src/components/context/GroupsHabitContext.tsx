import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import type { ElementType } from "react"
import { Plus } from "lucide-react";

export type GroupType = {
  value:string;
  label: string;
  icon: ElementType;
  color?:string;
};
interface GroupsResponse {
    success: boolean;
    groupsArr?: GroupType[];
    error?: string;
    cookie?: boolean;
}

export interface GroupsHabitContextType {
    refetchGroups: () => Promise<void>;
    groups:GroupType[];
    addGroup:(name:string, desc:string, selectedTag:string | null, selectedTheme:string | number | undefined) => Promise<void>
}

const GroupsHabitContext = createContext<GroupsHabitContextType | null>(null);

export const GroupsProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote();

    const startGroupsArr = {label:"Создать новую группу", value:"0", icon:Plus}

    const [ groups, setGroups ] = useState<GroupType[]>([startGroupsArr]);

    const refetchGroups = useCallback(async () => {
        try {
            const res = await axios.get<GroupsResponse>("http://localhost:3001/groups", {
                withCredentials: true,
            });

            if (res.data.success && res.data.groupsArr) {
                setGroups(res.data.groupsArr);
            } else {
                setGroups([startGroupsArr]);
            }
        } catch (err) {
            setGroups([startGroupsArr]);
            if (axios.isAxiosError(err)) {
                if (err.response?.status !== 401 && err.response?.status !== 403) {
                showNotification("error", err.response?.data?.error || "Ошибка запроса");
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addGroup = async(name: string, desc: string, selectedTag: string | null, selectedTheme: string | number | undefined) => {
        const payload = {name:name, desc:desc, selectedTag:selectedTag, selectedTheme:selectedTheme}
        try {
            const res = await axios.post("http://localhost:3001/addgroup", payload, { withCredentials:true})
            if (res.data.success) {
                refetchGroups()
            }
        } catch {
            console.log("Не удалось добавить группу");
        }
    }

    useEffect(() => {
        refetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <GroupsHabitContext.Provider value={{ groups, refetchGroups, addGroup }}>
            {children}
        </GroupsHabitContext.Provider>
    );
};

export default GroupsHabitContext;
