import { clockInAppZone, todayStrFunc } from "./dateToStr";

export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export const startOfToday = () => {
  const t = new Date(todayStrFunc() + "T00:00:00")
  t.setHours(0, 0, 0, 0)
  return t
}

export const isTimePassed = (endTime?: string) =>{
  if (!endTime) return true // времени нет → считаем прошедшим

  return clockInAppZone() >= endTime.slice(0, 5)
}