import { useEffect, useState } from "react";
import type { habitCounter } from "../../../../../components/context/TheHabitContext";
import { timeToStr } from "../../../utils/dateToStr";
import { placeholders } from "../../../utils/placeholders";
import { Send } from "lucide-react";
import { api } from "../../../../../components/ts/api";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";

export default function CounterProgression({currentCounter}:{currentCounter:habitCounter | null, isHistorical:boolean}) {
    const { habit, loadCounter, setHabitCounter } = useTheHabit()
    const events = currentCounter?.progression
    const [ editingIndices, setEditingIndices ] = useState<number[]>([])
    const [ placeholderMap, setPlaceholderMap ] = useState<Record<string, string>>({})
    const [ editedTexts, setEditedTexts ] = useState<Record<string, string>>({})
    const API_URL = import.meta.env.VITE_API_URL
    
    useEffect(() => {
        if (!events) return
        setPlaceholderMap(prev => {
            const newMap = { ...prev }
            events.forEach((event, index) => {
                newMap[`${event.time}-${event.count}-${index}`] =
                    placeholders[Math.floor(Math.random() * placeholders.length)]
                })
            return newMap
        })
    }, [events])

    const handleSend = async (key: string, time: Date, newText: string) => {
        if (!habit || !currentCounter) return

        setHabitCounter(prev => {
            if (!prev) return prev
            const updatedProgression = prev.progression.map(p =>
                new Date(p.time).toISOString() === time.toISOString()
                    ? { ...p, text: newText }
                    : p
            )
            return { ...prev, progression: updatedProgression }
        })

        try {
            await api.post(`${API_URL}counter/text`, {
                habit_id: habit.id,
                counter_id: currentCounter.id,
                time: time,
                text: newText
            })

            setEditedTexts(prev => {
                const updated = { ...prev }
                delete updated[key]
                return updated
            })

            setEditingIndices(prev => prev.filter(i => !key.includes(`-${i}`)))

            loadCounter(habit.id)
        } catch (err) {
            console.error("Ошибка сохранения текста:", err)
        }
    }

    if (!events) {
        return (
            <div className="completionProgress">
                <div className="eventStr emptyEvents">Сессия не начата</div>
            </div>
        )
    }

    return (
        <div className="completionProgress">
            {events.map((event, index) => {
                const key = `${event.time}-${event.count}-${index}`
                const currentValue = editedTexts[key] ?? event.text ?? ""
                const hasChanged = currentValue.trim() !== (event.text ?? "").trim()
                const isEditing = editingIndices.includes(index)
                return (
                    <div className="eventStr eventCounter" key={key}>
                        <span className="eventTime">{timeToStr(event.time)}</span> значение изменено на {event.count}
                        {isEditing ? (
                            <div className="circleEditWrapper">
                                <textarea
                                    className="circleTA"
                                    placeholder={currentValue ? "" : placeholderMap[key]}
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
                                            [key]: e.target.value
                                        }));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && hasChanged) {
                                            e.preventDefault();
                                            handleSend(key, event.time, currentValue.trim())
                                            setEditingIndices(prev => prev.filter(i => i !== index))
                                        }
                                    }}
                                    onBlur={() => {
                                        if (hasChanged) {
                                            handleSend(key, event.time, currentValue.trim())
                                        }
                                        setEditingIndices(prev => prev.filter(i => i !== index))
                                    }}
                                    rows={1}
                                    autoFocus
                                />
                                {hasChanged && (
                                    <div
                                        className="sendCircle"
                                        onClick={() => {
                                            handleSend(key, event.time, currentValue.trim())
                                            setEditingIndices(prev => prev.filter(i => i !== index))
                                        }}
                                    >
                                        <Send fill="currentColor"/>
                                    </div>
                                )}
                            </div>
                        ) : event.text ? (
                            <div className="circleText savedText" onClick={() => {
                                setEditingIndices(prev => [...prev, index])
                                setEditedTexts(prev => ({ ...prev, [key]: event.text ?? "" }))
                            }}>
                                {event.text}
                            </div>
                        ) : (
                            <div className="textPlus" onClick={() => setEditingIndices(prev => [...prev, index])}>
                                <div/>
                                <span>+</span>
                                <div/>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}