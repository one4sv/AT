import type { Habit } from "../../../components/context/HabitsContext"

export const calculateUntilTimer = (habit: Habit, isEnded: boolean): string => {
    const now = new Date()

    const parseTime = (t?: string) => {
        if (!t) return { h: 0, m: 0 }
        const [h, m] = t.split(":").map(Number)
        return {
            h: isNaN(h) ? 0 : h,
            m: isNaN(m) ? 0 : m
        }
    }

    const buildDate = (base: Date, h: number, m: number) =>
        new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate(),
            h,
            m,
            0,
            0
        )

    const formatDiff = (target: Date) => {
        const diffSec = Math.floor((target.getTime() - now.getTime()) / 1000)
        if (diffSec <= 0) return "00:00:00"

        const d = Math.floor(diffSec / 86400)
        const h = Math.floor((diffSec % 86400) / 3600)
        const m = Math.floor((diffSec % 3600) / 60)
        const s = diffSec % 60

        const time = `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`

        return d > 0 ? `${d}d ${time}` : time
    }

    const { h: sH, m: sM } = parseTime(habit.start_time)
    const { h: eH, m: eM } = parseTime(habit.end_time)

    const startToday = buildDate(now, sH, sM)
    const endToday = buildDate(now, eH, eM)

    // Если таймер уже закончился, всегда показываем сколько до начала следующего периода
    if (isEnded) {
        if (now < startToday) {
            return "начало через: " + formatDiff(startToday)
        } else {
            // Если уже после начала сегодня, считаем до следующего дня (для daily)
            const tomorrow = new Date(startToday)
            tomorrow.setDate(tomorrow.getDate() + 1)
            return "начало через: " + formatDiff(tomorrow)
        }
    }

    // Обычная логика для разных периодичностей:

    if (habit.periodicity === "daily" || habit.periodicity === "everyday") {
        if (now < startToday)
            return "начало через: " + formatDiff(startToday)

        if (habit.end_time && now >= startToday && now < endToday)
            return "конец через: " + formatDiff(endToday)

        const tomorrow = new Date(startToday)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return "начало через: " + formatDiff(tomorrow)
    }

    if (
        habit.periodicity === "weekly" &&
        habit.chosen_days &&
        habit.chosen_days.length > 0
    ) {
        const todayDay = now.getDay()
        const isChosenToday = habit.chosen_days.includes(todayDay)

        if (isChosenToday) {
            if (now < startToday)
                return "начало через: " + formatDiff(startToday)

            if (habit.end_time && now >= startToday && now < endToday)
                return "конец через: " + formatDiff(endToday)
        }

        for (let i = 1; i <= 7; i++) {
            const d = new Date(now)
            d.setDate(now.getDate() + i)

            if (!habit.chosen_days.includes(d.getDay())) continue

            const nextStart = buildDate(d, sH, sM)
            return "начало через: " + formatDiff(nextStart)
        }
    }

    if (habit.periodicity === "sometimes") return ""

    if (now < startToday)
        return "начало через: " + formatDiff(startToday)

    if (habit.end_time) {
        if (now < endToday)
            return "конец через: " + formatDiff(endToday)
    }

    return "00:00:00"
}
