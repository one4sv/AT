import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import { Background } from "../ts/utils/background";
import { parseSettingLink, settingValueLabel, sharedSettings } from "../../pages/Settings/Arrays/sharedSettings";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "./scss/SharedSettingPreview.scss";

export default function SharedSettingPreview() {
    const { t } = useTranslation("settings");
    const navigate = useNavigate();
    const { blackout, setBlackout } = useBlackout();
    const { bgEffects, setBgEffects, setTheme, setHighlightContextEdges, setPreviewCompositionOnTap,
        setBlur, setDecor, setLayout, setStartupPage, setSideMenuSwipe, setShowMobileMenuOnStart, setStartupSideMenuTab,
        setAutoLoadImages, setAutoPlayGif, setUseImageCache, setFontSize, setDateFormat, setTimeFormat,
        setShowHabitGoals, setShowFeedDaySummary, setShowLinkPreview } = useSettings();
    const preset = parseSettingLink(blackout.options?.url ?? "");
    if (!preset) return null;
    const { setting, value } = preset;
    const definition = sharedSettings[setting];
    const title = t(definition.title);
    const sectionTitles = { pers: "settings.personalization", gen: "settings.general", activities: "settings.activities", security: "settings.security" };
    const path = [t(sectionTitles[definition.section]),
        definition.parent ? t(definition.parent) : null, title].filter(Boolean).join(" → ");
    const close = () => setBlackout({ seted: false });
    return <ConfirmActionLayout title={title} actions={<>
            <button type="button" onClick={() => {
                close();
                navigate("/settings/" + definition.section, { state: { settingId: definition.id } });
            }}>{t("sharing.open")}</button>
            <button type="button" className="approve" onClick={() => {
                switch (setting) {
                    case "background blur": setBgEffects(previous => ({ ...previous, blur: Number(value) })); break;
                    case "theme": setTheme(value); break;
                    case "context edges": setHighlightContextEdges(value === "on"); break;
                    case "composition preview": setPreviewCompositionOnTap(value === "on"); break;
                    case "background movement": setBgEffects(previous => ({ ...previous, movement: value === "on" })); break;
                    case "background speed": setBgEffects(previous => ({ ...previous, speed: Number(value) })); break;
                    case "background filters": setBgEffects(previous => ({ ...previous, filter: value as typeof previous.filter })); break;
                    case "interface blur": setBlur(Number(value)); break;
                    case "decor": setDecor(value); break;
                    case "sidemenu": setLayout(value); break;
                    case "startup page": setStartupPage(value === "habits" ? "habits" : "feed"); break;
                    case "sidemenu swipe": setSideMenuSwipe(value === "sections" ? "sections" : "close"); break;
                    case "sidemenu on-start": setShowMobileMenuOnStart(value === "on"); break;
                    case "sidemenu tab": setStartupSideMenuTab(value === "habits" ? "habits" : "chats"); break;
                    case "auto-load images": setAutoLoadImages(value === "on"); break;
                    case "auto-play gif": setAutoPlayGif(value === "on"); break;
                    case "image cache": setUseImageCache(value === "on"); break;
                    case "font size": setFontSize(Number(value)); break;
                    case "date format": setDateFormat(value === "american" ? "american" : "standart"); break;
                    case "time format": setTimeFormat(value === "twelve" ? "twelve" : "twentyFour"); break;
                    case "show goals": setShowHabitGoals(value === "on"); break;
                    case "day summary": setShowFeedDaySummary(value === "on"); break;
                    case "link preview": setShowLinkPreview(value === "on"); break;
                }
                close();
            }}>{t("general.compositionApply")}</button>
        </>}>
        <div className="sharedSettingPreview">
            <p>{path}</p>
            <p>{t(definition.hint)}</p>
            {setting === "background blur" && <div className="sharedSettingBackdrop">
                <Background previewEffects={{ ...bgEffects, blur: Number(value), movement: false }}/>
            </div>}
            <p>{settingValueLabel(setting, value, t)}</p>
        </div>
    </ConfirmActionLayout>;
}
