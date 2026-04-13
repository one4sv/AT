import type { Calendar } from "../../context/CalendarContext"
import type { Habit } from "../../context/HabitsContext"
import { isTimePassed, parseLocalDate, startOfToday } from "./dayArrHelpFuncs"

interface DayArrays {
  completedArr: Calendar[]
  skippedArr: Calendar[]
  willArr: Calendar[]
  nowArr: Calendar[]
}

/**
 * Формирует массивы состояний привычек для конкретного дня.
 * Функция анализирует календарные записи и список привычек и
 * распределяет их по четырём категориям:
 * - completedArr — выполненные привычки
 * - skippedArr — пропущенные привычки
 * - willArr — запланированные на будущее
 * - nowArr — доступные для выполнения прямо сейчас
 *
 * @param {string} dateStr Дата в формате строки (например `"2026-04-03"`), для которой вычисляется состояние привычек.
 *
 * @param {Calendar[]} calendar Массив записей календаря с отметками выполнения привычек.
 *
 * @param {Habit[] | null} habits Список всех привычек пользователя.
 *
 * @param {string | undefined} id Необязательный id привычки.  
 * Если передан — расчёт выполняется только для одной привычки.
 *
 * @param {Habit} [habit] Объект привычки (используется как fallback, если привычка не найдена в `habits`).
 *
 * @param {boolean} [usest] Флаг, разрешающий учитывать привычки с периодичностью `"sometimes"`.
 *
 * @returns {DayArrays} Объект с 4 массивами привычек
 */
export function getDayArrays(
  dateStr: string,
  calendar: Calendar[],
  habits: Habit[] | null,
  id: string | undefined,
  habit?: Habit,
  usest?:boolean
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
      (h.periodicity === "weekly" && h.chosen_days?.includes(date.getDay())) ||
      (usest && h.periodicity === "sometimes")

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
        ongoing:h.ongoing
      })
      return
    }

    if (isPast) {
      skippedArr.push({
        habitId: h.id.toString(),
        habitName: h.name,
        date: dateStr,
        isDone: false,
        ongoing:h.ongoing
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
          ongoing:h.ongoing
        })
        return
      } else if (!h.end_time || isTimePassed(h.end_time)) {
        skippedArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false,
          ongoing:h.ongoing
        })
      } else if (h.start_time && h.end_time && !isTimePassed(h.end_time) && isTimePassed(h.start_time)) {
        nowArr.push({
          habitId: h.id.toString(),
          habitName: h.name,
          date: dateStr,
          isDone: false,
          ongoing:h.ongoing
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
