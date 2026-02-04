export const todayStrFunc = () => {
    return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
}
export const dateToStrFormat = (date:Date) => {
    return `${String(new Date(date).getDate()).padStart(2, "0")}.${String(new Date(date).getMonth() + 1).padStart(2, "0")}.${new Date(date).getFullYear()}`
}
export const timeToStr = (date: Date | string) => {
    const d = new Date(date)

    return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`
}