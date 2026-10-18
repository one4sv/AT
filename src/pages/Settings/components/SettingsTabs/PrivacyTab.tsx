import { type Option } from "../../../../components/ts/SelectList";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import { type PrivateSettings } from "../../../../components/context/SettingsContext";
import RadioGroup from "../../../../components/ts/RadioGroup";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";

export default function PrivacyTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { privateShow } = useSettings();
    const { setNewPrivateShow } = useUpSettings();

    const privateArr: Option[] = [
        { label: t("privacy.nobody"), value: "nobody" },
        { label: t("privacy.contacts"), value: "contacts" },
    ];

    const privateArrFull: Option[] = [
        ...privateArr,
        { label: t("privacy.all"), value: "all" },
    ];

    const applyNewPrivate = (setting: keyof PrivateSettings, value: string) => {
        if (!privateShow) return;
        const updated: PrivateSettings = { ...privateShow, [setting]: value };
        setNewPrivateShow(updated);
    };

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.accountInfo")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPhone")} search={search} /></div>
                    <RadioGroup list={privateArr} val={privateShow.number} newVal={(value) => applyNewPrivate("number", value || "nobody")} id="number"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesEmail")} search={search} /></div>
                    <RadioGroup list={privateArr} val={privateShow.mail} newVal={(value) => applyNewPrivate("mail", value || "nobody")} id="mail"/>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("privacy.contentVisibility")}
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesActivities")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={privateShow.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")} id="habits"/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan"><HighlightText text={t("privacy.whoSeesPosts")} search={search} /></div>
                    <RadioGroup list={privateArrFull} val={privateShow.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")} id="posts"/>
                </div>
            </div>
        </div>
    );
}