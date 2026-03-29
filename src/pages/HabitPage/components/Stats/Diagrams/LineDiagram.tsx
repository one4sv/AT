import "../../../scss/Diagrams.scss"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from "chart.js"

import type {
    ActiveElement,
    ChartData,
    ChartDataset,
    ChartEvent,
    ChartOptions,
    TooltipItem,
} from "chart.js"

import { useMemo } from "react"
import { useDiagrams } from "../../../../../components/hooks/DiagramHook"
import { useParams } from "react-router-dom"
import {
    generateDays,
    getDateRange,
    getMonday,
    getMonthStart,
    groupDays,
} from "../../../utils/DiagramDate"
import { formatDateFromString } from "../../../utils/dateToStr"
import type { Calendar } from "../../../../../components/context/CalendarContext"
import type { Habit } from "../../../../../components/context/HabitsContext"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
)

interface GroupedDays {
    label: string
    days: string[]
}

interface GroupStat {
    done: number
    skip: number
    free: number
    doneNames: string[]
    skipNames: string[]
}

interface ChartState {
    data: ChartData<"line", number[], string>
    groupsDays: GroupedDays[]
    effectiveGroup: string
    groupStats: GroupStat[]
}

function getHabitLabel(habit: Habit): string {
    return habit.name ?? `Habit ${habit.id}`
}

function getAnchorDate(groupType: string, day: string): string {
    if (groupType === "week") return getMonday(day)
    if (groupType === "month") return getMonthStart(day)
    return day
}

function formatGroupLabel(groupType: string, day: string): string {
    const date = new Date(getAnchorDate(groupType, day))

    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    if (groupType === "month") {
        return `${month}.${year}`
    }

    if (groupType === "week") {
        const week = Math.ceil(date.getDate() / 7)
        return `${week} нед. ${month}.${year}`
    }

    return formatDateFromString(day)
}

function buildCalendarIndex(calendar: Calendar[]) {
    const map = new Map<string, Calendar>()

    for (const entry of calendar) {
        map.set(`${String(entry.habitId)}|${entry.date}`, entry)
    }

    return map
}

