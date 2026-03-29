export function getDateRange(filter: string, startDate?: string) {
    const today = new Date()
    const end = new Date(today)
    end.setDate(end.getDate() - 1)
    let start = new Date(end)
    switch (filter) {
        case "week":
            start.setDate(end.getDate() - 6)
            break
        case "thirty":
            start.setDate(end.getDate() - 29)
            break
        case "ninety":
            start.setDate(end.getDate() - 89)
            break
        case "year":
            start.setDate(end.getDate() - 364)
            break
        case "all":
            if (startDate) start = new Date(startDate)
            break
    }
    return { start, end }
}

export function generateDays(start: Date, end: Date) {
    const days: string[] = []
    const d = new Date(start)
    while (d <= end) {
        days.push(d.toISOString().slice(0,10))
        d.setDate(d.getDate() + 1)
    }
    return days
}
export function groupDays(days: string[], type: string) {

    if (type === "day") {
        return days.map(day => ({ label: day.slice(5), days: [day] }))
    }

    const map: Record<string, string[]> = {}

    days.forEach(day => {

        const d = new Date(day)
        let key = ""

        if (type === "week") {

            const week = Math.ceil(d.getDate() / 7)
            key = `${d.getFullYear()}-${d.getMonth() + 1}-W${week}`

        } else if (type === "month") {

            key = `${d.getFullYear()}-${d.getMonth() + 1}`
        }

        if (!map[key]) map[key] = []
        map[key].push(day)
    })

    return Object.entries(map).map(([label, days]) => ({ label, days }))
}
export function getMonday(date: string) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0,10)
}

export function getMonthStart(date: string){
    const d = new Date(date)
    d.setDate(1)
    return d.toISOString().slice(0,10)
}