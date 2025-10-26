import { createContext, useRef, useState, type RefObject} from "react";
import { type ReactNode } from "react"
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
const CalendarContext = createContext<CalendarContextType | null>(null);

export interface Calendar {
    habitId:string;
    habitName:string;
    date:string;
    comment?:string;
    isDone?:boolean;
    created_at?:Date;
}
export interface CalendarContextType {
    calendar:Calendar[]
    setCalendar: React.Dispatch<React.SetStateAction<Calendar[]>>
    fetchCalendarHabit:(id:string)=>void;
    fetchCalendarUser:()=>void;
    calendarLoading:boolean
    chosenDay:string;
    setChosenDay: React.Dispatch<React.SetStateAction<string>>
    calendarRef:RefObject<HTMLDivElement | null>
    selectedMonth:number;
    setSelectedMonth:React.Dispatch<React.SetStateAction<number>>    
    selectedYear:number;
    setSelectedYear:React.Dispatch<React.SetStateAction<number>>
}
export const CalendarProvider = ({children} : {children : ReactNode}) => {
    const { showNotification } = useNote()
    const [ calendar, setCalendar ] = useState<Calendar[]>([])
    const [ calendarLoading, setCalendarLoading ] = useState(false)
    const [ chosenDay, setChosenDay ] = useState<string>("")
    const [ selectedMonth, setSelectedMonth ] = useState<number>(0)
    const [ selectedYear, setSelectedYear ] = useState<number>(0)
    const API_URL = import.meta.env.VITE_API_URL

    const calendarRef = useRef<HTMLDivElement | null>(null)

    const fetchCalendarHabit = async(id:string) => {
        if (!id) return;
        setCalendarLoading(true)
        try {
            const res = await axios.get(`${API_URL}calendar/${id}`, {withCredentials: true})
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
            const res = await axios.get(`${API_URL}calendar`, {withCredentials: true})
            if (res.data.success) setCalendar(res.data.calendar)
        } catch {
            showNotification("error", "Ошибка получения общего календаря")
        } finally {
            setCalendarLoading(false)
        }
    }
    return(
        <CalendarContext.Provider value={{calendar, setCalendar, fetchCalendarHabit, fetchCalendarUser, calendarLoading, chosenDay, setChosenDay, calendarRef, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear }}>
            {children}
        </CalendarContext.Provider>
    )
}

export default CalendarContext;