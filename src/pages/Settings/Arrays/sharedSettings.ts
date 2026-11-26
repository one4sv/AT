export const sharedSettings = {
    "background blur": { section: "pers", id: "backgroundBlur", title: "backgroundLibrary.blurBackground", parent: "personalization.background", hint: "sharing.blurHint" },
    "theme": { section: "pers", id: "theme", title: "personalization.theme", parent: null, hint: "sharing.themeHint" },
    "context edges": { section: "gen", id: "highlightContextEdges", title: "general.highlightContextEdges", parent: "general.experimental", hint: "general.contextEdgesHint" },
    "composition preview": { section: "gen", id: "previewCompositionOnTap", title: "general.previewCompositionOnTap", parent: "general.experimental", hint: "general.previewCompositionOnTapHint" },
    "background movement": { section: "pers", id: "bg", title: "backgroundLibrary.movement", parent: "personalization.background", hint: "sharing.valueHint" },
    "interface blur": { section: "pers", id: "blur", title: "personalization.decor", parent: "personalization.decor", hint: "sharing.valueHint" },
    "decor": { section: "pers", id: "decor", title: "personalization.decor", parent: null, hint: "sharing.valueHint" },
    "sidemenu": { section: "pers", id: "layout", title: "personalization.sideMenu", parent: null, hint: "sharing.valueHint" },
    "startup page": { section: "gen", id: "startupPage", title: "general.startupPage", parent: "general.startupTitle", hint: "sharing.valueHint" },
    "sidemenu swipe": { section: "gen", id: "sideMenuSwipe", title: "general.sideMenuSwipe", parent: "general.startupTitle", hint: "sharing.valueHint" },
    "sidemenu on-start": { section: "gen", id: "showMobileMenuOnStart", title: "general.showMobileMenuOnStart", parent: "general.startupTitle", hint: "sharing.valueHint" },
    "sidemenu tab": { section: "gen", id: "startupSideMenuTab", title: "general.startupSideMenuTab", parent: "general.startupTitle", hint: "sharing.valueHint" },
    "auto-load images": { section: "gen", id: "autoLoadImages", title: "general.autoLoadImages", parent: "general.traffic", hint: "sharing.valueHint" },
    "auto-play gif": { section: "gen", id: "autoPlayGif", title: "general.autoPlayGif", parent: "general.traffic", hint: "sharing.valueHint" },
    "image cache": { section: "gen", id: "useImageCache", title: "general.useImageCache", parent: "general.traffic", hint: "sharing.valueHint" },
    "font size": { section: "gen", id: "fontSize", title: "general.fontSize", parent: "general.text", hint: "sharing.valueHint" },
    "date format": { section: "gen", id: "dateFormat", title: "general.dateFormat", parent: "general.text", hint: "sharing.valueHint" },
    "time format": { section: "gen", id: "timeFormat", title: "general.timeFormat", parent: "general.text", hint: "sharing.valueHint" },
    "show goals": { section: "activities", id: "showHabitGoals", title: "habits.showGoals", parent: "habits.goals", hint: "sharing.valueHint" },
    "day summary": { section: "activities", id: "showFeedDaySummary", title: "habits.showFeedDaySummary", parent: "habits.feed", hint: "sharing.valueHint" },
    "link preview": { section: "security", id: "showLinkPreview", title: "security.linkPreview", parent: "settings.security", hint: "sharing.valueHint" }
} as const;

export type SharedSetting = keyof typeof sharedSettings;

export function settingValues(setting: SharedSetting): string[] {
    switch (setting) {
        case "background blur": return Array.from({length: 31}, (_, index) => String(index));
        case "theme": return ["light", "dark", "system"];
        case "interface blur": return Array.from({length: 35}, (_, index) => String(index + 2));
        case "decor": return ["default","glass"];
        case "sidemenu": return ["always","hidden"];
        case "startup page": return ["feed","habits"];
        case "sidemenu swipe": return ["close","sections"];
        case "sidemenu tab": return ["chats","habits"];
        case "font size": return Array.from({length: 11}, (_, index) => String(index + 12));
        case "date format": return ["standart","american"];
        case "time format": return ["twentyfour","twelve"];
        default: return ["on", "off"];
    }
}

export function validSettingValue(setting: SharedSetting, value: string) {
    return settingValues(setting).includes(value);
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
    if (setting === "background blur" || setting === "interface blur" || setting === "font size") return value + " px";
    if (setting === "theme" || value === "on" || value === "off") return translate("sharing." + value);
    return value;
}
