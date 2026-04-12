import axios from "axios";
import { createContext, useEffect, useMemo, useState } from "react";
import { type ReactNode } from "react"
import { useTheHabit } from "../hooks/TheHabitHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useHabits } from "../hooks/HabitsHook";
import { api } from "../ts/api";
import { dateToCalendarFormat } from "../../pages/HabitPage/utils/dateToStr";
import { getDayArrays } from "../ts/utils/getDayArrs";
import { useParams } from "react-router-dom";

const DoneContext = createContext<DoneContextType | null>(null);

export interface DoneContextType {
    sendDayComment:(id:string, text:string | null, date:string) => void;
    markDone:(id:number, date:string) => void;
    markDoneWLoading:(id:number, date:string) => void;
    waitDoneAnswer:boolean;
    waitComAnswer:boolean;
}
export const DoneProvider = ({children} : {children : ReactNode}) => {
    const { loadHabit, setIsDone, isDone, habit, habitTimer, setDayComment, setShowCounter, setShowTimer, setDoable } = useTheHabit()
    const { fetchCalendarHabit, fetchCalendarUser, chosenDay, calendar, timers, counters } = useCalendar()
    const { refetchHabits, habits } = useHabits()
    const [ waitDoneAnswer, setWaitDoneAnswer ] = useState(false);
    const [ waitComAnswer, setWaitComAnswer ] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL
    const { habitId:id } = useParams<{ habitId: string }>();

    const markDone = async(id:number, date:string) => {
        try {
            const res = await api.post(`${API_URL}markdone`, { habit_id: id, date:date })
            if (res.data.success) {
                if (habit && habit.id === id){
                    loadHabit(id.toString())
                    fetchCalendarHabit(id.toString())
                    setIsDone(!isDone)
                }
                if (!habit || habit.id === id) fetchCalendarUser()
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


    const { completedArr, skippedArr, willArr, nowArr } = useMemo(
        () => getDayArrays(chosenDay, calendar, habits, id, habit),
        [chosenDay, calendar, habits, habit, id]
    )

    const comment = useMemo(() => {
        const found = calendar.find(c => c.date === chosenDay);
        return found ? found.comment : "";
    }, [calendar, chosenDay]);

    console.log(counters)
    
    useEffect(() => {
        if (chosenDay === "") {
            setDoable(true)
            return
        }
        else if (habit && new Date(chosenDay) < new Date(habit?.start_date)) {
            setIsDone(false)
            setDoable(false)
            return
        }
        if (completedArr.length > 0) {
            setIsDone(true)
            setDoable(true)
        } else if (skippedArr.length > 0) {
            setIsDone(false)
            setDoable(true)
        } else if (nowArr.length > 0) {
            setIsDone(false)
            setDoable(true)
        }
        else if (willArr) {
            setIsDone(false)
            setDoable(false)
        }
        setDayComment(comment || "")
        const needTimer = timers?.find(t => dateToCalendarFormat(t.started_at) === chosenDay) || null
        setShowTimer(needTimer)
        setShowCounter(counters?.find(t => dateToCalendarFormat(new Date(t.started_at)) === chosenDay) || null)
    }, [chosenDay])

    return(
        <DoneContext.Provider value={{ sendDayComment, markDone, waitDoneAnswer, waitComAnswer, markDoneWLoading }}>
            {children}
        </DoneContext.Provider>
    )
}

export default DoneContext