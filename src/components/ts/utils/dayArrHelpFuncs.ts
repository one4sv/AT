export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export const startOfToday = () => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export const isTimePassed = (endTime?: string) =>{
  if (!endTime) return true // времени нет → считаем прошедшим

  const [h, m] = endTime.split(":").map(Number)
  const now = new Date()

  const end = new Date()
  end.setHours(h, m, 0, 0)

  return now >= end
}