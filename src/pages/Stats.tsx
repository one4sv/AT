import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import axios from "axios";

import Calendar from "../components/ts/Calendar";
import RedHabit from "../components/ts/redHabit";
import type { Habit } from "../components/context/HabitsContext";

import "../scss/Stats.scss";
import Loader from "../components/ts/Loader";
import { useNote } from "../components/hooks/NoteHook";
import { useHabits } from "../components/hooks/HabitsHook";

export default function Stats() {
    const { showNotification } = useNote()
    const { habits } = useHabits()
    const { habitId } = useParams<{ habitId: string }>();

    const [habit, setHabit] = useState<Habit>();
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [ loadingHabit, setLoadingHabit ] = useState(false)

    const loadHabitFromServer = useCallback(async (id: string) => {
        try {
            setLoadingHabit(false)
            const res = await axios.get(`http://localhost:3001/habits/${id}`, { withCredentials: true });
            const { success, habit, isRead } = res.data
            if (success) {
                setHabit(habit);
                setIsReadOnly(isRead);
            }
        } catch (err) {
            showNotification("error", err)
        } finally {
            setLoadingHabit(true)
        }
    }, []);

    useEffect(() => {
        if (!habitId) return;
        const found = habits?.find(h => h.id === Number(habitId))
        if (found){
            setHabit(found)
            setLoadingHabit(true)
            setIsReadOnly(false);
        } else loadHabitFromServer(habitId)
    }, [habitId, habits, loadHabitFromServer]);

    if (habit && !loadingHabit) {
        return <Loader/>
    }

    return (
        <div className="statsDiv">
            {habit ? ( 
                <RedHabit habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
            ) : ("")}
            <Calendar />
        </div>
    );
}
