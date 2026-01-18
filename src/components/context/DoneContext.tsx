import axios from "axios";
import { createContext, useState } from "react";
import { type ReactNode } from "react"
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";

const DoneContext = createContext<DoneContextType | null>(null);

export interface DoneContextType {
    sendDayComment:(id:string, text:string, date:string) => void;
    markDone:(id:number, date:string) => void;
    waitDoneAnswer:boolean;
    waitComAnswer:boolean;
}
export const DoneProvider = ({children} : {children : ReactNode}) => {
    const { loadHabit } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()

    const [ waitDoneAnswer, setWaitDoneAnswer ] = useState(false);
    const [ waitComAnswer, setWaitComAnswer ] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL

    const markDone = async(id:number, date:string) => {
        setWaitDoneAnswer(true)
        try {
            const res = await axios.post(`${API_URL}markdone`, { habit_id: id, date:date }, { withCredentials:true})
            if (res.data.success) {
                loadHabit(id.toString())
                if (location.pathname.includes("/habit/")){
                    fetchCalendarHabit(id.toString())
                }
                else fetchCalendarUser()
            }
        } catch (err) {
            console.log("ошибка", err)
        } finally {
            setWaitDoneAnswer(false)
        }
    }

    const sendDayComment = async(id:string, text:string, date:string) => {
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
        <DoneContext.Provider value={{ sendDayComment, markDone, waitDoneAnswer, waitComAnswer  }}>
            {children}
        </DoneContext.Provider>
    )
}

export default DoneContext