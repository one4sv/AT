import axios from "axios";
import { createContext } from "react";
import { type ReactNode } from "react"
import { useHabits } from "../hooks/HabitsHook";
import { useTheHabit } from "../hooks/TheHabitHook";
const DoneContext = createContext<DoneContextType | null>(null);

export interface DoneContextType {
    markDone:(id:number) => void
}
export const DoneProvider = ({children} : {children : ReactNode}) => {
    const { refetchHabits } = useHabits()
    const { loadHabit } = useTheHabit()

    const markDone = async(id:number) => {
        try {
            const res = await axios.post("http://localhost:3001/markdone", { habit_id: id }, { withCredentials:true})
            if (res.data.success) {
                refetchHabits()
                loadHabit(id.toString())
            }
        } catch (err) {
            console.log("ошибка", err)
        }
    } 
    return(
        <DoneContext.Provider value={{markDone}}>
            {children}
        </DoneContext.Provider>
    )
}

export default DoneContext