import { createContext, useEffect, useRef, useState, type RefObject} from "react";
import { type ReactNode } from "react"
import { useNote } from "../hooks/NoteHook";
import { type habitCounter, type habitTimer } from "./TheHabitContext";
import { todayStrFunc } from "../ts/utils/dateToStr";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
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
    allCalendar: Calendar[]
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
    const { timeZone } = useSettings()
    const { user, initialLoading } = useUser()
    const [ calendar, setCalendar ] = useState<Calendar[]>([])
    const [ allCalendar, setAllCalendar ] = useState<Calendar[]>([])
    const [ timers, setTimers ] = useState<habitTimer[] | null>(null)
    const [ counters, setCounters ] = useState<habitCounter[] | null>(null)
    const [ calendarLoading, setCalendarLoading ] = useState(false)
    const [ chosenDay, setChosenDay ] = useState<string>(todayStrFunc())
    const [ selectedMonth, setSelectedMonth ] = useState<number>(0)
    const [ selectedYear, setSelectedYear ] = useState<number>(0)

    const previousToday = useRef(todayStrFunc())
    useEffect(() => {
        const current = todayStrFunc();
        setChosenDay(value => value === previousToday.current ? current : value);
        previousToday.current = current;
    }, [timeZone]);

    // SideMenu needs every habit's completion history even if the current
    // /habit/:id page loads only that habit into the active calendar.
    useEffect(() => {
        if (initialLoading) return;
        if (!user.id) {
            setAllCalendar([]);
            return;
        }
        const controller = new AbortController();
        void api.get("calendar", { signal: controller.signal }).then(response => {
            if (!controller.signal.aborted && response.data?.success) {
                setAllCalendar(response.data.calendar || []);
            }
        }).catch(error => {
            if (!controller.signal.aborted) console.error("Не удалось загрузить общий календарь", error);
        });
        return () => controller.abort();
    }, [user.id, initialLoading]);

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
            if (res.data.success) {
                setCalendar(res.data.calendar)
                setAllCalendar(res.data.calendar)
            }
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
            calendar, allCalendar, setCalendar, fetchCalendarHabit, fetchCalendarUser,
            calendarLoading, chosenDay, setChosenDay, calendarRef, selectedMonth, selectedYear,
            setSelectedMonth, setSelectedYear, fetchCalendarWLoading, fetchCalendarHabitWLoading,
            timers, counters
        }}>
            {children}
        </CalendarContext.Provider>
    )
}

export default CalendarContext;