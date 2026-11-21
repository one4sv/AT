export type QuickCreateDraft = {
    kind: "habit" | "plan";
    name?: string;
    description?: string;
    periodicity?: "everyday" | "weekly" | "cycle" | "sometimes";
    startTime?: string;
    endTime?: string;
    date?: string;
    tag?: string;
};

const fieldPattern = /(?:^|[;\n]\s*|\s+)(название|name|описание|description|периодичность|periodicity|дата|date|время|time|начало|start|конец|end|тег|tag)\s*:\s*/giu;

function normalizeTime(raw: string): string | undefined {
    const match = raw.trim().match(/^(\d{1,2})(?::([0-5]\d))?$/);
    if (!match) return undefined;
    const hour = Number(match[1]);
    if (hour > 23) return undefined;
    return String(hour).padStart(2, "0") + ":" + (match[2] || "00");
}

function normalizeDate(raw: string): string | undefined {
    const input = raw.trim();
    let year: number;
    let month: number;
    let day: number;
    let explicitYear = false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        [year, month, day] = input.split("-").map(Number);
        explicitYear = true;
    } else {
        const match = input.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{4}))?$/);
        if (!match) return undefined;
        day = Number(match[1]);
        month = Number(match[2]);
        year = match[3] ? Number(match[3]) : new Date().getFullYear();
        explicitYear = !!match[3];
    }
    const valid = (y: number) => {
        const date = new Date(y, month - 1, day);
        return date.getFullYear() === y && date.getMonth() === month - 1 && date.getDate() === day;
    };
    if (!valid(year)) return undefined;
    if (!explicitYear && new Date(year, month - 1, day, 23, 59, 59) < new Date()) year += 1;
    if (!valid(year)) return undefined;
    return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

export function quickCommandOnSpace(text: string): "act" | "plan" | null {
    const match = /^\s*\/(act|plan) $/i.exec(text);
    return match ? match[1].toLowerCase() as "act" | "plan" : null;
}

export function isQuickCreateCommand(text: string): boolean {
    return /^\s*\/(act|plan)(?=\s|$)/i.test(text);
}

export function parseQuickCreateCommand(text: string): QuickCreateDraft | null {
    const command = text.trimStart().match(/^\/(act|plan)(?=\s|$)/i);
    if (!command) return null;

    const rest = text.trimStart().slice(command[0].length);
    const values = new Map<string, string>();
    const matches = [...rest.matchAll(fieldPattern)];
    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];
        const from = (current.index ?? 0) + current[0].length;
        const to = next?.index ?? rest.length;
        values.set(current[1].toLocaleLowerCase(), rest.slice(from, to).replace(/[;\n\s]+$/g, "").trim());
    }
    const get = (...keys: string[]) => keys.map(key => values.get(key)).find(value => value !== undefined && value !== "");
    const periodicityText = get("периодичность", "periodicity")?.toLocaleLowerCase();
    const periodicity: QuickCreateDraft["periodicity"] =
        periodicityText && /^(каждый день|ежедневно|everyday|daily)$/.test(periodicityText) ? "everyday" :
        periodicityText && /^(еженедельно|по дням недели|weekly)$/.test(periodicityText) ? "weekly" :
        periodicityText && /^(цикл|cycle)$/.test(periodicityText) ? "cycle" :
        periodicityText && /^(иногда|sometimes)$/.test(periodicityText) ? "sometimes" : undefined;

    const result: QuickCreateDraft = {
        kind: command[1].toLowerCase() === "act" ? "habit" : "plan",
        name: get("название", "name"),
        description: get("описание", "description"),
        tag: get("тег", "tag")
    };
    if (periodicity) result.periodicity = periodicity;
    const range = get("время", "time")?.match(/(\d{1,2}(?::\d{2})?)\s*(?:[-–—]|до|to)\s*(\d{1,2}(?::\d{2})?)/i);
    const startTime = normalizeTime(get("начало", "start") || range?.[1] || "");
    const endTime = normalizeTime(get("конец", "end") || range?.[2] || "");
    if (startTime) result.startTime = startTime;
    if (endTime) result.endTime = endTime;
    const date = normalizeDate(get("дата", "date") || "");
    if (date) result.date = date;
    return result;
}
