import { Send } from "lucide-react"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useEffect, useMemo, useReducer, useState } from "react"
import { api } from "../../../../../components/ts/api"
import type { habitTimer } from "../../../../../components/context/TheHabitContext"

interface Event {
    type: "start" | "pause" | "circle" | "end"
    time: string
    start?: string
    end?: string | null
    text?: string
}

const timeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(":").map(Number)
    return h * 3600 + m * 60 + s
}

const formatElapsed = (ms: number): string => {
    ms = Math.max(0, ms)
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

const formatDuration = (ms: number): string => {
    return formatElapsed(ms)
}

const formatTime = (iso: string): string => {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

const placeholders = [
    "Что произошло?", "Что случилось?", "Что сделали?", "Ну как оно там?", "Что получилось?", "Как успехи?",
    "Расскажи, что было?", "Что нового?", "Что интересного?", "Что дальше?", "Какое впечатление?", "Что изменилось?"
]

export default function CompletionProgress({currentTimer, isHistorical}:{currentTimer:habitTimer | null, isHistorical:boolean}) {
    const { habit, loadTimer } = useTheHabit()
    const API_URL = import.meta.env.VITE_API_URL

    const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    const [placeholderMap, setPlaceholderMap] = useState<Record<string, string>>({})
    const hasOpenPause = currentTimer?.pauses.some(p => p.end === null)


    useEffect(() => {
        if (!hasOpenPause) return
        const interval = setInterval(forceUpdate, 1000)
        return () => clearInterval(interval)
    }, [hasOpenPause])

    const events: Event[] = useMemo(() => {
        if (!currentTimer) return []

        const list: Event[] = []

        list.push({
            type: "start",
            time: "00:00:00",
            start: currentTimer.started_at.toISOString()
        })

        let cumulativePauseMs = 0
        currentTimer.pauses.forEach(p => {
            let pauseTime: string
            if (p.time) {
                pauseTime = p.time
            } else {
                const pauseStartMs = new Date(p.start).getTime()
                const startedMs = currentTimer.started_at.getTime()
                const elapsedMs = pauseStartMs - startedMs - cumulativePauseMs
                pauseTime = formatElapsed(elapsedMs)
            }

            list.push({
                type: "pause",
                time: pauseTime,
                start: p.start,
                end: p.end
            })

            if (p.end) {
                cumulativePauseMs += new Date(p.end).getTime() - new Date(p.start).getTime()
            }
        })

        currentTimer.circles.forEach(c => {
            list.push({
                type: "circle",
                time: c.time,
                text: c.text || ""
            })
        })

        if (currentTimer.status === "ended" || isHistorical) {
            const startedMs = currentTimer.started_at.getTime()
            const effectiveEndMs = currentTimer.end_at.getTime()

            const totalPausedMs = currentTimer.pauses.reduce((sum, p) => {
                if (p.end) return sum + (new Date(p.end).getTime() - new Date(p.start).getTime())
                return sum
            }, 0)

            const elapsedMs = effectiveEndMs - startedMs - totalPausedMs
            const finalTime = formatElapsed(elapsedMs)

            list.push({
                type: "end",
                time: finalTime,
                end: currentTimer.end_at.toISOString()
            })
        }

        return list.sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time))
    }, [currentTimer, isHistorical])

    useEffect(() => {
        setPlaceholderMap(prev => {
            const newMap = { ...prev }
            events.forEach(event => {
                if (event.type === "circle" && !(event.time in newMap)) {
                    newMap[event.time] = placeholders[Math.floor(Math.random() * placeholders.length)]
                }
            })
            return newMap
        })
    }, [events])

    const handleSend = async (circleTime: string, newText: string) => {
        if (!habit || !currentTimer || isHistorical || !newText.trim()) return

        try {
            await api.post(`${API_URL}timer/circle/text`, {
                habit_id: habit.id,
                timer_id: currentTimer.id,
                time: circleTime,
                text: newText.trim()
            })
            loadTimer(habit.id)
            const timeout = setTimeout(() => {
                setEditedTexts(prev => {
                    const updated = { ...prev }
                    delete updated[circleTime]
                    return updated
                })
            }, 100)
            return clearTimeout(timeout)
        } catch (err) {
            console.error("Ошибка сохранения текста круга:", err)
        }
    }

    if (!currentTimer) {
        return (
            <div className="completionProgress">
                <div className="eventStr emptyEvents">Сессия не начата</div>
            </div>
        )
    }

    if (events.length === 0) {
        return null
    }

    return (
        <div className="completionProgress">
            {events.map((event, index) => {
                const key = `${event.type}-${event.time}-${index}`

                if (event.type === "start") {
                    return (
                        <div key={key} className="eventStr startStr">
                            <span className="eventTime">{event.time}</span>: начало сессии в {formatTime(event.start!)}
                        </div>
                    )
                }

                if (event.type === "pause") {
                    const startTime = formatTime(event.start!)
                    const isOpen = !event.end
                    const endTime = isOpen ? "сейчас" : formatTime(event.end!)
                    const durationMs = isOpen
                        ? Date.now() - new Date(event.start!).getTime()
                        : new Date(event.end!).getTime() - new Date(event.start!).getTime()
                    const duration = formatDuration(durationMs)

                    return (
                        <div key={key} className="eventStr pauseStr">
                            <span className="eventTime">{event.time}</span>: пауза с {startTime} до {endTime} (длительность {duration})
                        </div>
                    )
                }

                if (event.type === "circle") {
                    const currentValue = editedTexts[event.time] ?? event.text ?? ""
                    const hasChanged = currentValue.trim() !== (event.text ?? "").trim()
                    const canEdit = !isHistorical

                    return (
                        <div key={key} className="eventStr circleStr">
                            <div className="circleInfo">
                                <span className="eventTime">{event.time}</span>: круг завершён
                            </div>

                            {event.text && !canEdit && (
                                <div className="circleText savedText">{event.text}</div>
                            )}

                            {canEdit && (
                                <div className="circleEditWrapper">
                                    <input
                                        type="text"
                                        className="circleInp"
                                        placeholder={currentValue ? "" : placeholderMap[event.time]}
                                        maxLength={200}
                                        value={currentValue}
                                        onChange={(e) => setEditedTexts(prev => ({
                                            ...prev,
                                            [event.time]: e.target.value
                                        }))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && hasChanged && currentValue.trim()) {
                                                handleSend(event.time, currentValue)
                                            }
                                        }}
                                    />
                                    {hasChanged && currentValue.trim() && (
                                        <div
                                            className="sendCircle"
                                            onClick={() => handleSend(event.time, currentValue)}
                                        >
                                            <Send fill="currentColor"/>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }

                if (event.type === "end") {
                    return (
                        <div key={key} className="eventStr endStr">
                            <span className="eventTime">{event.time}</span>: сессия завершена в {formatTime(event.end!)}
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}