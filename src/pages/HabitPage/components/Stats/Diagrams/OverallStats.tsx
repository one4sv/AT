import { useMemo } from "react"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useParams } from "react-router"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
import {
    calculateOverallStats,
    type Stats
} from "./CalculateOverallStats"
import { cards } from "../../../utils/filters"

export default function OverallStats({
    setSlide
}: {
    setSlide: React.Dispatch<
        React.SetStateAction<{
            label: string
            value: string
            slide:boolean
        }>
    >
}) {
    const { calendar } = useCalendar()
    const { habitId: id } = useParams()
    const { habits } = useHabits()
    const { habit } = useTheHabit()

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

    const { stats, extras } = useMemo(
        () => calculateOverallStats(calendar, days, id),
        [calendar, days, id]
    )

    return (
        <div className="overallStats">
            {cards.map(c => {
                return (
                    <div
                        className="overallCard"
                        key={c.value}
                        onClick={() =>
                            setSlide({
                                label: c.label,
                                value: c.value,
                                slide: true
                            })
                        }
                    >
                        {c.props.map((group, groupIndex) => (
                            <div
                                className="overallPropGroup"
                                key={groupIndex}
                            >
                                <span className="overallPropGroupName">
                                    {group.label}
                                </span>

                                {group.props.map(prop => {
                                    const value =
                                        stats[prop.value as keyof Stats]

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
                                            {prop.label}: <span className={`PropValueSpan ${group.value}`}>{value ?? "-"}</span>

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
                )
            })}
        </div>
    )
}