export default function LineDiagram() {
    const { calendar, setChosenDay, setSelectedMonth, setSelectedYear } = useCalendar()
    const { habit } = useTheHabit()
    const { habits } = useHabits()
    const { filter, metric, group, mainRef } = useDiagrams()
    const { habitId: id } = useParams<{ habitId: string }>()

    const { data, groupsDays, effectiveGroup, groupStats } = useMemo<ChartState>(() => {
        let startDate = ""

        if (id && habit) {
            startDate = habit.start_date
        } else if (habits?.length) {
            startDate = habits
                .map(h => new Date(h.start_date))
                .sort((a, b) => a.getTime() - b.getTime())[0]
                .toISOString()
        }

        const { start, end } = getDateRange(filter, startDate)
        const days = generateDays(start, end)

        const allowGrouping = days.length >= 90
        const effectiveGroup = allowGrouping ? group : "day"

        const groupsDays = groupDays(days, effectiveGroup) as GroupedDays[]
        const calendarIndex = buildCalendarIndex(calendar)

        const donePerDay: number[] = []
        const skipPerDay: number[] = []
        const freePerDay: number[] = []
        const groupStats: GroupStat[] = []

        for (const groupItem of groupsDays) {
            let done = 0
            let skip = 0
            let free = 0

            const doneNames = new Set<string>()
            const skipNames = new Set<string>()

            for (const day of groupItem.days) {
                let dayHasPlannedHabit = false
                if (id && habit) {
                    const habitStart = new Date(habit.start_date)
                    const habitEnd = habit.end_date ? new Date(habit.end_date) : null
                    const d = new Date(day)
                    if (d < habitStart || (habitEnd && d > habitEnd)) {
                        free++
                        continue
                    }
                    if (
                        habit.periodicity === "weekly" &&
                        Array.isArray(habit.chosen_days)
                    ) {
                        const weekday = d.getDay()
                        if (!habit.chosen_days.includes(weekday)) {
                            free++
                            continue
                        }
                    }
                    const completion = calendarIndex.get(`${id}|${day}`)
                    if (completion) {
                        if (
                            completion.isDone === undefined ||
                            completion.isDone === true
                        ) {
                            done++
                            doneNames.add(getHabitLabel(habit))
                        } else {
                            skip++
                            skipNames.add(getHabitLabel(habit))
                        }
                    } else if (habit.periodicity !== "sometimes") {
                        skip++
                        skipNames.add(getHabitLabel(habit))
                    }
                } else {
                    if (!habits) continue

                    for (const currentHabit of habits) {
                        const habitStart = new Date(currentHabit.start_date)
                        const habitEnd = currentHabit.end_date
                            ? new Date(currentHabit.end_date)
                            : end
                        const d = new Date(day)

                        if (d < habitStart || d > habitEnd) continue

                        if (
                            currentHabit.periodicity === "weekly" &&
                            Array.isArray(currentHabit.chosen_days)
                        ) {
                            const weekday = d.getDay()

                            if (!currentHabit.chosen_days.includes(weekday)) {
                                continue
                            }

                            dayHasPlannedHabit = true
                        }
                        else {
                            dayHasPlannedHabit = true
                        }

                        const completion = calendarIndex.get(
                            `${String(currentHabit.id)}|${day}`
                        )

                        if (completion) {
                            if (
                                completion.isDone === undefined ||
                                completion.isDone === true
                            ) {
                                done++
                                doneNames.add(getHabitLabel(currentHabit))
                            } else {
                                skip++
                                skipNames.add(getHabitLabel(currentHabit))
                            }
                        }
                        else if (currentHabit.periodicity !== "sometimes") {
                            skip++
                            skipNames.add(getHabitLabel(currentHabit))
                        }
                    }

                    if (!dayHasPlannedHabit) {
                        free++
                    }
                }
            }

            donePerDay.push(done)
            skipPerDay.push(skip)
            freePerDay.push(free)
            groupStats.push({
                done,
                skip,
                free,
                doneNames: Array.from(doneNames),
                skipNames: Array.from(skipNames),
            })
        }

        const datasets: ChartDataset<"line", number[]>[] = []

        if (metric === "all" || metric === "comp") {
            datasets.push({
                label: "Выполнено",
                data: donePerDay,
                borderColor: "#129e12",
                backgroundColor: "#129e12",
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 7,
            })
        }

        if (metric === "all" || metric === "skip") {
            datasets.push({
                label: "Пропущено",
                data: skipPerDay,
                borderColor: "#646464",
                backgroundColor: "#646464",
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 7,
            })
        }

        if (metric === "all" || metric === "free") {
            datasets.push({
                label: "Свободно",
                data: freePerDay,
                borderColor: "#111111",
                backgroundColor: "#111111",
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 7,
            })
        }

        return {
            data: {
                labels: groupsDays.map(g =>
                    formatGroupLabel(effectiveGroup, g.days[0])
                ),
                datasets,
            },
            groupsDays,
            effectiveGroup,
            groupStats,
        }
    }, [calendar, habit, habits, filter, metric, id, group])

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
            if (!elements.length) return

            const index = elements[0].index
            const clickedGroup = groupsDays[index]

            if (!clickedGroup) return

            const day = clickedGroup.days[0]
            const selectedDate = getAnchorDate(effectiveGroup, day)

            setChosenDay(selectedDate)

            const d = new Date(selectedDate)

            setSelectedMonth(d.getMonth())
            setSelectedYear(d.getFullYear())
            if (mainRef.current !== null) mainRef.current.scrollTo({top: 0, behavior: "smooth"})
        },
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                callbacks: {
                    afterLabel: (ctx: TooltipItem<"line">) => {
                        const index = ctx.dataIndex
                        const group = groupStats[index]

                        if (!group) return []

                        if (ctx.dataset.label === "Выполнено") {
                            const shown = group.doneNames.slice(0, 3)
                            const more = group.doneNames.length - shown.length

                            if (more > 0) shown.push(`и ещё ${more}`)

                            return shown.length ? shown : ["Нет выполненных"]
                        }

                        if (ctx.dataset.label === "Пропущено") {
                            const shown = group.skipNames.slice(0, 3)
                            const more = group.skipNames.length - shown.length

                            if (more > 0) shown.push(`и ещё ${more}`)

                            return shown.length ? shown : ["Нет пропусков"]
                        }

                        if (ctx.dataset.label === "Свободно") {
                            return group.free > 0
                                ? ["Свободно"]
                                : ["Нет свободных"]
                        }

                        return []
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }

    if (!data) return null

    return (
        <div className="doneDiagram">
            <Line data={data} options={options} />
        </div>
    )
}