import { parseSharedGoalLink } from "./sharedGoal";
import { parseSharedCompositionLink } from "../../../components/ts/utils/sharedComposition";
import { parseSharedWallpaperLink, shareableWallpapers } from "../../../components/ts/utils/backgroundCatalog";
import { parseSettingLink, parseSettingNavigationLink, sharedSettings, settingValueLabel } from "../../Settings/Arrays/sharedSettings";
import { parseATEntityLink } from "./parseATEntityLink";
import { normalizeATLink, parseATPageLink } from "./parseATPageLink";

export function internalObjectKind(text: string) {
    if (!/^https?:\/\/\S+$/i.test(text.trim())) return null;
    const url = normalizeATLink(text.trim());
    if (!url) return null;
    const href = url.href;
    const origin = window.location.origin;
    const goal = parseSharedGoalLink(href, origin);
    if (goal) return {kind:"goal" as const, goal};
    const composition = parseSharedCompositionLink(href, origin);
    if (composition) return { kind: "composition" as const, composition };
    const wallpaper = parseSharedWallpaperLink(href, origin);
    if (wallpaper) return { kind: "wallpaper" as const, wallpaper };
    const preset = parseSettingLink(href);
    if (preset) return { kind: "preset" as const, preset };
    const navigation = parseSettingNavigationLink(href);
    if (navigation) return { kind: "setting" as const, navigation };
    const entity = parseATEntityLink(href);
    if (entity) return { kind: "entity" as const, entity };
    const page = parseATPageLink(href);
    return page ? { kind: "page" as const, page } : null;
}
export function internalObjectSummary(text: string, common: (key: string) => string, settings: (key: string) => string) {
    const item = internalObjectKind(text);
    if (!item) return null;
    switch (item.kind) {
        case "goal": return common("chatUi.goalObject") + ": " + item.goal.name;
        case "composition": return settings("personalization.compositions.title") + ": " + item.composition.name;
        case "wallpaper": {
            const wallpaper = item.wallpaper;
            const stock = wallpaper.kind === "stock" ? shareableWallpapers.find(entry => entry.id === wallpaper.id) : undefined;
            return settings("personalization.background") + ": " + settings(stock?.labelKey ?? "backgroundLibrary.customWallpaper");
        }
        case "preset": return settings(sharedSettings[item.preset.setting].title) + ": " + settingValueLabel(item.preset.setting, item.preset.value, settings);
        case "setting": return settings("settings.title");
        case "entity": return common("chatUi.shareType." + item.entity.kind);
        case "page": return "Achieve Together";
    }
}
