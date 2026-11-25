import type { SharedEntityKind } from "../components/SharedEntityCard";

export function parseATEntityLink(href: string): {kind: SharedEntityKind; id: string} | null {
    let url: URL;
    try { url = new URL(href); } catch { return null; }
    if (!["http:", "https:"].includes(url.protocol) ||
        (url.origin !== window.location.origin && url.origin !== "https://achievetogether.vercel.app")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const [route, raw, groupId] = parts;
    const numeric = (value?: string) => !!value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
    if (route === "chat" && raw === "g" && parts.length === 3 && numeric(groupId)) return {kind:"group",id:groupId};
    if (parts.length !== 2) return null;
    if (route === "acc" || route === "chat") {
        try {
            const nick = decodeURIComponent(raw);
            if (nick && nick.length <= 64 && !/[\/\\\s]/.test(nick)) return {kind:"user",id:"nick:"+nick};
        } catch { return null; }
    }
    if (!numeric(raw)) return null;
    if (route === "habit" || route === "plan" || route === "post") return {kind:route,id:raw};
    if (route === "room") return {kind:"group",id:raw};
    return null;
}
