import type { Calendar } from "../../context/CalendarContext"
import type { Habit } from "../../context/HabitsContext"

interface DayArrays {
    completedArr: Calendar[]
    skippedArr: Calendar[]
    willArr: Calendar[]
}

export function getDayArrays( dateStr: string, calendar: Calendar[], habits: Habit[] | null, id:string | undefined, habit?: Habit | undefined): DayArrays {
    const date = new Date(dateStr)
    const completedArr = calendar.filter(c => c.date === dateStr && c.isDone)
    const willArr: Calendar[] = []
    const skippedArr: Calendar[] = []
    const today = new Date()

    if (id) {
        const h = habits?.find(h => String(h.id) === id)
        if (h) {
            if (new Date(h.start_date) <= date) {
                const match =
                    h.periodicity === "everyday" ||
                    (h.periodicity === "weekly" && h.chosen_days?.includes(date.getDay()))

                if (date <= today && match && !completedArr.some(c => Number(c.habitId) === h.id)) {
                skippedArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr, isDone: false })
                }
                if (date > today && match && !completedArr.some(c => Number(c.habitId) === h.id)) {
                willArr.push({ habitId: h.id.toString(), habitName: h.name, date: dateStr, isDone: false })
                }
            }
        } else {
            if (habit && new Date(habit.start_date) <= date) {
                const match =
                    habit.periodicity === "everyday" ||
                    (habit.periodicity === "weekly" && habit.chosen_days?.includes(date.getDay()))

                if (date <= today && match && !completedArr.some(c => Number(c.habitId) === habit.id)) {
                skippedArr.push({ habitId: habit.id.toString(), habitName: habit.name, date: dateStr, isDone: false })
                }
                if (date > today && match && !completedArr.some(c => Number(c.habitId) === habit.id)) {
                willArr.push({ habitId: habit.id.toString(), habitName: habit.name, date: dateStr, isDone: false })
                }
            }
        }
    }
    else {
        habits?.forEach(h => {
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

    return { completedArr, skippedArr, willArr }
}
