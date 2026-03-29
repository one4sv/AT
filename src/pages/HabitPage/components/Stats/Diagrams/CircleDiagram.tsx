import "../../../scss/doneDiagram.scss"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { isMobile } from "react-device-detect"
import { useState } from "react"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
import { useDiagrams } from "../../../../../components/hooks/DiagramHook"
import { useParams } from "react-router-dom"

ChartJS.register(ArcElement, Tooltip, Legend)

export interface DiagramType {
    procent: number
    label: string
    color: string
    count: number
}

export default function CircleDiagram() {
    const { calendar } = useCalendar()
    const { habit } = useTheHabit()
    const { habits } = useHabits()
    const { filter, metric } = useDiagrams()
    const { habitId:id } = useParams<{ habitId: string }>();
    const [showCounts, setShowCounts] = useState(false)

    let totalDone = 0
    let totalSkipped = 0
    let totalNothing = 0

    let startDate = ""

    if (id && habit) {
        startDate = habit.start_date
    } else if (habits && habits.length) {
        startDate = habits
            .map(h => new Date(h.start_date))
            .sort((a, b) => a.getTime() - b.getTime())[0]
            .toISOString()
    }

    const { start, end } = getDateRange(filter, startDate)
    const days = generateDays(start, end)

    if (id && habit) {

        let activeDays = days

        const habitStart = new Date(habit.start_date)
        const habitEnd = habit.end_date ? new Date(habit.end_date) : null

        activeDays = days.filter(day => {
            const d = new Date(day)

            if (d < habitStart) return false
            if (habitEnd && d > habitEnd) return false

            if (habit.periodicity === "weekly" && Array.isArray(habit.chosen_days)) {
                const weekday = d.getDay()
                return habit.chosen_days.includes(weekday)
            }

            return true
        })

        totalNothing = days.length - activeDays.length

        activeDays.forEach(day => {

            const completion = calendar.find(c =>
                c.habitId === id && c.date === day
            )

            const isDone =
                completion &&
                (completion.isDone === undefined || completion.isDone === true)

            if (isDone) totalDone++
            else totalSkipped++
        })

    } else {

        if (!habits) return null

        const activeHabitDays = new Map<string, number>()

        habits.forEach(habit => {

            const habitStart = new Date(habit.start_date)
            const habitEnd = habit.end_date ? new Date(habit.end_date) : end

            days.forEach(day => {

                const d = new Date(day)

                if (d < habitStart || d > habitEnd) return

                if (habit.periodicity === "weekly" && Array.isArray(habit.chosen_days)) {
                    const weekday = d.getDay()
                    if (!habit.chosen_days.includes(weekday)) return
                }

                activeHabitDays.set(day, (activeHabitDays.get(day) || 0) + 1)

                const completion = calendar.find(c =>
                    Number(c.habitId) === habit.id && c.date === day
                )

                if (completion) {

                    if (completion.isDone === undefined || completion.isDone === true) {
                        totalDone++
                    } else {
                        totalSkipped++
                    }

                } else {
                    totalSkipped++
                }

            })
        })

        totalNothing = days.filter(day => !activeHabitDays.has(day)).length
    }

    const totalPeriod = days.length

    const completedProcent = (totalDone / totalPeriod) * 100
    const skippedProcent = (totalSkipped / totalPeriod) * 100
    const nothingProcent = (totalNothing / totalPeriod) * 100

    const Diagram: DiagramType[] = []

    if (completedProcent > 0 && (metric === "all" || metric === "comp"))
        Diagram.push({
            procent: completedProcent,
            label: "Выполнено",
            color: "comp",
            count: totalDone,
        })

    if (skippedProcent > 0 && (metric === "all" || metric === "skip"))
        Diagram.push({
            procent: skippedProcent,
            label: "Пропущено",
            color: "skip",
            count: totalSkipped,
        })

    if (nothingProcent > 0 && (metric === "all" || metric === "free"))
        Diagram.push({
            procent: nothingProcent,
            label: "Свободно",
            color: "nothing",
            count: totalNothing,
        })

    const colors: Record<string, string> = {
        comp: "#129e12",
        skip: "#646464",
        nothing: "#111111",
    }

    const data = {
        labels: Diagram.map(d => d.label),
        datasets: [
            {
                data: Diagram.map(d => d.procent),
                backgroundColor: Diagram.map(d => colors[d.color] || "#ccc"),
                borderWidth: 0,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
            legend: {
                display: false,
            },
        },
    }
    console.log(totalNothing)
    return (
        <div
            className={`doneDiagram ${isMobile ? "mobile" : ""}`}
            onClick={() => setShowCounts(!showCounts)}
        >
            <div className="diagram">
                <Doughnut data={data} options={options} />
                <div className="diagramLegend">
                    {Diagram.map((d, i) => (
                        <div className="legendStr" key={i}>
                            <div className={`calendarDot ${d.color}`}></div>
                            {d.label}:{" "}
                            <span>
                                {showCounts ? d.count : `${d.procent.toFixed(0)}%`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}