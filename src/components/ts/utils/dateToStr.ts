import i18n from "../../../i18n/i18n";
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
 * Преобразует YYYY-MM-DD → DD.MM.YYYY
 * @param {string} date Принимает дату в виде строки
 */
export const formatShortDateFromString = (date: string) => {
    const [, m, d] = date.split("-")
    return `${d}.${m}`
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

    if (diffDays === 0) prefix = i18n.t("chatUi.today", { ns: "common" });
    else if (diffDays === 1) prefix = i18n.t("sideMenu.tomorrow", { ns: "common" });
    else if (diffDays === -1) prefix = i18n.t("chatUi.yesterdayShort", { ns: "common" });

    const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU";
    const dateLabel = date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
    const weekday = date.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");

    return `${prefix ? prefix + ", " : ""}${dateLabel}, ${weekday}`;
};

/**
 * возвращает строку ввида чч:мм - чч:мм без преобразований, получает время в формате чстроки
 * @param start_time стартовое время
 * @param end_time время окончания
 * @returns строку ввида чч:мм - чч:мм, с чч:мм, до чч:мм
 */
export const formatTime = (start_time: string, end_time: string ) => {
    if (start_time && end_time)
        return `${start_time} - ${end_time}:`
    if (start_time) return `с ${start_time}:`
    if (end_time) return `до ${end_time}:`
    return ""
}