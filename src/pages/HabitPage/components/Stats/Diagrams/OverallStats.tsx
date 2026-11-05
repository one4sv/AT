import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
    const { t } = useTranslation("common")
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
        return <div className="overallStats overallStatsLoading" role="status" aria-label={t("statsUi.loading")}>
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="overallSkeleton skeletonBlock"/>)}
        </div>
    }

    const percent = Math.min(100, Math.max(0, parseInt(String(stats.compProcent), 10) || 0))
    const formatTimer = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) return minutes > 0 ? `${hours} ${t("statsUi.units.hours")} ${minutes} ${t("statsUi.units.minutes")}` : `${hours} ${t("statsUi.units.hours")}`
        if (minutes > 0) return secs > 0 ? `${minutes} ${t("statsUi.units.minutes")} ${secs} ${t("statsUi.units.seconds")}` : `${minutes} ${t("statsUi.units.minutes")}`
        return `${secs} ${t("statsUi.units.seconds")}`
    }

    return (
        <div className="overallStats">
            <div className="overallSummary">
                <div className="overallRing" style={{ "--progress": `${percent}%` } as CSSProperties}>
                    <div className="overallRingCore">
                        <strong>{percent}%</strong>
                        <span>{t("statsUi.completed")}</span>
                    </div>
                </div>
                <div className="overallSummaryDetails">
                    <div className="overallSummaryTitle">{t("statsUi.progress")}</div>
                    <div className="overallSummarySub">{t("statsUi.allTime")}</div>
                    <div className="overallSummaryNumbers">
                        <div><CalendarCheckIcon size={19}/><strong>{stats.compCount}</strong><span>{t("statsUi.completed")}</span></div>
                        <div><ChartLineUpIcon size={19}/><strong>{stats.skipCount}</strong><span>{t("statsUi.skipped")}</span></div>
                        <div><FireIcon size={19}/><strong>{stats.streakMax}</strong><span>{t("statsUi.bestStreak")}</span></div>
                    </div>
                    <div className="overallProgressTrack"><div style={{ width: `${percent}%` }}/></div>
                    <span className="overallSummaryFootnote">{t("statsUi.totalDays", { count: stats.allCount })}</span>
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
                        return { label: t(`statsUi.metrics.${prop.value}`), value, extra }
                    }))
                    return (
                        <button type="button" key={c.value}
                            className={`overallCard overallCard--${c.value}`}
                            disabled={!canOpen}
                            onClick={() => {
                                if (!canOpen) return
                                setSlide({ label: t(`statsUi.cards.${c.value}`), value: c.value, slide: true })
                            }}>
                            <div className="overallCardHeader">
                                <span>{t(`statsUi.cards.${c.value}`)}</span>
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
                onClick={() => setSlide({ label: t("statsUi.cards.comp"), value: "comp", slide: true })}>
                <ChartLineUpIcon size={20}/> {t("statsUi.details")} <ArrowUpRightIcon size={19}/>
            </button>
        </div>
    )
}
