/** Display the default plan reminder's clock time in the plan's time zone. */
export function planReminderClock(
    planDate: string,
    startTime: string | null | undefined,
    timezone: string | undefined,
    minutesBefore: number
): string | null {
    if (!timezone || !Number.isSafeInteger(minutesBefore) || minutesBefore < 0 || minutesBefore > 10080) return null;
    const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(planDate);
    const time = /^(\d{2}):(\d{2})/.exec(startTime || "09:00");
    if (!date || !time) return null;
    const [year, month, day] = date.slice(1).map(Number);
    const [hour, minute] = time.slice(1).map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
    const civilTime = Date.UTC(year, month - 1, day, hour, minute);
    try {
        const zoned = new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hourCycle: "h23"
        });
        let instant = civilTime;
        for (let step = 0; step < 4; step++) {
            const parts = Object.fromEntries(zoned.formatToParts(instant)
                .filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
            const localAtInstant = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
            const delta = civilTime - localAtInstant;
            if (!delta) break;
            instant += delta;
        }
        return new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
        }).format(new Date(instant - minutesBefore * 60000));
    } catch {
        return null;
    }
}
