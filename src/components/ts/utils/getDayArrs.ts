import type { Calendar } from "../../context/CalendarContext"
import type { Habit } from "../../context/HabitsContext"

interface DayArrays {
  completedArr: Calendar[]
  skippedArr: Calendar[]
  willArr: Calendar[]
}

// ===== helpers =====

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

function isTimePassed(endTime?: string) {
  if (!endTime) return true // времени нет → считаем прошедшим

  const [h, m] = endTime.split(":").map(Number)
  const now = new Date()

  const end = new Date()
  end.setHours(h, m, 0, 0)

  return now >= end
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

  const processHabit = (h: Habit) => {
    if (parseLocalDate(h.start_date) > date) return

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
        isDone: false
      })
      return
    }

    if (isPast) {
      skippedArr.push({
        habitId: h.id.toString(),
        habitName: h.name,
        date: dateStr,
        isDone: false
      })
      return
    }

    // === TODAY ===
    if (isToday) {
      if (!h.end_time || isTimePassed(h.end_time)) {
        skippedArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false
        })
      } else {
        willArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false
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

  return { completedArr, skippedArr, willArr }
}
