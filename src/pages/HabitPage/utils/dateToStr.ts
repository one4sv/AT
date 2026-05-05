const WEEK_DAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
/**
 * Возвращает сегодняшнюю дату в формате YYYY-MM-DD
 */
export const todayStrFunc = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Форматирует Date в строку DD.MM.YYYY
 */
export const dateToStrFormat = (date: Date) => {
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

/**
 * Форматирует Date в формат календаря YYYY-MM-DD
 */
export const dateToCalendarFormat = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
/**
 * Возвращает время HH:MM
 * @param {Date} date Принимает дату
 */
export const timeToStr = (date: Date | string) => {
    const d = new Date(date)

    return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`
}

/**
 * Преобразует YYYY-MM-DD → DD.MM.YYYY
 * @param {string} date Принимает дату в виде строки
 */
export const formatDateFromString = (date: string) => {
    const [y, m, d] = date.split("-")
    return `${d}.${m}.${y}`
}

/**
 * Возвращает сокращённый день недели (пн, вт, ср...)
 * @param {string} day Принимает дату после преабразует в Date
 */
export const weekDay = (day: string) => {
    return new Date(day)
        .toLocaleDateString("ru-RU", { weekday: "short" })
        .slice(0, 2)
}
/**
 * 
 * @param {string} t время в формате чч:мм || чч.мм || чч
 * @returns {number} число минут 
 */
export const timeToMinutes = (t: string) => {
    if (!t) return 0
    const normalized = t.replace(".", ":")
    const [h, m] = normalized.split(":")
    return (Number(h) || 0) * 60 + (Number(m) || 0)
}

/**
 * 
 * @param {string} dateStr строка даты yyyy-mm-dd 
 * @returns строку формата 'Сегодня, дд.мм.гггг, дн'
 */
export const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);

    const normalize = (d: Date) => {
        const copy = new Date(d);
        copy.setHours(0, 0, 0, 0);
        return copy.getTime();
    };

    const today = new Date();
    const diffDays =
        (normalize(date) - normalize(today)) / 86400000;

    let prefix = "";

    if (diffDays === 0) prefix = "Сегодня";
    else if (diffDays === 1) prefix = "Завтра";
    else if (diffDays === -1) prefix = "Вчера";

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    const weekDay = WEEK_DAYS[date.getDay()];

    return `${prefix ? prefix + ", " : ""}${dd}.${mm}.${yyyy}, ${weekDay}`;
};