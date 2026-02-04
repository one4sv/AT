import { useEffect, useState } from "react"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useHabitTimer } from "../../../../../components/hooks/utils/useHabitTimer"
import { calculateUntilTimer } from "../../../utils/calculateUntilNext"
import { SVGclock } from "../../../utils/SVGclock"
import { FlagPennant, Pause, Play, Square } from "@phosphor-icons/react"
import "../../../scss/Timer.scss"

export default function Timer () {
    const { habit, habitTimer, todayDone, showTimer } = useTheHabit()
    const { chosenDay } = useCalendar()
    const [ untilDisplay, setUntilDisplay ] = useState("00:00:00")
    const [ timerDisplay, setTimerDisplay  ] = useState("00:00:00")
    const { timerStart, timerPause, timerStop, timerCircle } = useHabitTimer(timerDisplay)

    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    const isHistorical = chosenDay && chosenDay !== todayStr

    const currentTimer = isHistorical ? showTimer : habitTimer

    const canControl = !isHistorical

    const isTimerActive = currentTimer !== null && canControl
    const isPaused = canControl && currentTimer?.status === "paused"
    const isEnded = isHistorical || (currentTimer ? currentTimer.status === "ended" || new Date(currentTimer.end_at).getTime() <= Date.now() : todayDone)

    useEffect(() => {
        if (!habit) return

        const update = () => {
            if (isHistorical) {
                setUntilDisplay("")
            } else {
                setUntilDisplay(calculateUntilTimer(habit, isEnded))
            }
        }

        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [habit, isHistorical, isEnded])

    useEffect(() => {
        if (!currentTimer) {
            setTimerDisplay("00:00:00")
            return
        }

        const update = () => {
            const now = Date.now()
            const started = currentTimer.started_at.getTime()

            let effectiveEnd: number

            if (currentTimer.status === "ended" || isHistorical) {
                effectiveEnd = currentTimer.end_at.getTime()
            } else if (currentTimer.status === "paused") {
                const openPause = currentTimer.pauses.find(p => p.end === null)
                effectiveEnd = openPause ? new Date(openPause.start).getTime() : now
            } else {
                effectiveEnd = now
            }

            const total = effectiveEnd - started

            let sumPauses = 0
            currentTimer.pauses.forEach(p => {
                if (p.end) {
                    sumPauses += new Date(p.end).getTime() - new Date(p.start).getTime()
                }
            })

            const elapsedMs = Math.max(0, total - sumPauses)

            const hours = Math.floor(elapsedMs / 3600000)
            const minutes = Math.floor((elapsedMs % 3600000) / 60000)
            const seconds = Math.floor((elapsedMs % 60000) / 1000)

            const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            setTimerDisplay(formatted)
        }

        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [currentTimer, isHistorical])

    if (!habit) return null

    const [hoursStr, minutesStr, secondsStr] = timerDisplay.split(':')
    const hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    const seconds = parseInt(secondsStr, 10)
    
    return (
        <div className="completeMain">
            <SVGclock hours={hours} minutes={minutes} seconds={seconds} />
            <div className="timerNums">
                <div className="untilNums">
                    {untilDisplay}
                </div>
                <div className="timerLeft">
                    {timerDisplay}
                </div>
            </div>
            {canControl && (
                <div className="timerButts">
                    {isTimerActive && !isEnded && (
                        <div className="launchButtWrapper">
                            <div className="launchButt" onClick={() => {
                                if (isPaused) timerStop()
                                else timerCircle()
                            }}>
                                {isPaused ? <Square weight="fill"/> : <FlagPennant weight="fill"/>}
                            </div>
                        </div>
                    )}
                    <div className="launchButtWrapper">
                        <div className={`launchButt ${isEnded ? "disabled" : ""}`} onClick={() => {
                            if (isEnded) return
                            if (!isTimerActive) timerStart()
                            else if (isPaused) timerStart()
                            else timerPause()
                        }}>
                            {isTimerActive && !isEnded
                                ? isPaused
                                    ? <Play weight="fill"/>
                                    : <Pause weight="fill"/>
                                : <Play weight="fill"/>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}