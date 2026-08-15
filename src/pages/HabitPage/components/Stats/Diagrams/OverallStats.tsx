import { useParams } from "react-router-dom"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { cards } from "../../../utils/filters"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
import { MiniLine } from "./MiniChart"
import { getCardMiniChartData } from "../../../utils/diagramsFuncs"
import { useNote } from "../../../../../components/hooks/NoteHook"
import { calculateOverallStats } from "./CalculateOverallStats"
import { useMemo } from "react"

export default function OverallStats({
    setSlide
}: {
    setSlide: React.Dispatch<
        React.SetStateAction<{
            label: string
            value: string
            slide: boolean
        }>
    >
}) {
    const { calendar } = useCalendar()
    const { habitId: id } = useParams()
    const { habits } = useHabits()
    const { habitSettings, overallStats, habit } = useTheHabit()
    const { showNotification } = useNote()

    let startDate = ""

    if (id && habit) {
        startDate = habit.start_date
    } else if (habits && habits.length) {
        startDate = habits
            .map(h => new Date(h.start_date))
            .sort((a, b) => a.getTime() - b.getTime())[0]
            .toISOString()
    }

    const { start, end } = getDateRange("all", startDate)
    const days = generateDays(start, end)

    // Когда нет id — считаем сами
    // Когда есть id — берём из хука
    const { stats, extras } = useMemo(() => {
        if (!id) {
            return calculateOverallStats(calendar, days) // без habitId
        }

        if (!overallStats) {
            return {
                stats: null,
                extras: { streakMax: "", breakMax: "" }
            }
        }

        return overallStats
    }, [id, calendar, days, overallStats])

    if (!stats) {
        return null
    }

    const formatTimer = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            if (minutes > 0) return `${hours} ч ${minutes} мин`
            return `${hours} ч`
        }
        if (minutes > 0) {
            if (secs > 0) return `${minutes} мин ${secs} с`
            return `${minutes} мин`
        }
        return `${secs} с`
    }

    return (
        <div className="overallStats">
            {cards.map(c => {
                const specialCards = ["counter", "timer", "schedule"]

                if (!id && specialCards.includes(c.value)) {
                    return null
                }

                const mini = getCardMiniChartData(
                    c.value,
                    calendar,
                    days,
                    id // когда нет id — внутри функции тоже будет без фильтра
                )

                const metricType = habitSettings?.metric_type

                if (id && specialCards.includes(c.value)) {
                    if (metricType !== c.value) {
                        return null
                    }
                }

                return (
                    <div
                        className="overallCard"
                        key={c.value}
                        onClick={() => {
                            if (specialCards.includes(c.value) || c.value === "all") {
                                showNotification("info", "В разработке")
                                return
                            }
                            setSlide({
                                label: c.label,
                                value: c.value,
                                slide: true
                            })
                        }}
                    >
                        <div className="overallPropText">
                            {c.props.map((group, groupIndex) => (
                                <div
                                    className="overallPropGroup"
                                    key={groupIndex}
                                >
                                    <span className="overallPropGroupName">
                                        {group.label}
                                    </span>

                                    {group.props.map(prop => {
                                        const value = stats[prop.value as keyof typeof stats]

                                        let displayValue = value

                                        if (
                                            metricType === "timer" &&
                                            (
                                                prop.value === "fullTimer" ||
                                                prop.value === "maxTimer" ||
                                                prop.value === "middleTimer"
                                            ) &&
                                            typeof value === "number"
                                        ) {
                                            displayValue = formatTimer(value)
                                        }

                                        let extra = ""
                                        if (prop.value === "streakMax") {
                                            extra = extras.streakMax
                                        }
                                        if (prop.value === "breakMax") {
                                            extra = extras.breakMax
                                        }

                                        return (
                                            <span
                                                className="overallProp"
                                                key={prop.value}
                                            >
                                                {prop.label}:{" "}
                                                <span
                                                    className={`PropValueSpan ${group.value}`}
                                                >
                                                    {displayValue ?? "-"}
                                                </span>
                                                {extra && (
                                                    <span className="overallPropSpan">
                                                        {" "}({extra})
                                                    </span>
                                                )}
                                            </span>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>

                        {mini && (
                            <MiniLine
                                values={mini.values}
                                type={c.value as "comp" | "streak" | "break"}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}