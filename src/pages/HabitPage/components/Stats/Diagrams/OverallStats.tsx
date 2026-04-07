import { useMemo } from "react"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { overall } from "../../../utils/filters"
import { useParams } from "react-router"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
import { formatDateFromString } from "../../../utils/dateToStr"

type StatKey = "comp" | "skip" | "streak" | "break" | "midd" | "alls"

export default function OverallStats() {
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

    const { stats, extras } = useMemo(() => {
        let done = 0
        let skip = 0
        const doneDates = new Set(
            calendar
                .filter(c => !id || c.habitId === id)
                .filter(c => c.isDone === undefined || c.isDone === true)
                .map(c => c.date)
        )
        let bestStreak = 0
        let currentStreak = 0
        let tempStreak = 0
        let maxBreak = 0
        let tempBreak = 0
        let bestStart = ""
        let bestEnd = ""
        let breakStart = ""
        let breakEnd = ""
        let tempBreakStart = ""
        let tempStart = ""

        const streaks: number[] = []
        const breaks: number[] = []
        days.forEach(day => {
            const isDone = doneDates.has(day)

            if (isDone) {
                done++
                if (tempStreak === 0) tempStart = day
                tempStreak++
                
                if (tempBreak) {
                    breaks.push(tempBreak)

                    if (tempBreak > maxBreak) {
                        maxBreak = tempBreak
                        breakStart = tempBreakStart
                        breakEnd = day
                    }
                }

                tempBreak = 0

            } else {
                skip++
                if (tempStreak) {
                    streaks.push(tempStreak)
                    if (tempStreak > bestStreak) {
                        bestStreak = tempStreak
                        bestStart = tempStart
                        bestEnd = day
                    }
                }

                if (tempBreak === 0) tempBreakStart = day
                tempStreak = 0
                tempBreak++
            }
        })

        if (tempStreak) {
            streaks.push(tempStreak)
            if (tempStreak > bestStreak) {
                bestStreak = tempStreak
                bestStart = tempStart
                bestEnd = days[days.length - 1]
            }
        }

        if (tempBreak) breaks.push(tempBreak)

        for (let i = days.length - 1; i >= 0; i--) {
            if (doneDates.has(days[i])) currentStreak++
            else break
        }

        const avgStreak =
            streaks.length
                ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
                : 0

        const avgBreak =
            breaks.length
                ? Math.round(breaks.reduce((a, b) => a + b, 0) / breaks.length)
                : 0

        const totalDays = done + skip
        const totalStreaks = streaks.length

        const percent = totalDays
            ? Math.round((done / totalDays) * 100)
            : 0

        return {

            stats: {
                comp: [done, `${percent}%`],
                skip: [skip, `${100 - percent}%`],
                streak: [bestStreak, currentStreak],
                break: [maxBreak],
                midd: [avgStreak, avgBreak],
                alls: [totalDays, totalStreaks]
            },

            extras: {
                comp: ["", ""],
                skip: ["", ""],
                streak: [
                    bestStart && bestEnd ? `${formatDateFromString(bestStart)} - ${formatDateFromString(bestEnd)}` : "",
                    ""
                ],
                break: [
                    breakStart && breakEnd ? `${formatDateFromString(breakStart)} - ${formatDateFromString(breakEnd)}` : ""
                ],
                midd: ["", ""],
                alls: ["", ""]
            }

        }

    }, [calendar, id, days])

    if (!stats) return null

    return (
        <div className="overallStats">
            {overall.map((c) => {
                const key = c.value as StatKey
                const values = stats[key] || []
                return (
                    <div className="overallCard" key={c.value}>
                        <span className="oveerallCardName">
                            {c.label}
                        </span>
                        {c.props.map((p, i) => (
                            <span className="overallProp" key={i}>
                                {p}: {values[i] ?? "-"} <span className="overallPropSpan">{extras?.[key]?.[i] ? `(${extras[key][i]})` : ""}</span>
                            </span>
                        ))}
                    </div>
                )
            })}

        </div>
    )
}