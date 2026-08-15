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
} from "chart.js"
import React, { useMemo } from "react"
import { useParams } from "react-router-dom"
import {
    generateDays,
    getDateRange,
    getMonday,
    getMonthStart,
    groupDays,
} from "../../../utils/DiagramDate"
import { formatShortDateFromString, weekDay } from "../../../../../components/ts/utils/dateToStr"
import { isMobile } from "react-device-detect"
import { getStreakLengthSeries } from "../../../utils/diagramsFuncs"

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

function getAnchorDate(groupType: string, day: string): string {
    if (groupType === "week") return getMonday(day)
    if (groupType === "month") return getMonthStart(day)
    return day
}

function formatGroupLabel(groupType: string, day: string): string {
    const date = new Date(getAnchorDate(groupType, day))
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()

    if (groupType === "month") return `${month}.${year}`
    if (groupType === "week") {
        const week = Math.ceil(date.getDate() / 7)
        return `${week} нед. ${month}`
    }
    return `${formatShortDateFromString(day)} ${weekDay(day)}`
}

export default function StreakDiagram({
    group,
    period,
    mainRef,
}: {
    group: string
    period: string
    mainRef: React.RefObject<HTMLDivElement | null>
}) {
    const { calendar, setChosenDay, setSelectedMonth, setSelectedYear } = useCalendar()
    const { habit } = useTheHabit()
    const { habits } = useHabits()
    const { habitId: id } = useParams<{ habitId: string }>()

    const { data, groupsDays, effectiveGroup } = useMemo(() => {
        let startDate = ""
        if (id && habit) {
            startDate = habit.start_date
        } else if (habits?.length) {
            startDate = habits
                .map(h => new Date(h.start_date))
                .sort((a, b) => a.getTime() - b.getTime())[0]
                .toISOString()
        }

        const { start, end } = getDateRange(period, startDate)
        const days = generateDays(start, end)

        const allowGrouping = days.length >= 90
        const effectiveGroup = allowGrouping ? group : "day"
        const groupsDays = groupDays(days, effectiveGroup) as GroupedDays[]

        // Считаем длину стрика по всем дням, потом берём значение на конец группы
        const fullSeries = getStreakLengthSeries(calendar, days, id)

        const dayIndex = new Map(days.map((d, i) => [d, i]))

        const streakPerGroup: number[] = groupsDays.map(g => {
            // берём значение стрика на последний день группы
            const lastDay = g.days[g.days.length - 1]
            const idx = dayIndex.get(lastDay)
            return idx !== undefined ? fullSeries[idx] : 0
        })

        const datasets: ChartDataset<"line", number[]>[] = [
            {
                label: "Длина стрика",
                data: streakPerGroup,
                borderColor: "#9a3412",
                backgroundColor: "#9a3412",
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 7,
            },
        ]

        return {
            data: {
                labels: groupsDays.map(g =>
                    formatGroupLabel(effectiveGroup, g.days[0])
                ),
                datasets,
            } as ChartData<"line", number[], string>,
            groupsDays,
            effectiveGroup,
        }
    }, [calendar, habit, habits, period, id, group])

    const maxValue = Math.max(2, ...data.datasets.flatMap(d => d.data)) + 1

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
            if (mainRef.current) {
                mainRef.current.scrollTo({ top: 0, behavior: "smooth" })
            }
        },
        plugins: {
            legend: { display: true },
            tooltip: {
                callbacks: {
                    label: ctx => `Стрик: ${ctx.raw} дн.`,
                },
            },
        },
        scales: {
            y: {
                display: !isMobile,
                beginAtZero: true,
                max: maxValue,
            },
        },
    }

    if (!data) return null

    return (
        <div className="doneDiagram" onContextMenu={e => e.stopPropagation()}>
            <Line data={data} options={options} />
        </div>
    )
}