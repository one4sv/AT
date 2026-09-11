import { createContext, useRef, useState, type RefObject} from "react";
import { type ReactNode } from "react"
import { useNote } from "../hooks/NoteHook";
import { type habitCounter, type habitTimer } from "./TheHabitContext";
import { todayStrFunc } from "../ts/utils/dateToStr";
import { api } from "../ts/api";

const CalendarContext = createContext<CalendarContextType | null>(null);

export interface Calendar {
    habitId: string;
    habitName: string;
    date: string;
    comment?: string;
    isDone?: boolean;
    created_at?: Date;
    ongoing: boolean,   
    isPlanned?:boolean,
}

export interface CalendarContextType {
    calendar: Calendar[]
    setCalendar: React.Dispatch<React.SetStateAction<Calendar[]>>
    fetchCalendarHabit: (id: string) => void;
    fetchCalendarHabitWLoading: (id: string) => void;
    fetchCalendarUser: () => void;
    fetchCalendarWLoading: () => void;
    calendarLoading: boolean
    /**
     * YYYY-MM-DD
     */
    chosenDay: string;
    setChosenDay: React.Dispatch<React.SetStateAction<string>>
    calendarRef: RefObject<HTMLDivElement | null>
    selectedMonth: number;
    setSelectedMonth: React.Dispatch<React.SetStateAction<number>>    
    selectedYear: number;
    setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
    timers: habitTimer[] | null,
    counters: habitCounter[] | null
}

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const { showNotification } = useNote()
    const [ calendar, setCalendar ] = useState<Calendar[]>([])
    const [ timers, setTimers ] = useState<habitTimer[] | null>(null)
    const [ counters, setCounters ] = useState<habitCounter[] | null>(null)
    const [ calendarLoading, setCalendarLoading ] = useState(false)
    const [ chosenDay, setChosenDay ] = useState<string>(todayStrFunc())
    const [ selectedMonth, setSelectedMonth ] = useState<number>(0)
    const [ selectedYear, setSelectedYear ] = useState<number>(0)

    const calendarRef = useRef<HTMLDivElement | null>(null)

    const fetchCalendarHabit = async (id: string) => {
        if (!id) return;
        try {
            const res = await api.get(`calendar/${id}`)
            if (res.data.success) {
                setCalendar(res.data.calendar)

                const convertedTimers = (res.data.timers || []).map((timer:habitTimer) => ({
                    id: timer.id,
                    started_at: new Date(timer.started_at),
                    end_at: new Date(timer.end_at),
                    status: timer.status,
                    pauses: timer.pauses || [],
                    circles: timer.circles || []
                }))
                setCounters(res.data.counters)

                setTimers(convertedTimers)
            }
        } catch {
            showNotification("error", "Ошибка получения календаря")
        }
    }

    const fetchCalendarHabitWLoading = async (id: string) => {
        setCalendarLoading(true)
        await fetchCalendarHabit(id)
        setCalendarLoading(false)
    }

    const fetchCalendarUser = async () => {
        try {
            const res = await api.get(`calendar`)
            if (res.data.success) setCalendar(res.data.calendar)
        } catch {
            showNotification("error", "Ошибка получения общего календаря")
        }
    }

    const fetchCalendarWLoading = async () => {
        setCalendarLoading(true)
        await fetchCalendarUser()
        setCalendarLoading(false)
    }

    return (
        <CalendarContext.Provider value={{
            calendar, setCalendar, fetchCalendarHabit, fetchCalendarUser,
            calendarLoading, chosenDay, setChosenDay, calendarRef, selectedMonth, selectedYear,
            setSelectedMonth, setSelectedYear, fetchCalendarWLoading, fetchCalendarHabitWLoading,
            timers, counters
        }}>
            {children}
        </CalendarContext.Provider>
    )
}

export default CalendarContext;