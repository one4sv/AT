import { createContext, useCallback, useState } from "react";
import { type ReactNode } from "react"
import type { Habit } from "./HabitsContext";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
const TheHabitContext = createContext<TheHabitContextType | null>(null);

export interface TheHabitContextType {
    loadHabit:(id:string | null) => void;
    findHabit:(id:string | null) => void
    loadingHabit:boolean;
    habit:Habit | undefined;
    isReadOnly:boolean;
    isDone:boolean;
    dayComment:string
}
export const TheHabitProvider = ({children} : {children : ReactNode}) => {
    const { showNotification } = useNote()
    const API_URL = import.meta.env.VITE_API_URL

    const [ loadingHabit, setLoadingHabit ] = useState(false)
    const [ habit, setHabit ] = useState<Habit>();
    const [ isReadOnly, setIsReadOnly ] = useState(false);
    const [ isDone, setIsDone ] = useState(false);
    const [ dayComment, setDayComment ] = useState<string>("")

    const findHabit = async(id:string | null) => {
        return api.get(`${API_URL}habits/${id}`);
    }

    const loadHabit = useCallback(async (id: string | null) => {
        setLoadingHabit(true);
        try {
            const res = await findHabit(id)
            const { success, habit, isRead, isDone, comment } = res.data
            if (success) {
                setHabit(habit);
                setIsReadOnly(isRead);
                setIsDone(isDone)
                setDayComment(comment)
            }
        } catch {
            showNotification("error", "Не удалось получить привычку")
        } finally {
            setLoadingHabit(false)
        }
    }, [showNotification]);
    
    return(
        <TheHabitContext.Provider value={{loadHabit, loadingHabit, habit, isReadOnly, isDone, dayComment, findHabit}}>
            {children}
        </TheHabitContext.Provider>
    )
}

export default TheHabitContext