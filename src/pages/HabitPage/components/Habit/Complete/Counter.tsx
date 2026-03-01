import "../../../scss/Counter.scss"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useState, useEffect, useRef } from "react"
import { Pen, Send } from "lucide-react"
import { ArrowClockwise, Minus, Plus } from "@phosphor-icons/react"
import { api } from "../../../../../components/ts/api"

interface FlyingNumber {
  id: number,
  val: string,
  side: "left" | "right"
}

export default function Counter() {
    const { habit, showCounter, habitCounter, counterSettings, loadHabit } = useTheHabit()
    const { chosenDay } = useCalendar()
    const API_URL = import.meta.env.VITE_API_URL;

    const counterRef = useRef<HTMLDivElement>(null)

    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
    const isHistorical = chosenDay && chosenDay !== todayStr
    const currentCounter = isHistorical ? showCounter : habitCounter

    const serverCount = currentCounter?.count || 0
    const minCount = currentCounter?.min_count || 0

    const [localCount, setLocalCount] = useState(serverCount)
    const paddedCount = localCount.toString().padStart(4, '0')

    const [flyingNumbers, setFlyingNumbers] = useState<FlyingNumber[]>([])

    const [customMinus, setCustomMinus] = useState<string>("")
    const [customPlus, setCustomPlus] = useState<string>("")
    const [ edit, setEdit ] = useState<string>("")

    useEffect(() => {
        setLocalCount(serverCount)
    }, [serverCount])

    const pendingVal = useRef(0)
    const timeoutRef = useRef<number | null>(null)

    const sendDelta = async (totalVal: number) => {
        if (totalVal === 0 || !habit?.id || isHistorical) return
        try {
            await api.post(`${API_URL}counter/value`, { habit_id: habit.id, val: totalVal })
            if (loadHabit) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
            if (loadHabit) loadHabit(String(habit.id))
        }
    }

    const changeCount = (val: number) => {
        if (isHistorical || !habit) return

        setLocalCount(prev => {
            const newLocal = Math.max(0, prev + val)
            return newLocal
        })

        pendingVal.current += val

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => {
            sendDelta(pendingVal.current)
            pendingVal.current = 0
        }, 600)
    }

    console.log(flyingNumbers)
    const handleClickWithFly = (val: number, side: "left" | "right") => {
        if (!counterRef.current || val === 0) return

        setFlyingNumbers(prev => [...prev, {
            id: Date.now(),
            val: val > 0 ? `+${val}` : `${val}`,
            side:side
        }])

        changeCount(val)
    }

    const restoreCounter = async () => {
        if (isHistorical || !habit?.id) return
        try {
            const res = await api.post(`${API_URL}counter/restore`, { habit_id: habit.id })
            if (res.data.success) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
        }
    }

    const updateCounterSetting = async (field: "min_counter" | "red_counter_right" | "red_counter_left", value: number) => {
        if (!habit?.id || isHistorical) return
        try {
            const res = await api.post(`${API_URL}counter/settings`, {
                habit_id: habit.id,
                [field]: value
            })
            if (res.data.success) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
        }
    }
    const saveMin = (el: HTMLElement) => {
        const newMin = parseInt(el.textContent || "0", 10) || 0
        if (counterSettings && newMin !== counterSettings.min_count) {
            updateCounterSetting("min_counter", newMin)
        }
    }

    if (!counterSettings || !habit) return null

    return (
        <div className="completeMain" style={{ position: "relative" }}>
            <div className="counterScore" ref={counterRef}>
                {paddedCount.split('').map((digit, index) => (
                    <div key={index} className="digitSquare">
                        <div className="digitWrapper">
                            <span className="digit">{digit}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="counterMin">
                цель: <span
                    contentEditable={!isHistorical}
                    suppressContentEditableWarning
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            saveMin(e.currentTarget)
                            e.currentTarget.blur()
                        }
                    }}
                    onBlur={(e) => saveMin(e.currentTarget)}
                >{minCount}</span>
                <Pen fill="currentColor" width={12} height={12} />
            </div>
            <div className="timerButts">
                <div className="launchButtWrapper">
                    {flyingNumbers.filter(n => n.side ==="left").map(f => (
                        <div
                            key={f.id}
                            className="flyingNumber"
                            onAnimationEnd={() => setFlyingNumbers(prev => prev.filter(p => p.id !== f.id))}
                        >
                            {f.val}
                        </div>
                    ))}
                    <div className={`launchButt ${edit === "left" ? "editing" : ""} ${isHistorical ? "disabled" : ""}`} onClick={() => {
                        if (edit === "left") return
                        handleClickWithFly(counterSettings.red_counter_left ?? 0, "left")
                    }}>
                        + <span
                            contentEditable={edit === "left" && !isHistorical}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newVal = parseInt(e.currentTarget.textContent || "0", 10) || 0
                                if (newVal !== counterSettings.red_counter_left) {
                                    updateCounterSetting("red_counter_left", newVal)
                                }
                            }}
                        >{counterSettings.red_counter_left ?? 0}</span>
                    </div>
                    {!isHistorical ? (
                        <div className="counterRedButt" onClick={() => {
                            if (edit === "left") {
                                setEdit("")
                            } else setEdit("left")
                        }}>
                            {edit === "left" ? 
                                <Send fill="currentColor"/>
                                :
                                <Pen fill="currentColor"/>
                            }
                        </div>
                    ) : (
                        ""
                    )}
                    
                </div>
                <div className="launchButtWrapper">
                    {flyingNumbers.filter(n => n.side ==="right").map(f => (
                        <div
                            key={f.id}
                            className="flyingNumber"
                            onAnimationEnd={() => setFlyingNumbers(prev => prev.filter(p => p.id !== f.id))}
                        >
                            {f.val}
                        </div>
                    ))}
                    <div className={`launchButt ${edit === "right" ? "editing" : ""} ${isHistorical ? "disabled" : ""}`} onClick={() => {
                        if (isHistorical) return
                        if (edit === "right") return
                        handleClickWithFly(counterSettings.red_counter_right, "right")
                    }}>
                        + <span
                            contentEditable={edit === "right" && !isHistorical}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newVal = parseInt(e.currentTarget.textContent || "0", 10) || 0
                                if (newVal !== counterSettings.red_counter_right) {
                                    updateCounterSetting("red_counter_right", newVal)
                                }
                            }}
                        >{counterSettings.red_counter_right}</span>
                    </div>
                    {!isHistorical ? (
                        <div className="counterRedButt" onClick={() => {
                            if (edit === "right") {
                                setEdit("")
                            }
                            else setEdit("right")
                        }}>
                            {edit === "right" ? 
                                <Send fill="currentColor"/>
                                :
                                <Pen fill="currentColor"/>
                            }
                        </div>
                    ) : (
                        ""
                    )}
                    
                </div>
            </div>

            <div className="timerButts">
                <div className="counterChange">
                    <Minus weight="bold" />
                    <input
                        type="number"
                        value={customMinus}
                        onChange={(e) => setCustomMinus(e.target.value)}
                        className="changeCounterInp"
                        min="1"
                        max="9999"
                        maxLength={4}
                    />
                    {customMinus && (
                        <div className="sendCircle" onClick={() => {
                            const val = parseInt(customMinus, 10) || 0
                            if (val > 0) {
                                changeCount(-val)
                                setCustomMinus("")
                            }
                        }}>
                            <Send fill="currentColor" />
                        </div>
                    )}
                </div>
                <div className="launchButtWrapper">
                    <div className={`launchButt ${isHistorical ? "disabled" : ""}`} onClick={() => {
                        if (isHistorical) return
                        restoreCounter()
                    }}>
                        <ArrowClockwise />
                    </div>
                </div>
               
                <div className="counterChange">
                    <Plus weight="bold" />
                    <input
                        type="number"
                        value={customPlus}
                        onChange={(e) => setCustomPlus(e.target.value)}
                        className="changeCounterInp"
                        min="1"
                        minLength={1}
                        max="9999"
                        maxLength={4}
                    />
                    {customPlus && (
                        <div className="sendCircle" onClick={() => {
                            const val = parseInt(customPlus, 10) || 0
                            if (val > 0) {
                                changeCount(val)
                                setCustomPlus("")
                            }
                        }}>
                            <Send fill="currentColor" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}