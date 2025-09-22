import { createContext, useState } from "react";
import { type ReactNode } from "react"
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
const CalendarContext = createContext<CalendarContextType | null>(null);

export interface Calendar {
    habitId:string;
    habitName:string;
    date:string;
}
export interface CalendarContextType {
    calendar:Calendar[]
    setCalendar: React.Dispatch<React.SetStateAction<Calendar[]>>
    fetchCalendarHabit:(id:string)=>void;
    fetchCalendarUser:()=>void;
    calendarLoading:boolean
}
export const CalendarProvider = ({children} : {children : ReactNode}) => {
    const { showNotification } = useNote()
    const [ calendar, setCalendar ] = useState<Calendar[]>([])
    const [ calendarLoading, setCalendarLoading ] = useState(false)

    const fetchCalendarHabit = async(id:string) => {
        if (!id) return;
        setCalendarLoading(true)
        try {
            const res = await axios.get(`http://localhost:3001/calendar/${id}`, {withCredentials: true})
            if (res.data.success) setCalendar(res.data.calendar)
        } catch {
            showNotification("error", "Ошибка получения календаря")
        } finally {
            setCalendarLoading(false)
        }
    }
    const fetchCalendarUser = async() => {
        setCalendarLoading(true)
        try {
            const res = await axios.get("http://localhost:3001/calendar", {withCredentials: true})
            if (res.data.success) setCalendar(res.data.calendar)
        } catch {
            showNotification("error", "Ошибка получения общего календаря")
        } finally {
            setCalendarLoading(false)
        }
    }
    return(
        <CalendarContext.Provider value={{calendar, setCalendar, fetchCalendarHabit, fetchCalendarUser, calendarLoading }}>
            {children}
        </CalendarContext.Provider>
    )
}

export default CalendarContext;