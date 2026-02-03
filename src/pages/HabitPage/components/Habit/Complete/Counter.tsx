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
    const minCount = counterSettings?.min_count || 0

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
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const sendDelta = async (totalVal: number) => {
        if (totalVal === 0 || !habit?.id || isHistorical) return
        try {
            await api.post(`${API_URL}counter/plus`, { habit_id: habit.id, val: totalVal })
            if (loadHabit) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
            if (loadHabit) loadHabit(String(habit.id))
        }
    }

    const changeCount = (val: number) => {
        if (isHistorical || !habit) return

        const newLocal = Math.max(minCount, localCount + val)
        setLocalCount(newLocal)

        pendingVal.current += val

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
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
            await api.post(`${API_URL}counter/restore`, { habit_id: habit.id })
            if (loadHabit) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
        }
    }

    const updateCounterSetting = async (field: "min_counter" | "redCounterRight" | "redCounterLeft", value: number) => {
        if (!habit?.id || isHistorical) return
        try {
            await api.post(`${API_URL}counter/settings`, {
                habit_id: habit.id,
                [field]: value
            })
            if (loadHabit) loadHabit(String(habit.id))
        } catch (err) {
            console.error(err)
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
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                        const newMin = parseInt(e.currentTarget.textContent || "0", 10) || 0
                        if (newMin !== counterSettings.min_count) {
                            updateCounterSetting("min_counter", newMin)
                        }
                    }}
                >{counterSettings.min_count}</span>
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
                    <div className={`launchButt ${edit === "left" ? "editing" : ""}`} onClick={() => {
                        if (edit === "left") return
                        handleClickWithFly(counterSettings.redCountLeft ?? 0, "left")
                    }}>
                        + <span
                            contentEditable={edit === "left"}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newVal = parseInt(e.currentTarget.textContent || "0", 10) || 0
                                if (newVal !== counterSettings.redCountLeft) {
                                    updateCounterSetting("redCounterLeft", newVal)
                                }
                            }}
                        >{counterSettings.redCountLeft ?? 0}</span>
                    </div>
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
                    <div className={`launchButt ${edit === "right" ? "editing" : ""}`} onClick={() => {
                        if (edit === "right") return
                        handleClickWithFly(counterSettings.redCountRight, "right")
                    }}>
                        + <span
                            contentEditable={edit === "right"}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                                const newVal = parseInt(e.currentTarget.textContent || "0", 10) || 0
                                if (newVal !== counterSettings.redCountRight) {
                                    updateCounterSetting("redCounterRight", newVal)
                                }
                            }}
                        >{counterSettings.redCountRight}</span>
                    </div>
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
                    />
                    {customMinus && (
                        <div className="sendCircle" onClick={() => {
                            const val = parseInt(customMinus, 10) || 0
                            if (val > 0) {
                                setCustomMinus("")
                            }
                        }}>
                            <Send fill="currentColor" />
                        </div>
                    )}
                </div>

                <div className="launchButt" onClick={restoreCounter}>
                    <ArrowClockwise />
                </div>

                <div className="counterChange">
                    <Plus weight="bold" />
                    <input
                        type="number"
                        value={customPlus}
                        onChange={(e) => setCustomPlus(e.target.value)}
                        className="changeCounterInp"
                        min="1"
                        max="9999"
                    />
                    {customPlus && (
                        <div className="sendCircle" onClick={() => {
                            const val = parseInt(customPlus, 10) || 0
                            if (val > 0) {
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