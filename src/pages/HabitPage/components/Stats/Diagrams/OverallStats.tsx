import { useParams } from "react-router-dom"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { cards } from "../../../utils/filters"
import { useHabits } from "../../../../../components/hooks/HabitsHook"
import { generateDays, getDateRange } from "../../../utils/DiagramDate"
import { MiniLine } from "./MiniChart"
import { getCardMiniChartData } from "../../../utils/diagramsFuncs"
import { calculateOverallStats } from "./CalculateOverallStats"
import { useMemo, type CSSProperties } from "react"
import { ArrowUpRightIcon, CalendarCheckIcon, FireIcon, ChartLineUpIcon } from "@phosphor-icons/react"

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

    const startDate = useMemo(() => {
        if (id && habit) return habit.start_date
        if (!habits?.length) return ""
        return habits.map(h => new Date(h.start_date))
            .sort((a, b) => a.getTime() - b.getTime())[0].toISOString()
    }, [id, habit, habits])

    const days = useMemo(() => {
        const { start, end } = getDateRange("all", startDate)
        return generateDays(start, end)
    }, [startDate])

    const { stats, extras } = useMemo(() => {
        if (!id) return calculateOverallStats(calendar, days)
        return overallStats ?? { stats: null, extras: { streakMax: "", breakMax: "" } }
    }, [id, calendar, days, overallStats])

    if (!stats) {
        return <div className="overallStats overallStatsLoading" role="status" aria-label="Загрузка статистики">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="overallSkeleton skeletonBlock"/>)}
        </div>
    }

    const percent = Math.min(100, Math.max(0, parseInt(String(stats.compProcent), 10) || 0))
    const formatTimer = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`
        if (minutes > 0) return secs > 0 ? `${minutes} мин ${secs} с` : `${minutes} мин`
        return `${secs} с`
    }

    return (
        <div className="overallStats">
            <div className="overallSummary">
                <div className="overallRing" style={{ "--progress": `${percent}%` } as CSSProperties}>
                    <div className="overallRingCore">
                        <strong>{percent}%</strong>
                        <span>Выполнено</span>
                    </div>
                </div>
                <div className="overallSummaryDetails">
                    <div className="overallSummaryTitle">Ваш прогресс</div>
                    <div className="overallSummarySub">За всё время активности</div>
                    <div className="overallSummaryNumbers">
                        <div><CalendarCheckIcon size={19}/><strong>{stats.compCount}</strong><span>выполнено</span></div>
                        <div><ChartLineUpIcon size={19}/><strong>{stats.skipCount}</strong><span>пропущено</span></div>
                        <div><FireIcon size={19}/><strong>{stats.streakMax}</strong><span>лучший стрик</span></div>
                    </div>
                    <div className="overallProgressTrack"><div style={{ width: `${percent}%` }}/></div>
                    <span className="overallSummaryFootnote">Всего дней в статистике: {stats.allCount}</span>
                </div>
            </div>
            <div className="overallCards">
                {cards.filter(c => {
                    if (c.value === "comp" || c.value === "all") return false
                    if (["counter", "timer", "schedule"].includes(c.value)) {
                        return !!id && habitSettings?.metric_type === c.value
                    }
                    return true
                }).map(c => {
                    const mini = ["streak", "break"].includes(c.value)
                        ? getCardMiniChartData(c.value, calendar, days, id)
                        : null
                    const canOpen = c.value === "streak" || c.value === "break"
                    const values = c.props.flatMap(group => group.props.map(prop => {
                        const raw = stats[prop.value as keyof typeof stats]
                        const value = habitSettings?.metric_type === "timer" &&
                            ["fullTimer", "maxTimer", "middleTimer"].includes(prop.value) &&
                            typeof raw === "number" ? formatTimer(raw) : raw ?? "—"
                        const extra = prop.value === "streakMax" ? extras.streakMax :
                            prop.value === "breakMax" ? extras.breakMax : ""
                        return { label: prop.label, value, extra }
                    }))
                    return (
                        <button type="button" key={c.value}
                            className={`overallCard overallCard--${c.value}`}
                            disabled={!canOpen}
                            onClick={() => {
                                if (!canOpen) return
                                setSlide({ label: c.label, value: c.value, slide: true })
                            }}>
                            <div className="overallCardHeader">
                                <span>{c.label}</span>
                                {canOpen && <ArrowUpRightIcon size={20}/>}
                            </div>
                            <div className="overallCardValues">
                                {values.map(({ label, value, extra }) => (
                                    <div className="overallMetricRow" key={label}>
                                        <span>{label}</span>
                                        <strong>{value}</strong>
                                        {extra && <small>{extra}</small>}
                                    </div>
                                ))}
                            </div>
                            {mini && <MiniLine values={mini.values} type={c.value as "streak" | "break"}/>}
                        </button>
                    )
                })}
            </div>
            <button type="button" className="overallDetailButt"
                onClick={() => setSlide({ label: "Выполнения", value: "comp", slide: true })}>
                <ChartLineUpIcon size={20}/> Подробная статистика выполнений <ArrowUpRightIcon size={19}/>
            </button>
        </div>
    )
}
