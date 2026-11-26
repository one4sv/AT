export const sharedSettings = {
    "background blur": { section: "pers", id: "backgroundBlur", title: "backgroundLibrary.blurBackground", parent: "personalization.background", hint: "sharing.blurHint" },
    "theme": { section: "pers", id: "theme", title: "personalization.theme", parent: null, hint: "sharing.themeHint" },
    "context edges": { section: "gen", id: "highlightContextEdges", title: "general.highlightContextEdges", parent: "general.experimental", hint: "general.contextEdgesHint" },
    "composition preview": { section: "gen", id: "previewCompositionOnTap", title: "general.previewCompositionOnTap", parent: "general.experimental", hint: "general.previewCompositionOnTapHint" }
} as const;

export type SharedSetting = keyof typeof sharedSettings;

export function validSettingValue(setting: SharedSetting, value: string) {
    if (setting === "background blur") return /^(?:[0-9]|[12][0-9]|30)$/.test(value);
    if (setting === "theme") return ["light", "dark", "system"].includes(value);
    return value === "on" || value === "off";
}

export function parseSettingCommand(text: string) {
    const match = /^\/settings(?:\s+(.*))?$/i.exec(text.trim());
    if (!match) return null;
    const input = (match[1] ?? "").toLowerCase().trim().replace(/\s+/g, " ");
    if (!input || input === "background") return { input, setting: null, value: null };
    const setting = (Object.keys(sharedSettings) as SharedSetting[])
        .find(key => input === key || input.startsWith(key + " "));
    const value = setting ? input.slice(setting.length).trim() : "";
    return { input, setting: setting ?? null, value: setting && validSettingValue(setting, value) ? value : null };
}

export function settingLink(setting: SharedSetting, value: string) {
    const url = new URL("/settings/" + sharedSettings[setting].section, window.location.origin);
    url.searchParams.set("preset", setting);
    url.searchParams.set("value", value);
    return url.href;
}

export function parseSettingLink(href: string) {
    let url: URL;
    try { url = new URL(href, window.location.origin); } catch { return null; }
    if (url.origin !== window.location.origin && url.origin !== "https://achievetogether.vercel.app") return null;
    const key = url.searchParams.get("preset");
    const value = url.searchParams.get("value");
    if (!key || value === null || !Object.prototype.hasOwnProperty.call(sharedSettings, key)) return null;
    const setting = key as SharedSetting;
    if (url.pathname !== "/settings/" + sharedSettings[setting].section || !validSettingValue(setting, value)) return null;
    return { setting, value };
}

export function settingValueLabel(setting: SharedSetting, value: string, translate: (key: string) => string) {
    if (setting === "background blur") return value + " px";
    return translate(setting === "theme" ? "sharing." + value : "sharing." + (value === "on" ? "on" : "off"));
}
