import type { Calendar } from "../../context/CalendarContext"
import type { Habit } from "../../context/HabitsContext"

interface DayArrays {
    completedArr: Calendar[]
    skippedArr: Calendar[]
    willArr: Calendar[]
}

export function getDayArrays(
    dateStr: string,
    calendar: Calendar[],
    habits: Habit[] | null,
    id?: string
): DayArrays {
    const date = new Date(dateStr)
    const completedArr = calendar.filter(c => c.date === dateStr)
    const willArr: Calendar[] = []
    const skippedArr: Calendar[] = []
    const today = new Date()

    if (habits) {
        if (id) {
            const h = habits.find(h => String(h.id) === id)
            if (h && new Date(h.start_date) <= date) {
                const match =
                    h.periodicity === "everyday" ||
                    (h.periodicity === "weekly" && h.chosen_days?.includes(date.getDay()))

                if (date > today && match && !completedArr.some(c => c.date === dateStr && Number(c.habitId) === h.id)) {
                    willArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr })
                }
                if (date <= today && match && !completedArr.some(c => c.date === dateStr && Number(c.habitId) === h.id)) {
                    skippedArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr })
                }
            }
        } else {
            habits.forEach(h => {
                if (new Date(h.start_date) <= date) {
                    const match =
                        h.periodicity === "everyday" ||
                        (h.periodicity === "weekly" && h.chosen_days?.includes(date.getDay()))
                if (date > today && match) {
                    willArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr })
                }
                if (
                    date <= today &&
                    match &&
                    !completedArr.some(c => c.date === dateStr && Number(c.habitId) === h.id)
                ) {
                    skippedArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr })
                }
                }
            })
        }
    }

    return { completedArr, skippedArr, willArr }
}
