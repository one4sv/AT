import { FlagPennant, Pause, Play, Square } from "@phosphor-icons/react"
import "../../scss/Timer.scss"
import { SVGclock } from "../../utils/SVGclock"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import { useState, useEffect } from "react"
import DoneButton from "../Calendar/DoneButt"
import { calculateUntilTimer } from "../../utils/calculateUntilNext"
import { api } from "../../../../components/ts/api"

export default function Timer() {
    const { habit, habitTimer, loadTimer, loadHabit, todayDone } = useTheHabit()
    const [ untilDisplay, setUntilDisplay ] = useState("00:00:00")
    const [ timerDisplay, setTimerDisplay ] = useState("00:00:00")

    const API_URL = import.meta.env.VITE_API_URL
    const isTimer = habitTimer !== null
    const isPaused = habitTimer && habitTimer.status === "paused"
    const isEnded = habitTimer
        ? habitTimer.status === "ended" || new Date(habitTimer.end_at).getTime() <= Date.now()
        : todayDone;

    useEffect(() => {
        if (!habit) return
        const updateTimer = () => {
            setUntilDisplay(calculateUntilTimer(habit, isEnded))
        }
        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [habit])

useEffect(() => {
    if (!habit || !habitTimer) return;

    const updateTimer = () => {
        const now = new Date().getTime();
        const started = new Date(habitTimer.started_at).getTime();

        let effectiveEnd: number;

        if (habitTimer.status === "ended") {
            // Если таймер завершён — берём фиксированное время окончания
            effectiveEnd = new Date(habitTimer.end_at).getTime();
        } else if (isPaused) {
            // Если пауза — берём время начала открытой паузы
            const openPause = habitTimer.pauses.find(p => p.end === null);
            effectiveEnd = openPause ? new Date(openPause.start).getTime() : now;
        } else {
            // Иначе — текущее время
            effectiveEnd = now;
        }

        const total = effectiveEnd - started;

        let sumPauses = 0;
        for (const p of habitTimer.pauses) {
            if (p.end) {
                sumPauses += new Date(p.end).getTime() - new Date(p.start).getTime();
            }
        }

        const elapsedMs = total - sumPauses;

        let formatted = "00:00:00";
        if (elapsedMs > 0) {
            const hours = Math.floor(elapsedMs / 3600000);
            const minutes = Math.floor((elapsedMs % 3600000) / 60000);
            const seconds = Math.floor((elapsedMs % 60000) / 1000);
            formatted = `${hours.toString().padStart(2, '0')}:${minutes
                .toString()
                .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        setTimerDisplay(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
}, [habit, habitTimer, isPaused]);

    
    if (!habit) return null

    const timerStart = async() => {
        try {
            const res  = await api.post(`${API_URL}timer/start`, {habit_id:habit.id, time:new Date(), timer_id:isTimer ? habitTimer?.id : null })
            if (res.data.success) {
                console.log("таймер начат")
                loadTimer(habit.id)
            } else {
                console.log("не начат")
            }
        } catch (error) {
            console.log(error)
        }
    }
    const timerPause = async() => {
        try {
            const res  = await api.post(`${API_URL}timer/pause`, {habit_id:habit.id, time:new Date(), timer_id:isTimer ? habitTimer?.id : null })
            if (res.data.success) {
                console.log("таймер на паузе")
                loadTimer(habit.id)
            } else {
                console.log("не начат")
            }
        } catch (error) {
            console.log(error)
        }
    }    
    const timerStop = async() => {
        try {
            const res  = await api.post(`${API_URL}timer/stop`, {habit_id:habit.id, time:new Date(), timer_id:habitTimer?.id })
            if (res.data.success) {
                console.log("остановлен")
                loadTimer(habit.id)
                loadHabit(String(habit.id))
            } else {
                console.log("не начат")
            }
        } catch (error) {
            console.log(error)
        }
    }    
    const timerCurcle = async() => {
        try {
            const res  = await api.post(`${API_URL}timer/curcle`, {habit_id:habit.id, time:new Date(), timer_id:habitTimer?.id, timer:timerDisplay})
            if (res.data.success) {
                console.log("флаг")
                loadTimer(habit.id)
            } else {
                console.log("не начат")
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="timerDiv">
            <div className="timerMain">
                <SVGclock/>
                <div className="timerNums">
                    <div className="untilNums">
                        {untilDisplay}
                    </div>
                    <div className="timerLeft">
                        {timerDisplay}
                    </div>
                </div>
                <div className="timerButts">
                    {isTimer && !isEnded && (
                        <div className="launchButt" onClick={() => {
                            if (isPaused) timerStop()
                            else timerCurcle()
                        }}>
                            {isPaused ? <Square  weight="fill"/> : <FlagPennant weight="fill"/>}
                        </div>
                    )}
                    <div className={`launchButt ${isEnded ? "disabled" : ""}`} onClick={() => {
                        if (isEnded) return
                        if (!isTimer) timerStart()
                        else if (isPaused) timerStart()
                        else timerPause()
                    }}>
                        {isTimer && !isEnded
                            ? isPaused
                                ? <Play weight="fill"/>
                                : <Pause weight="fill"/>
                            : <Play weight="fill"/>
                        }
                    </div>
                </div>
            </div>
            <DoneButton habitId={habit.id}/>
        </div>
    )
}