import { Send } from "lucide-react"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useEffect, useMemo, useState } from "react"
import { api } from "../../../../../components/ts/api"
import { placeholders } from "../../../utils/placeholders"
import { useWebSocket } from "../../../../../components/hooks/WebSocketHook"
import { todayStrFunc } from "../../../utils/dateToStr"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"

interface Event {
    type: "start" | "pause" | "circle" | "end"
    time: string
    originalTime?: string
    start?: string
    end?: string | null
    text?: string
}

const timeToSeconds = (time: string): number => {
    const [h, m, s] = time.split(":").map(Number)
    return h * 3600 + m * 60 + s
}

const formatTime = (iso: string): string => {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function CompletionProgress() {
    const { habit, loadTimer, setHabitTimer, parseTimer, showTimer, habitTimer } = useTheHabit()
    const { chosenDay } = useCalendar()
    const { ws } = useWebSocket()
    const API_URL = import.meta.env.VITE_API_URL

    const [ editedTexts, setEditedTexts ] = useState<Record<string, string>>({})
    const [ placeholderMap, setPlaceholderMap ] = useState<Record<string, string>>({})
    const [ editingKeys, setEditingKeys ] = useState<string[]>([])
    
    const todayStr = todayStrFunc()
    const isHistorical = chosenDay && chosenDay !== todayStr || false
    const currentTimer = isHistorical ? showTimer : habitTimer
    // const hasOpenPause = currentTimer?.pauses.some(p => p.end === null)

    useEffect(() => {
        if (!ws || !habit?.id) return

        const handleTimerEvents = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data)

                if (data.type === "TIMER_UPDATE" && data.habitId === habit.id) {
                    const parsed = parseTimer(data.timer)

                    if (!parsed) return

                    setHabitTimer(prev => {
                        if (!prev) return parsed
                        if (new Date(parsed.started_at) < new Date(prev.started_at)) {
                            return prev
                        }

                        return parsed
                    })
                }
            } catch (e) {
                console.error("WS TIMER_UPDATE error:", e)
            }
        }

        ws.addEventListener("message", handleTimerEvents)
        return () => ws.removeEventListener("message", handleTimerEvents)
    }, [ws, habit?.id, parseTimer, setHabitTimer])

    const elapsedFromDateString = (date: string, cumulativePauseMs?: number): string => {
        if (!currentTimer) return ""

        const pauseStartMs = new Date(date).getTime()
        const startedMs = currentTimer.started_at.getTime()
        const elapsedMs = pauseStartMs - startedMs - (cumulativePauseMs || 0)

        return formatCurrentMs(elapsedMs)
    }

    const formatCurrentMs = (ms: number): string => {
        const safe = Math.max(0, ms)
        const hours = Math.floor(safe / 3600000)
        const minutes = Math.floor((safe % 3600000) / 60000)
        const seconds = Math.floor((safe % 60000) / 1000)

        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

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
            list.push({
                type: "pause",
                time: elapsedFromDateString(p.time, cumulativePauseMs),
                start: p.start,
                end: p.end
            });

            if (p.end) {
                cumulativePauseMs += new Date(p.end).getTime() - new Date(p.start).getTime();
            }
        });

        currentTimer.circles.forEach(c => {
            let pauseBeforeCircle = 0
            currentTimer.pauses.forEach(p => {
                const pauseStart = new Date(p.start).getTime()
                const pauseEnd = p.end ? new Date(p.end).getTime() : Date.now()
                const circleTime = new Date(c.time).getTime()

                if (pauseStart < circleTime) {
                    pauseBeforeCircle += Math.min(pauseEnd, circleTime) - pauseStart
                }
            })
            list.push({
                type: "circle",
                time: elapsedFromDateString(c.time, pauseBeforeCircle),
                originalTime: c.time,
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
            const finalTime = formatCurrentMs(elapsedMs)

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
                if (event.type === "circle" && event.originalTime && !(event.originalTime in newMap)) {
                    newMap[event.originalTime] = placeholders[Math.floor(Math.random() * placeholders.length)]
                }
            })
            return newMap
        })
    }, [events])

    const handleSend = async (originalTime: string, newText: string) => {
        if (!habit || !currentTimer) return

        setHabitTimer(prev => {
            if (!prev) return prev
            const updatedCircles = prev.circles.map(c =>
                c.time === originalTime ? { ...c, text: newText } : c 
                )
            return { ...prev, circles: updatedCircles }
        })

        try {
            await api.post(`${API_URL}timer/circle/text`, {
                habit_id: habit.id,
                timer_id: currentTimer.id,
                time: originalTime,
                text: newText
            })

            setEditedTexts(prev => {
                const updated = { ...prev }
                delete updated[originalTime]
                return updated
            })

            setEditingKeys(prev => prev.filter(k => k !== originalTime))

            loadTimer(habit.id)
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

    return (
        <div className="completionProgress">
            {events.map((event, index) => {
                const key = event.originalTime ?? `${event.type}-${event.time}-${index}`

                if (event.type === "start") {
                    return (
                        <div key={key} className="eventStr startStr">
                            <span className="eventTime">{event.time}</span>: начало сессии в {formatTime(event.start!)}
                        </div>
                    )
                }

                if (event.type === "pause") {
                    const startTime = formatTime(event.start!);
                    const isOpen = !event.end;

                    let durationMs: number;

                    if (isOpen) {
                        if (currentTimer.status === "ended" || isHistorical) {
                            durationMs = new Date(currentTimer.end_at).getTime() - new Date(event.start!).getTime();
                        } else {
                            durationMs = Date.now() - new Date(event.start!).getTime();
                        }
                    } else {
                        durationMs = new Date(event.end!).getTime() - new Date(event.start!).getTime();
                    }

                    const duration = formatCurrentMs(durationMs);
                    return (
                        <div key={key} className="eventStr pauseStr">
                            <span className="eventTime">{event.time}</span>: пауза с {startTime} до{" "}
                            {isOpen
                                ? (currentTimer.status === "ended" || isHistorical ? formatTime(currentTimer.end_at.toISOString()) : "сейчас") 
                                : formatTime(event.end!)
                            } {event.end && `(длительность ${duration})`}
                        </div>
                    );
                }

                if (event.type === "circle") {
                    const originalCircleTime = event.originalTime!;
                    const currentValue = editedTexts[originalCircleTime] ?? event.text ?? ""
                    const hasChanged = currentValue.trim() !== (event.text ?? "").trim()
                    const canEdit = !isHistorical
                    const isEditing = editingKeys.includes(originalCircleTime)

                    return (
                        <div key={key} className="eventStr circleStr">
                            <div className="circleInfo">
                                <span className="eventTime">{event.time}</span>: круг завершён
                            </div>

                            {isEditing && canEdit ? (
                                <div className="circleEditWrapper">
                                    <textarea
                                        className="circleTA"
                                        placeholder={currentValue ? "" : placeholderMap[event.time]}
                                        maxLength={200}
                                        value={currentValue}
                                        onFocus={(e) => {
                                            const ta = e.target;
                                            ta.style.height = 'auto';
                                            ta.style.height = `${ta.scrollHeight}px`;
                                            ta.selectionStart = ta.value.length;
                                            ta.selectionEnd = ta.value.length;
                                        }}
                                        onChange={(e) => {
                                            const ta = e.target;
                                            ta.style.height = 'auto';
                                            ta.style.height = `${ta.scrollHeight}px`;
                                            setEditedTexts(prev => ({
                                                ...prev,
                                                [originalCircleTime]: e.target.value
                                            }));
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey && hasChanged) {
                                                e.preventDefault();
                                                handleSend(originalCircleTime, currentValue.trim())
                                                setEditingKeys(prev => prev.filter(k => k !== originalCircleTime))
                                            }
                                        }}
                                        onBlur={() => {
                                            if (hasChanged) {
                                                handleSend(originalCircleTime, currentValue.trim())
                                            }
                                            setEditingKeys(prev => prev.filter(k => k !== originalCircleTime))
                                        }}
                                        rows={1}
                                        autoFocus
                                    />
                                    {hasChanged && (
                                        <div
                                            className="sendCircle"
                                            onClick={() => {
                                                handleSend(event.time, currentValue.trim())
                                                setEditingKeys(prev => prev.filter(k => k !== originalCircleTime))
                                            }}
                                        >
                                            <Send fill="currentColor"/>
                                        </div>
                                    )}
                                </div>
                            ) : event.text ? (
                                <div className="circleText savedText" onClick={() => {
                                        if (canEdit) {
                                            setEditingKeys(prev => [...prev, originalCircleTime])
                                            setEditedTexts(prev => ({ ...prev, [originalCircleTime]: event.text ?? "" }))
                                        }
                                }}>
                                    {event.text}
                                </div>
                            ) : canEdit ? (
                                <div className="textPlus" onClick={() => setEditingKeys(prev => [...prev, originalCircleTime])}>
                                    <div/>
                                    <span>+</span>
                                    <div/>
                                </div>
                            ) : null}
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