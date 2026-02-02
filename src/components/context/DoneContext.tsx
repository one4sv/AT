import axios from "axios";
import { createContext, useState } from "react";
import { type ReactNode } from "react"
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useHabits } from "../hooks/HabitsHook";
import { api } from "../ts/api";

const DoneContext = createContext<DoneContextType | null>(null);

export interface DoneContextType {
    sendDayComment:(id:string, text:string | null, date:string) => void;
    markDone:(id:number, date:string) => void;
    markDoneWLoading:(id:number, date:string) => void;
    waitDoneAnswer:boolean;
    waitComAnswer:boolean;
}
export const DoneProvider = ({children} : {children : ReactNode}) => {
    const { loadHabit, setIsDone, isDone, habit, habitTimer } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { refetchHabits } = useHabits()
    const [ waitDoneAnswer, setWaitDoneAnswer ] = useState(false);
    const [ waitComAnswer, setWaitComAnswer ] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL

    const markDone = async(id:number, date:string) => {
        try {
            const res = await api.post(`${API_URL}markdone`, { habit_id: id, date:date })
            if (res.data.success) {
                if (habit && habit.id === id){
                    loadHabit(id.toString())
                    fetchCalendarHabit(id.toString())
                    setIsDone(!isDone)
                }
                if (!id) fetchCalendarUser()
            }
            if (habitTimer && habitTimer.status !== "ended") api.post(`${API_URL}timer/stop`, {habit_id:id, time:new Date(), timer_id:habitTimer?.id })
        } catch (err) {
            console.log("ошибка", err)
        } finally {
            refetchHabits()
            setWaitDoneAnswer(false)
        }
    }
    const markDoneWLoading = async(id:number, date:string) => {
        setWaitDoneAnswer(true)
        await markDone(id, date)
    }

    const sendDayComment = async(id:string, text:string | null, date:string) => {
        setWaitComAnswer(true)
        try {
            const res = await axios.post(`${API_URL}daycomment`, { habit_id: id, text:text, date:date }, { withCredentials:true})
            if (res.data.success) {
                fetchCalendarHabit(id)
                loadHabit(id)
            }
        } catch (err) {
            console.log("ошибка", err)
        } finally {
            setWaitComAnswer(false)
        }
    } 
    return(
        <DoneContext.Provider value={{ sendDayComment, markDone, waitDoneAnswer, waitComAnswer, markDoneWLoading }}>
            {children}
        </DoneContext.Provider>
    )
}

export default DoneContext