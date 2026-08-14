import type { Calendar } from "../../../../../components/context/CalendarContext"
import { formatDateFromString } from "../../../../../components/ts/utils/dateToStr"

export type Stats = {
    compCount: number
    compProcent: string
    skipCount: number
    skipProcent: string

    streakCount: number
    streakMax: number
    streakMiddle: number

    breakMax: number
    breakMiddle: number

    allCount: number
}

export type StatsExtras = {
    streakMax: string
    breakMax: string
}

export function calculateOverallStats(
    calendar: Calendar[],
    days: string[],
    habitId?: string
): {
    stats: Stats
    extras: StatsExtras
} {
    let done = 0
    let skip = 0

    const doneDates = new Set(
        calendar
            .filter(c => !habitId || c.habitId === habitId)
            .filter(c => c.isDone === undefined || c.isDone === true)
            .map(c => c.date)
    )

    let bestStreak = 0
    let tempStreak = 0

    let maxBreak = 0
    let tempBreak = 0

    let bestStart = ""
    let bestEnd = ""

    let breakStart = ""
    let breakEnd = ""

    let tempBreakStart = ""
    let tempStreakStart = ""

    const streaks: number[] = []
    const breaks: number[] = []

    days.forEach(day => {
        const isDone = doneDates.has(day)

        if (isDone) {
            done++

            // Начало нового стрика
            if (tempStreak === 0) {
                tempStreakStart = day
            }

            tempStreak++

            // Закончился перерыв
            if (tempBreak > 0) {
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

            // Закончился стрик
            if (tempStreak > 0) {
                streaks.push(tempStreak)

                if (tempStreak > bestStreak) {
                    bestStreak = tempStreak
                    bestStart = tempStreakStart

                    // Последний день стрика,
                    // а не первый пропущенный
                    const previousDayIndex = days.indexOf(day) - 1
                    bestEnd = days[previousDayIndex]
                }
            }

            tempStreak = 0

            // Начало нового перерыва
            if (tempBreak === 0) {
                tempBreakStart = day
            }

            tempBreak++
        }
    })

    // Если последний день закончился стриком
    if (tempStreak > 0) {
        streaks.push(tempStreak)

        if (tempStreak > bestStreak) {
            bestStreak = tempStreak
            bestStart = tempStreakStart
            bestEnd = days[days.length - 1]
        }
    }

    // Если последний день закончился перерывом
    if (tempBreak > 0) {
        breaks.push(tempBreak)

        if (tempBreak > maxBreak) {
            maxBreak = tempBreak
            breakStart = tempBreakStart
            breakEnd = days[days.length - 1]
        }
    }

    /*
     * Стрики считаются только от 3 дней.
     */
    const longStreaks = streaks.filter(streak => streak >= 3)

    const streakCount = longStreaks.length

    const streakMiddle = longStreaks.length
        ? Math.round(
            longStreaks.reduce((sum, value) => sum + value, 0) /
            longStreaks.length
        )
        : 0

    /*
     * Максимальный стрик берём напрямую из bestStreak,
     * как в старой реализации.
     *
     * Если максимальный стрик меньше 3 дней,
     * он не считается стриком.
     */
    const streakMax = bestStreak >= 3
        ? bestStreak
        : 0

    const breakMiddle = breaks.length
        ? Math.round(
            breaks.reduce((sum, value) => sum + value, 0) /
            breaks.length
        )
        : 0

    const allCount = done + skip

    const compProcent = allCount
        ? Math.round((done / allCount) * 100)
        : 0

    const skipProcent = allCount
        ? Math.round((skip / allCount) * 100)
        : 0
    
    return {
        stats: {
            compCount: done,
            compProcent: `${compProcent}%`,

            skipCount: skip,
            skipProcent: `${skipProcent}%`,

            streakCount,
            streakMax,
            streakMiddle,

            breakMax: maxBreak,
            breakMiddle,

            allCount
        },

        extras: {
            streakMax:
                bestStreak >= 3 && bestStart && bestEnd
                    ? `${formatDateFromString(bestStart)} - ${formatDateFromString(bestEnd)}`
                    : "",

            breakMax:
                breakStart && breakEnd
                    ? `${formatDateFromString(breakStart)} - ${formatDateFromString(breakEnd)}`
                    : ""
        }
    }
}