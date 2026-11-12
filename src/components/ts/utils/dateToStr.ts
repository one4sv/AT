import i18n from "../../../i18n/i18n";

/** IANA zone used for absolute timestamps and the user's current calendar day. */
export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
export const resolveTimeZone = (preference: string = "auto") => {
    const zone = !preference || preference === "auto" ? browserTimeZone() : preference;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zone });
        return zone;
    } catch {
        return browserTimeZone();
    }
};
export const appTimeZone = () => resolveTimeZone(
    typeof document !== "undefined" ? document.documentElement.dataset.timeZone : "auto"
);
const isAmerican = () => typeof document !== "undefined" && document.documentElement.dataset.dateFormat === "american";
const isTwelveHours = () => typeof document !== "undefined" && document.documentElement.dataset.timeFormat === "twelve";
const displayParts = (y: string, m: string, d: string) => isAmerican() ? `${m}.${d}.${y}` : `${d}.${m}.${y}`;
const localFields = (date: Date, timeZone = appTimeZone()) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date);
    const get = (type: string) => parts.find(part => part.type === type)?.value || "00";
    return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
};
export const dateInAppZone = (value: Date | string) => {
    const { year, month, day } = localFields(new Date(value));
    return `${year}-${month}-${day}`;
};
export const clockInAppZone = (value: Date = new Date()) => {
    const { hour, minute } = localFields(value);
    return `${hour}:${minute}`;
};
/** Add calendar days without DST or browser-local timezone shifts. */
export const shiftCalendarDay = (day: string, offset: number) => {
    const [year, month, date] = day.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
};
export const formatClock = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
    if (!match || !isTwelveHours()) return value;
    const hour = Number(match[1]);
    if (hour > 23) return value;
    return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
};
export const appDateLocale = () => i18n.resolvedLanguage?.startsWith("en") ? (isAmerican() ? "en-US" : "en-GB") : "ru-RU";

/** Calendar-only dates (YYYY-MM-DD) are not instants and must never shift timezone. */
const dateOnly = (value: Date | string): value is string =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export const formatAppDate = (date: Date | string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) => {
    const calendar = dateOnly(date);
    const parsed = calendar ? new Date(date + "T12:00:00Z") : new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    if (isAmerican() && !i18n.resolvedLanguage?.startsWith("en") &&
        options.day === "2-digit" && options.month === "2-digit" && options.year === "numeric") {
        const parts = calendar ? date.split("-") : dateInAppZone(parsed).split("-");
        return `${parts[1]}.${parts[2]}.${parts[0]}`;
    }
    return parsed.toLocaleDateString(appDateLocale(), { ...options, timeZone: calendar ? "UTC" : appTimeZone() });
};
export const formatAppTime = (date: Date | string, seconds = false) =>
    new Date(date).toLocaleTimeString(appDateLocale(), {
        timeZone: appTimeZone(),
        hour: "2-digit",
        minute: "2-digit",
        ...(seconds ? { second: "2-digit" } : {}),
        hour12: isTwelveHours()
    });

/** Today is the date at the selected IANA timezone, not the OS timezone. */
export const todayStrFunc = () => dateInAppZone(new Date());
export const relativePlanDay = (day: string, t: (key: string) => string) => {
    if (day === todayStrFunc()) return t("chatUi.today");
    if (day === shiftCalendarDay(todayStrFunc(), 1)) return t("sideMenu.tomorrow");
    return "";
};
export const dateToStrFormat = (date: Date) => {
    const { year, month, day } = localFields(date);
    return displayParts(year, month, day);
};
/** Existing calendar-grid dates are constructed in local civil time; preserve that contract. */
export const dateToCalendarFormat = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const timeToStr = (date: Date | string) => formatClock(clockInAppZone(new Date(date)));
export const formatDateFromString = (date: string) => {
    const [y, m, d] = date.split("-");
    return displayParts(y, m, d);
};
export const formatShortDateFromString = (date: string) => {
    const [, m, d] = date.split("-");
    return isAmerican() ? `${m}.${d}` : `${d}.${m}`;
};
export const weekDay = (day: string) => {
    const date = dateOnly(day) ? new Date(day + "T12:00:00Z") : new Date(day);
    return date.toLocaleDateString(i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU",
        { weekday: "short", timeZone: dateOnly(day) ? "UTC" : appTimeZone() }).slice(0, 2);
};
export const timeToMinutes = (t: string) => {
    if (!t) return 0;
    const normalized = t.replace(".", ":");
    const [h, m] = normalized.split(":");
    return (Number(h) || 0) * 60 + (Number(m) || 0);
};
export const formatDateLabel = (dateStr: string) => {
    const today = todayStrFunc();
    let prefix = "";
    if (dateStr === today) prefix = i18n.t("chatUi.today", { ns: "common" });
    else if (dateStr === shiftCalendarDay(today, 1)) prefix = i18n.t("sideMenu.tomorrow", { ns: "common" });
    else if (dateStr === shiftCalendarDay(today, -1)) prefix = i18n.t("chatUi.yesterdayShort", { ns: "common" });
    const date = new Date(dateStr + "T12:00:00Z");
    const dateLabel = formatAppDate(dateStr);
    const weekday = date.toLocaleDateString(appDateLocale(), { weekday: "short", timeZone: "UTC" }).replace(".", "");
    return `${prefix ? prefix + ", " : ""}${dateLabel}, ${weekday}`;
};
export const formatTime = (start_time: string, end_time: string) => {
    if (start_time && end_time) return `${formatClock(start_time)} - ${formatClock(end_time)}:`;
    if (start_time) return `${i18n.resolvedLanguage?.startsWith("en") ? "from" : "с"} ${formatClock(start_time)}:`;
    if (end_time) return `${i18n.resolvedLanguage?.startsWith("en") ? "until" : "до"} ${formatClock(end_time)}:`;
    return "";
};
