import type { Habit } from "../../context/HabitsContext";
import type { habitTimer } from "../../context/TheHabitContext"; // или где у тебя лежит тип

/**
 * Возвращает отформатированное время таймера (сколько уже прошло)
 */
export function calculateTimerElapsed(currentTimer: habitTimer | null, isHistorical: boolean = false): string {
    if (!currentTimer) {
        return "00:00:00";
    }

    const now = Date.now();
    const started = currentTimer.started_at.getTime();

    let effectiveEnd: number;

    if (currentTimer.status === "ended" || isHistorical) {
        effectiveEnd = currentTimer.end_at.getTime();
    } else if (currentTimer.status === "paused") {
        const openPause = currentTimer.pauses.find(p => p.end === null);
        effectiveEnd = openPause ? new Date(openPause.start).getTime() : now;
    } else {
        effectiveEnd = now;
    }

    const total = effectiveEnd - started;

    let sumPauses = 0;
    currentTimer.pauses.forEach(p => {
        if (p.end) {
            sumPauses += new Date(p.end).getTime() - new Date(p.start).getTime();
        }
    });

    const elapsedMs = Math.max(0, total - sumPauses);

    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Возвращает "until" — сколько осталось до конца привычки (для сегодняшнего дня)
 */
export function calculateUntilTimer(habit: Habit, isEnded: boolean): string {
    if (isEnded) return "";
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

        return d > 0 ? `${d} д. ${time}` : time
    }

    const { h: sH, m: sM } = parseTime(habit.start_time)
    const { h: eH, m: eM } = parseTime(habit.end_time)

    const startToday = buildDate(now, sH, sM)
    const endToday = buildDate(now, eH, eM)
    const hasEnd = !!habit.end_time
    const dayEnded = hasEnd && now >= endToday

    const canUseToday = !isEnded && !dayEnded


    if (habit.periodicity === "everyday") {
        if (canUseToday) {
            if (now < startToday)
                return "начало через: " + formatDiff(startToday)

            if (hasEnd && now >= startToday && now < endToday)
                return "конец через: " + formatDiff(endToday)
        }

        // иначе ищем завтра
        const tomorrow = new Date(startToday)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return "начало через: " + formatDiff(tomorrow)
    }

    if (
        habit.periodicity === "weekly" &&
        habit.chosen_days?.length
    ) {
        const todayDay = now.getDay()
        const isChosenToday = habit.chosen_days.includes(todayDay)

        if (isChosenToday && canUseToday) {
            if (now < startToday)
                return "начало через: " + formatDiff(startToday)

            if (hasEnd && now >= startToday && now < endToday)
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

    return "00:00:00"
}