import type { Calendar } from "../../../components/context/CalendarContext"

export function getLastNDays(days: string[], n = 30): string[] {
    if (days.length <= n) return days
    return days.slice(-n)
}

export function getDoneSeries(
    calendar: Calendar[],
    days: string[],
    habitId?: string
): number[] {
    const doneDates = new Set(
        calendar
            .filter(c => !habitId || c.habitId === habitId)
            .filter(c => c.isDone === undefined || c.isDone === true)
            .map(c => c.date)
    )
    return days.map(day => (doneDates.has(day) ? 1 : 0))
}

export function getStreakLengthSeries(
    calendar: Calendar[],
    days: string[],
    habitId?: string
): number[] {
    const doneDates = new Set(
        calendar
            .filter(c => !habitId || c.habitId === habitId)
            .filter(c => c.isDone === undefined || c.isDone === true)
            .map(c => c.date)
    )

    const result: number[] = []
    let current = 0

    for (const day of days) {
        if (doneDates.has(day)) {
            current++
        } else {
            current = 0
        }
        result.push(current)
    }
    return result
}

export function getBreakLengthSeries(
    calendar: Calendar[],
    days: string[],
    habitId?: string
): number[] {
    const doneDates = new Set(
        calendar
            .filter(c => !habitId || c.habitId === habitId)
            .filter(c => c.isDone === undefined || c.isDone === true)
            .map(c => c.date)
    )

    const result: number[] = []
    let current = 0

    for (const day of days) {
        if (!doneDates.has(day)) {
            current++
        } else {
            current = 0
        }
        result.push(current)
    }
    return result
}
export function getCardMiniChartData(
    cardValue: string,
    calendar: Calendar[],
    allDays: string[],
    habitId?: string
): { values: number[] } | null {
    const days = getLastNDays(allDays, 30)
    if (days.length < 2) return null

    switch (cardValue) {
        case "comp":
            return { values: getDoneSeries(calendar, days, habitId) }
        case "streak":
            return { values: getStreakLengthSeries(calendar, days, habitId) }
        case "break":
            return { values: getBreakLengthSeries(calendar, days, habitId) }
        default:
            return null
    }
}