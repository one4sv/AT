import "../../../scss/Diagrams.scss"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { Bar } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js"

import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { useDiagrams } from "../../../../../components/hooks/DiagramHook"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
)

export default function ColumnDiagram () {
    const { calendar } = useCalendar()
    const { habit } = useTheHabit()
    const { habits } = useHabits()
    const { filter, metric } = useDiagrams()
    const { habitId:id } = useParams<{ habitId: string }>();

    const { data } = useMemo(() => {
        let totalDone = 0
        let totalSkipped = 0
        let totalNothing = 0

        let startDate = ""

        if (id && habit) {
            startDate = habit.start_date
        }
        else if (habits?.length) {
            startDate = habits
                .map(h => new Date(h.start_date))
                .sort((a,b)=>a.getTime()-b.getTime())[0]
                .toISOString()
        }

        const { start, end } = getDateRange(filter, startDate)
        const days = generateDays(start,end)

        if (id && habit) {
            const habitStart = new Date(habit.start_date)
            const habitEnd = habit.end_date ? new Date(habit.end_date) : null
            const activeDays = days.filter(day => {
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
                if (completion) {
                    if (completion.isDone === undefined || completion.isDone === true)
                        totalDone++
                    else
                        totalSkipped++
                } else {
                    totalSkipped++
                }
            })
        }

        else {
            if (!habits) return {data:null}
            const activeHabitDays = new Map<string, number>()
            habits.forEach(habit => {
                const habitStart = new Date(habit.start_date)
                const habitEnd = habit.end_date ? new Date(habit.end_date) : end
                days.forEach(day => {
                    const d = new Date(day)
                    if (d < habitStart || d > habitEnd) return
                    if (habit.periodicity === "weekly" && Array.isArray(habit.chosen_days)) {
                        const weekday = d.getDay()
                        if (!habit.chosen_days.includes(weekday))
                            return
                    }
                    activeHabitDays.set(day,(activeHabitDays.get(day)||0)+1)
                    const completion = calendar.find(c =>
                        Number(c.habitId) === habit.id && c.date === day
                    )
                    if (completion) {
                        if (completion.isDone === undefined || completion.isDone === true)
                            totalDone++
                        else
                            totalSkipped++
                    } else {
                        totalSkipped++
                    }
                })
            })
            totalNothing = days.filter(day => !activeHabitDays.has(day)).length
        }
        const labels:string[] = []
        const values:number[] = []
        const colors:string[] = []
        if (metric === "all" || metric === "comp") {
            labels.push("Выполнено")
            values.push(totalDone)
            colors.push("#129e12")
        }
        if (metric === "all" || metric === "skip") {
            labels.push("Пропущено")
            values.push(totalSkipped)
            colors.push("#646464")
        }
        if (metric === "all" || metric === "free") {
            labels.push("Свободно")
            values.push(totalNothing)
            colors.push("#111111")
        }
        return {
            data:{
                labels,
                datasets:[
                    {
                        data:values,
                        backgroundColor:colors,
                        borderRadius:6
                    }
                ]
            }
        }

    },[calendar,habit,habits,filter,metric,id])
    if (!data) return null
    const options = {
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
            legend:{
                display:false
            }
        },
        scales:{
            x:{
                grid:{
                    display:false
                }
            },
            y:{
                beginAtZero:true
            }
        }
    }
    return (
        <div className="doneDiagram">
            <Bar
                data={data}
                options={options}
            />
        </div>
    )
}