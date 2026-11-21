import type { QuickCreateDraft } from "./quickCreateCommand";

export interface SavedMessageSuggestion {
    draft: QuickCreateDraft;
    start: number;
    end: number;
}

// A conservative, local parser. Never sends data or creates an activity/plan.
const numericDate = /^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?(?=\s|$)/u;
const namedDate = /^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?(?=\s|$)/iu;
const monthNames = "января февраля марта апреля мая июня июля августа сентября октября ноября декабря".split(" ");
const englishMonths = "january february march april may june july august september october november december".split(" ");

function timeValue(text: string): string | null {
    const match = /^(\d{1,2})(?:[.:](\d{2}))?$/.exec(text.trim());
    if (!match || +match[1] > 23 || +(match[2] || 0) > 59) return null;
    return match[1].padStart(2, "0") + ":" + (match[2] || "00");
}
function dateValue(year: number, month: number, day: number): string | null {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

/** today and nowTime are in the configured AT timezone, not the OS timezone. */
export function parseSavedMessageSuggestion(content: string, today: string, nowTime: string): SavedMessageSuggestion | null {
    const text = content.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !/^\d{2}:\d{2}$/.test(nowTime) ||
        !text || text.length > 220 || /[\r\n]/.test(text) ||
        text.startsWith("/") || /(?:https?:\/\/|www\.)/i.test(text)) return null;

    const start = content.indexOf(text);
    const end = start + text.length;
    const recurring = /^(?:каждый день|ежедневно|every day|daily)\s+(.+?)(?:\s+(?:с|from)\s+(\d{1,2}(?:[.:]\d{2})?)\s*(?:до|to|[-–—])\s*(\d{1,2}(?:[.:]\d{2})?))?$/iu.exec(text);
    if (recurring) {
        const name = recurring[1].trim();
        const from = recurring[2] ? timeValue(recurring[2]) : null;
        const to = recurring[3] ? timeValue(recurring[3]) : null;
        if (!name || name.length > 40 || (recurring[2] && !from) || (recurring[3] && !to)) return null;
        return { start, end, draft: { kind: "habit", name, periodicity: "everyday",
            ...(from ? {startTime: from} : {}), ...(to ? {endTime: to} : {}) } };
    }

    const digit = numericDate.exec(text);
    const word = digit ? null : namedDate.exec(text);
    const match = digit || word;
    if (!match) return null;
    const day = +match[1];
    const month = digit ? +match[2] :
        (monthNames.indexOf(match[2].toLowerCase()) >= 0
            ? monthNames.indexOf(match[2].toLowerCase()) + 1 : englishMonths.indexOf(match[2].toLowerCase()) + 1);
    const year = +(match[3] || today.slice(0, 4));
    const date = dateValue(year, month, day);
    if (!date || date < today) return null;

    let name = text.slice(match[0].length).trim();
    let time: string | null = null;
    const leadingTime = /^(?:(?:в|at)\s+)?(\d{1,2}[.:]\d{2})\s+(.+)$/iu.exec(name);
    if (leadingTime) {
        time = timeValue(leadingTime[1]);
        name = leadingTime[2].trim();
        if (!time) return null;
    } else {
        const trailingTime = /^(.+?)\s+(?:в|at)\s+(\d{1,2}[.:]\d{2})$/iu.exec(name);
        if (trailingTime) {
            time = timeValue(trailingTime[2]);
            name = trailingTime[1].trim();
            if (!time) return null;
        }
    }
    if (!name || name.length > 160 || (date === today && time && time <= nowTime)) return null;
    return { start, end, draft: {kind: "plan", name, date, ...(time ? {startTime: time} : {})} };
}
