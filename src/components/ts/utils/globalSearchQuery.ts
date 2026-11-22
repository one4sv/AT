export const searchFilters = ["every","ms","com","post","setting","user","habit","plan","new","group"] as const;
export type SearchFilter = typeof searchFilters[number];

export function parseSMSearchQuery(text: string): { filter: SearchFilter; query: string } {
    const match = /^\/(ms|com|post|setting|user|habit|plan|new|group|every)(?:\s+(.*))?$/iu.exec(text.trim());
    return match ? { filter: match[1] as SearchFilter, query: (match[2] || "").trim() } :
        { filter: "every", query: text.trim() };
}
