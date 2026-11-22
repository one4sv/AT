import type { tab } from "../../context/SideMenuContext";

export const searchFilters = ["ms", "new", "group", "habit", "plan", "user", "post", "setting"] as const;
export type SearchFilter = typeof searchFilters[number];

export const searchTabFilters: Record<tab, readonly SearchFilter[]> = {
    chats: ["ms", "new", "group", "user"],
    habits: ["habit", "plan"],
    spots: [],
    user: ["post", "setting"]
};

export const searchTabForFilter = (filter: SearchFilter): tab =>
    (Object.keys(searchTabFilters) as tab[]).find(name => searchTabFilters[name].includes(filter)) || "chats";

export function formatSMSearchQuery(filter: SearchFilter | null, query: string): string {
    const text = query.trim();
    return filter ? "/" + filter + (text ? " " + text : "") : text;
}

export function parseSMSearchQuery(text: string): { filter: SearchFilter | null; query: string } {
    const match = /^\/(ms|new|group|habit|plan|user|post|setting)(?:\s+(.*))?$/iu.exec(text.trim());
    return match ? { filter: match[1] as SearchFilter, query: (match[2] || "").trim() } :
        { filter: null, query: text.trim().startsWith("/") ? "" : text.trim() };
}
