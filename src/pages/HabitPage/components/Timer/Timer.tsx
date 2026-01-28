import { Play } from "@phosphor-icons/react"
import "../../scss/Timer.scss"
import { SVGclock } from "../../utils/SVGclock"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import { useState, useEffect } from "react"
import type { Habit } from "../../../../components/context/HabitsContext"

export default function Timer() {
    const { habit } = useTheHabit()
    const [timerDisplay, setTimerDisplay] = useState("00:00:00")

    const calculateTimeUntilNextStart = (habit:Habit) => {
        if (!habit || !habit.start_time) {
            return "00:00:00"
        }

        const now = new Date()
        const startParts = habit.start_time.split(':')
        if (startParts.length !== 2) return "00:00:00"
        const sHour = parseInt(startParts[0], 10)
        const sMin = parseInt(startParts[1], 10)
        if (isNaN(sHour) || isNaN(sMin)) return "00:00:00"

        const nextStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sHour, sMin, 0, 0)
        const isPast = nextStart <= now

        if (habit.done) {
            if (!isPast) {
                nextStart.setDate(nextStart.getDate() + 1)
            } else {
                nextStart.setDate(nextStart.getDate() + 1)
            }
        } else if (isPast) {
            nextStart.setDate(nextStart.getDate() + 1)
        }

        let target = nextStart

        if (habit.done && habit.end_time) {
            const endParts = habit.end_time.split(':')
            if (endParts.length === 2) {
                const eHour = parseInt(endParts[0], 10)
                const eMin = parseInt(endParts[1], 10)
                if (!isNaN(eHour) && !isNaN(eMin)) {
                    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eHour, eMin, 0, 0)
                    if (todayEnd > now) {
                        target = todayEnd
                    }
                }
            }
        }

        const diffMs = target.getTime() - now.getTime()
        if (diffMs <= 0) return "00:00:00"
        const diffSec = Math.floor(diffMs / 1000)
        const hours = Math.floor(diffSec / 3600)
        const mins = Math.floor((diffSec % 3600) / 60)
        const secs = diffSec % 60
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        if (!habit) return
        const updateTimer = () => {
            setTimerDisplay(calculateTimeUntilNextStart(habit))
        }
        updateTimer()
        const interval = setInterval(updateTimer, 1000) // Обновление каждую секунду
        return () => clearInterval(interval)
    }, [habit])

    return (
        <div className="timerDiv">
            <div className="timerMain">
                <SVGclock/>
                <div className="timerNums">
                    {timerDisplay}
                </div>
                <div className="curcles">
                    
                </div>
                <div className="launchButt">
                    <Play weight="fill"/>
                </div>
            </div>
        </div>
    )
}