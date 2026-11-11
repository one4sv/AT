import type { DayEntry } from "../../../../components/ts/utils/dayTimeline";

export type OverviewFocus = {
    kind: "current" | "dayStart";
    entry: DayEntry;
    more: number;
};

export function getOverviewFocus(entries: DayEntry[], selectedDay: string, today: string, clock: string): OverviewFocus | null {
    if (selectedDay < today) return null;
    const available = entries.filter(entry => !entry.completed && entry.plan?.status !== "canceled");
    if (selectedDay === today) {
        const ongoing = available.filter(entry => entry.start && entry.start <= clock &&
            (!entry.end || entry.end >= clock));
        if (ongoing.length) return { kind: "current", entry: ongoing[0], more: ongoing.length - 1 };
    }

    const first = available.find(entry => entry.start &&
        (selectedDay > today || entry.start > clock));
    if (first) return { kind: "dayStart", entry: first, more: 0 };
    if (selectedDay > today && available.length) {
        return { kind: "dayStart", entry: available[0], more: 0 };
    }
    return null;
}
