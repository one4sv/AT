import type { SearchableSection } from "./searchableSettings";
import type { SearchableSetting } from "../Settings";
import { sharedSettings, settingValues, settingValueLabel, type SharedSetting } from "./sharedSettings";
import type { EntitySuggestionItem } from "../../../components/ts/EntitySuggestionList";

type Entry = { path: string; section: SearchableSection; item?: SearchableSetting; preset?: SharedSetting };
const sections: Record<string, string> = { pers: "interface", gen: "general", acc: "account", chats: "chats", activities: "activities", notes: "notifications", privacy: "privacy", security: "security" };
const slug = (value: string) => value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const aliases: Record<string, string> = { bg: "background", layout: "sidemenu", sideMenuSwipe: "sidemenu swipe", startupSideMenuTab: "sidemenu tab", showMobileMenuOnStart: "sidemenu on-start" };
export function settingCommandCatalog(source: SearchableSection[]): Entry[] {
    return source.flatMap(section => {
        const path = sections[section.id] || section.id;
        const items: Entry[] = section.items.map(item => ({
            section, item, path: path + " " + (aliases[item.id] || slug(item.id)),
            preset: (Object.keys(sharedSettings) as SharedSetting[]).find(key => sharedSettings[key].section === section.id && sharedSettings[key].id === item.id && key !== "background movement")
        }));
        for (const key of Object.keys(sharedSettings) as SharedSetting[]) {
            const definition = sharedSettings[key];
            if (definition.section !== section.id || items.some(item => item.preset === key)) continue;
            items.push({ path: path + " " + key, section, preset: key });
        }
        if (section.id === "gen" && !items.some(item => item.path === path + " sidemenu"))
            items.push({ path: path + " sidemenu", section, item: section.items.find(item => item.id === "sideMenuSwipe") });
        return [{ path, section }, ...items];
    });
}

const inputOf = (text: string) => text.replace(/^\/settings\s*/i, "").trim().toLowerCase().replace(/\s+/g, " ");
export function resolveSettingCommand(text: string, catalog: Entry[]) {
    const input = inputOf(text);
    const entry = [...catalog].sort((a, b) => b.path.length - a.path.length).find(entry => entry.path === input || (entry.preset && input.startsWith(entry.path + " ")));
    if (!entry) return null;
    if (entry.preset) return { entry, presetText: "/settings " + entry.preset + input.slice(entry.path.length) };
    return { entry, presetText: undefined };
}

export function settingCommandSuggestions(text: string, catalog: Entry[], t: (key: string) => string): EntitySuggestionItem[] {
    const input = inputOf(text);
    const resolved = resolveSettingCommand(text, catalog);
    if (/\s$/.test(text) && resolved?.entry.preset) {
        const key = resolved.entry.preset;
        if (input === resolved.entry.path) {
            const values = settingValues(key);
            return values.map(value => ({ id: input + " " + value, label: settingValueLabel(key, value, t), description: input }));
        }
    }
    const preset = [...catalog].sort((a, b) => b.path.length - a.path.length).find(entry => entry.preset && input.startsWith(entry.path + " "));
    if (preset?.preset) {
        const query = input.slice(preset.path.length + 1);
        const key = preset.preset;
        const values = settingValues(key);
        if (values.includes(query) && /\s$/.test(text)) return [];
        return values.filter(value => value.startsWith(query)).map(value => ({ id: preset.path + " " + value,
            label: settingValueLabel(key, value, t), description: preset.path }));
    }
    return catalog.filter(entry => input ? entry.path.startsWith(input) && (entry.path !== input || !/\s$/.test(text)) :
        !entry.path.includes(" ")).map(entry => ({
        id: entry.path, label: entry.item?.name || (entry.preset ? t(sharedSettings[entry.preset].title) : entry.section.name), description: "/settings " + entry.path
    }));
}
