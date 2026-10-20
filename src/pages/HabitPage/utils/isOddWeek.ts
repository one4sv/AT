export const isOddWeek = (weekStart: string | null, date: Date) => {
    const start = new Date(`${weekStart || "2025-09-01"}T00:00:00Z`);
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(target.getTime())) return true;
    const monday = (day: Date) => {
        const weekday = day.getUTCDay();
        day.setUTCDate(day.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));
        return day.getTime();
    };
    const weekNumber = Math.round((monday(target) - monday(start)) / 604800000);
    return weekNumber % 2 === 0;
};
