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
    const { bgEffects, setBgEffects, setTheme, setHighlightContextEdges, setPreviewCompositionOnTap } = useSettings();
    const preset = parseSettingLink(blackout.options?.url ?? "");
    if (!preset) return null;
    const { setting, value } = preset;
    const definition = sharedSettings[setting];
    const title = t(definition.title);
    const path = [t(definition.section === "pers" ? "settings.personalization" : "settings.general"),
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
