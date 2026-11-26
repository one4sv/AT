import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../hooks/BlackoutHook";
import { useSettings } from "../hooks/SettingsHook";
import useApplySharedSetting from "../hooks/useApplySharedSetting";
import { Background } from "../ts/utils/background";
import { parseSettingLink, settingValueLabel, sharedSettings } from "../../pages/Settings/Arrays/sharedSettings";
import ConfirmActionLayout from "./components/ConfirmActionLayout";
import "./scss/SharedSettingPreview.scss";

export default function SharedSettingPreview() {
    const { t } = useTranslation("settings");
    const navigate = useNavigate();
    const { blackout, setBlackout } = useBlackout();
    const { bgEffects } = useSettings();
    const apply = useApplySharedSetting();
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
                apply(setting, value);
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
