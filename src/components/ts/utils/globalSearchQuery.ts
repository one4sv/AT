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

export function searchSourceFilters(section: tab, filter: SearchFilter | null, query: string): SearchFilter[] {
    if (filter) return section === "user" && filter === "post" && !query.trim() ? [] : [filter];
    if (section === "chats") return query.trim() ? ["user", "ms"] : ["user"];
    if (section === "habits") return ["habit", "plan"];
    if (section === "user") return query.trim() ? ["post", "setting"] : ["setting"];
    return [];
}

export function searchResultRank(section: tab, item: { kind: string; mine?: boolean }): number {
    if (section === "chats") return item.kind === "contact" ? 0 :
        item.kind === "group" ? 0 : item.kind === "user" ? 1 : 2;
    if (section === "habits") return item.kind === "habit" ?
        (item.mine ? 0 : 2) : item.kind === "plan" ? (item.mine ? 1 : 3) : 4;
    if (section === "user") return item.kind === "setting" ? 0 :
        item.kind === "post" ? (item.mine ? 1 : 2) : 3;
    return 0;
}
