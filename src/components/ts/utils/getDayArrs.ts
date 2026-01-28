import type { Calendar } from "../../context/CalendarContext"
import type { Habit } from "../../context/HabitsContext"
import { isTimePassed, parseLocalDate, startOfToday } from "./dayArrHelpFuncs"

interface DayArrays {
  completedArr: Calendar[]
  skippedArr: Calendar[]
  willArr: Calendar[]
  nowArr: Calendar[]
}

// ===== main =====

export function getDayArrays(
  dateStr: string,
  calendar: Calendar[],
  habits: Habit[] | null,
  id: string | undefined,
  habit?: Habit
): DayArrays {

  const date = parseLocalDate(dateStr)
  const today = startOfToday()

  const completedArr = calendar.filter(
    c => c.date === dateStr && c.isDone && (id ? c.habitId === id : true)
  )

  const skippedArr: Calendar[] = []
  const willArr: Calendar[] = []
  const nowArr: Calendar[] = []

  const processHabit = (h: Habit) => {
    if (parseLocalDate(h.start_date) > date || ( h.end_date && parseLocalDate(h.end_date) < date)) return

    const match =
      h.periodicity === "everyday" ||
      (h.periodicity === "weekly" && h.chosen_days?.includes(date.getDay()))

    if (!match) return
    if (completedArr.some(c => Number(c.habitId) === h.id)) return

    const isPast = date < today
    const isFuture = date > today
    const isToday = date.getTime() === today.getTime()

    if (isFuture) {
      willArr.push({
        habitId: h.id.toString(),
        habitName: h.name,
        date: dateStr,
        isDone: false,
        is_archived:h.is_archived
      })
      return
    }

    if (isPast) {
      skippedArr.push({
        habitId: h.id.toString(),
        habitName: h.name,
        date: dateStr,
        isDone: false,
        is_archived:h.is_archived
      })
      return
    }

    // === TODAY ===
    if (isToday) {
      if (h.start_time && !isTimePassed(h.start_time)) {
        willArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false,
          is_archived:h.is_archived
        })
        return
      } else if (!h.end_time || isTimePassed(h.end_time)) {
        skippedArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false,
          is_archived:h.is_archived
        })
      } else if (h.start_time && h.end_time && !isTimePassed(h.end_time) && isTimePassed(h.start_time)) {
        nowArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false,
          is_archived:h.is_archived
        })
      }
    }
  }

  if (id) {
    const h = habits?.find(h => String(h.id) === id) ?? habit
    if (h) processHabit(h)
  } else {
    habits?.forEach(processHabit)
  }

  return { completedArr, skippedArr, willArr, nowArr }
}
