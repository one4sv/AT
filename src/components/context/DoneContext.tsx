import axios from "axios";
import { createContext } from "react";
import { type ReactNode } from "react"
import { useHabits } from "../hooks/HabitsHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useParams } from "react-router";
const DoneContext = createContext<DoneContextType | null>(null);

export interface DoneContextType {
    sendDayComment:(id:string, text:string, date:string) => void;
    markDone:(id:number, date:string) => void;
}
export const DoneProvider = ({children} : {children : ReactNode}) => {
    const { habitId } = useParams<{habitId:string}>()
    const { refetchHabits } = useHabits()
    const { loadHabit } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const API_URL = import.meta.env.VITE_API_URL
    
    const markDone = async(id:number, date:string) => {
        try {
            const res = await axios.post(`${API_URL}markdone`, { habit_id: id, date:date }, { withCredentials:true})
            if (res.data.success) {
                refetchHabits()
                loadHabit(id.toString())
                if (habitId) fetchCalendarHabit(id.toString())
                else fetchCalendarUser()
            }
        } catch (err) {
            console.log("ошибка", err)
        }
    }

    const sendDayComment = async(id:string, text:string, date:string) => {
        try {
            const res = await axios.post(`${API_URL}daycomment`, { habit_id: id, text:text, date:date }, { withCredentials:true})
            if (res.data.success) {
                fetchCalendarHabit(id)
                loadHabit(id)
            }
        } catch (err) {
            console.log("ошибка", err)
        }
    } 
    return(
        <DoneContext.Provider value={{ sendDayComment, markDone}}>
            {children}
        </DoneContext.Provider>
    )
}

export default DoneContext