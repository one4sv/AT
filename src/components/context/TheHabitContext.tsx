import axios from "axios";
import { createContext, useCallback, useState } from "react";
import { type ReactNode } from "react"
import type { Habit } from "./HabitsContext";
import { useNote } from "../hooks/NoteHook";
const TheHabitContext = createContext<TheHabitContextType | null>(null);

export interface TheHabitContextType {
    loadHabit:(id:string | null) => void;
    loadingHabit:boolean;
    habit:Habit | undefined;
    isReadOnly:boolean;
    isDone:boolean;
}
export const TheHabitProvider = ({children} : {children : ReactNode}) => {
    const { showNotification } = useNote()
    const [ loadingHabit, setLoadingHabit ] = useState(false)
    const [habit, setHabit] = useState<Habit>();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const loadHabit = useCallback(async (id: string | null) => {
        setLoadingHabit(true);
        try {
            const res = await axios.get(`http://localhost:3001/habits/${id}`, { withCredentials: true });
            const { success, habit, isRead, isDone } = res.data
            if (success) {
                setHabit(habit);
                setIsReadOnly(isRead);
                setIsDone(isDone)
            }
        } catch {
            showNotification("error", "Не удалось получить привычку")
        } finally {
            setLoadingHabit(false)
        }
    }, [showNotification]);
    
    return(
        <TheHabitContext.Provider value={{loadHabit, loadingHabit, habit, isReadOnly, isDone}}>
            {children}
        </TheHabitContext.Provider>
    )
}

export default TheHabitContext