/** Public/navigation routes only. Token-bearing and mutation routes remain normal links. */
export function normalizeATLink(href: string, origin = window.location.origin): URL | null {
    const address = /^(?:www\.)?achievetogether\.vercel\.app(?=\/|$)/i.test(href)
        ? "https://" + href.replace(/^www\./i, "") : href;
    let url: URL;
    try { url = new URL(address, origin); } catch { return null; }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        (url.origin !== origin && url.origin !== "https://achievetogether.vercel.app")) return null;
    return url;
}

export function parseATPageLink(href: string, origin = window.location.origin) {
    const url = normalizeATLink(href, origin);
    if (!url) return null;
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const location = { pathname: url.pathname, search: url.search, hash: url.hash };
    if (path === "/") return { kind: "feed" as const, ...location };
    if (path === "/habit") return { kind: "activities" as const, ...location };
    if (path === "/acc") return { kind: "profile" as const, ...location };
    if (path === "/connection") return { kind: "connection" as const, ...location };
    const info = /^\/info(?:\/(about|terms|policy|contacts|faq|roadmap|beta))?$/.exec(path);
    if (info) return { kind: "info" as const, tab: info[1] ?? "", ...location };
    if (path === "/settings/devices") return { kind: "devices" as const, ...location };
    if (path === "/settings/password" && !url.search && !url.hash) return { kind: "password" as const, ...location };
    if (/^\/wallpapers\/(?:standard|custom|stock)$/.test(path)) return { kind: "wallpapers" as const, ...location };
    return null;
}
