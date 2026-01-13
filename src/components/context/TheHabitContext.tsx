import { createContext, useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { type ReactNode } from "react"
import type { Habit } from "./HabitsContext";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { useCalendar } from "../hooks/CalendarHook";

const TheHabitContext = createContext<TheHabitContextType | null>(null);

export interface TheHabitContextType {
    loadHabit:(id:string | null) => void;
    findHabit:(id:string | null) => void;
    loadHabitWLoading:(id:string | null) => void;
    loadingHabit:boolean;
    habit:Habit | undefined;
    isReadOnly:boolean;
    isDone:boolean | null;
    todayDone:boolean;
    setIsDone:Dispatch<SetStateAction<boolean | null>>,
    dayComment:string | null,
    todayComment:string,
    setDayComment:Dispatch<SetStateAction<string | null>>
    doable:boolean;
    setDoable:Dispatch<SetStateAction<boolean>>;
}
export const TheHabitProvider = ({children} : {children : ReactNode}) => {
    const { showNotification } = useNote()
    const { fetchCalendarHabit } = useCalendar()
    const API_URL = import.meta.env.VITE_API_URL

    const [ loadingHabit, setLoadingHabit ] = useState(false)
    const [ habit, setHabit ] = useState<Habit>();
    const [ isReadOnly, setIsReadOnly ] = useState(false);
    const [ isDone, setIsDone ] = useState<boolean | null>(null);
    const [ todayDone, setTodayDone ] = useState(false);
    const [ doable, setDoable ] = useState(true);
    const [ dayComment, setDayComment ] = useState<string | null>(null)
    const [ todayComment, setTodayComment ] = useState<string>("")

    const findHabit = async(id:string | null) => {
        return api.get(`${API_URL}habits/${id}`);
    }

    const loadHabit = useCallback(async (id: string | null) => {
        try {
            const res = await findHabit(id)
            const { success, habit, isRead, isDone, comment } = res.data
            if (success) {
                fetchCalendarHabit(id!)
                setHabit(habit);
                setIsReadOnly(isRead);
                setTodayDone(isDone)
                setTodayComment(comment)
            }
        } catch {
            showNotification("error", "Не удалось получить привычку")
        }
    }, [showNotification]);

    const loadHabitWLoading = async(id:string | null) => {
        setLoadingHabit(true)
        await loadHabit(id)
        setLoadingHabit(false)
    }
    
    return(
        <TheHabitContext.Provider value={{loadHabit, loadingHabit, habit, isReadOnly,
        isDone, setIsDone, dayComment, todayComment, setDayComment, 
        findHabit, todayDone, setDoable, doable, loadHabitWLoading}}>
            {children}
        </TheHabitContext.Provider>
    )
}

export default TheHabitContext
