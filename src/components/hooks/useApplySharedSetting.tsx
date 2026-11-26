import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "./SettingsHook";
import { useNote } from "./NoteHook";
import { useUser } from "./UserHook";
import { useRef } from "react";
import { useSearchableSettings } from "../../pages/Settings/Arrays/searchableSettings";
import SettingCatalogIcon from "../../pages/Settings/components/SettingCatalogIcon";
import { sharedSettings, settingValueLabel, validSettingValue, type SharedSetting } from "../../pages/Settings/Arrays/sharedSettings";

export default function useApplySharedSetting() {
    const s = useSettings();
    const { user } = useUser();
    const currentUser = useRef(user.id);
    currentUser.current = user.id;
    const { showSettingNotice } = useNote();
    const { t } = useTranslation("settings");
    const catalog = useSearchableSettings(true);
    return (setting: SharedSetting, value: string) => {
        if (!validSettingValue(setting, value)) return;
        const owner = user.id;
        let undo: () => void = () => {};
        function change<T>(setter: Dispatch<SetStateAction<T>>, previous: T, next: T) {
            setter(next);
            undo = () => { if (currentUser.current === owner) setter(current => Object.is(current, next) ? previous : current); };
        }
        function effect<K extends keyof typeof s.bgEffects>(key: K, next: typeof s.bgEffects[K]) {
            const previous = s.bgEffects[key];
            s.setBgEffects(current => ({ ...current, [key]: next }));
            undo = () => { if (currentUser.current === owner) s.setBgEffects(current => Object.is(current[key], next) ? { ...current, [key]: previous } : current); };
        }
        switch (setting) {
            case "background blur": effect("blur", Number(value)); break;
            case "background movement": effect("movement", value === "on"); break;
            case "background speed": effect("speed", Number(value)); break;
            case "background filters": effect("filter", value as typeof s.bgEffects.filter); break;
            case "theme": change(s.setTheme, s.theme, value); break;
            case "context edges": change(s.setHighlightContextEdges, s.highlightContextEdges, value === "on"); break;
            case "composition preview": change(s.setPreviewCompositionOnTap, s.previewCompositionOnTap, value === "on"); break;
            case "interface blur": change(s.setBlur, s.blur, Number(value)); break;
            case "decor": change(s.setDecor, s.decor, value); break;
            case "sidemenu": change(s.setLayout, s.layout, value); break;
            case "startup page": change(s.setStartupPage, s.startupPage, value === "habits" ? "habits" : "feed"); break;
            case "sidemenu swipe": change(s.setSideMenuSwipe, s.sideMenuSwipe, value === "sections" ? "sections" : "close"); break;
            case "sidemenu on-start": change(s.setShowMobileMenuOnStart, s.showMobileMenuOnStart, value === "on"); break;
            case "sidemenu tab": change(s.setStartupSideMenuTab, s.startupSideMenuTab, value === "habits" ? "habits" : "chats"); break;
            case "auto-load images": change(s.setAutoLoadImages, s.autoLoadImages, value === "on"); break;
            case "auto-play gif": change(s.setAutoPlayGif, s.autoPlayGif, value === "on"); break;
            case "image cache": change(s.setUseImageCache, s.useImageCache, value === "on"); break;
            case "font size": change(s.setFontSize, s.fontSize, Number(value)); break;
            case "date format": change(s.setDateFormat, s.dateFormat, value === "american" ? "american" : "standart"); break;
            case "time format": change(s.setTimeFormat, s.timeFormat, value === "twelve" ? "twelve" : "twentyFour"); break;
            case "show goals": change(s.setShowHabitGoals, s.showHabitGoals, value === "on"); break;
            case "day summary": change(s.setShowFeedDaySummary, s.showFeedDaySummary, value === "on"); break;
            case "link preview": change(s.setShowLinkPreview, s.showLinkPreview, value === "on"); break;
        }
        const definition = sharedSettings[setting];
        const group = catalog.find(entry => entry.id === definition.section);
        const item = group?.items.find(entry => entry.id === definition.id);
        showSettingNotice({ title: t(definition.title), detail: settingValueLabel(setting, value, t), undo, icon: item ? <SettingCatalogIcon item={item} size={24}/> : undefined });
    };
}
