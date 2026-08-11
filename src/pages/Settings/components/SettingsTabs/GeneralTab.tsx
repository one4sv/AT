import { useState } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import SeekBar from "../SeekBar";
import SelectList from "../../../../components/ts/SelectList";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";

export default function GeneralTab() {
    const { t } = useTranslation("settings");
    const { lang } = useSettings()
    const { setNewLang } = useUpSettings()
    const [ fontSize, setFontSize ] = useState<number>(16);

    const timeChanger = [
        { label: t("general.twentyFour"), value: "twentyFour" },
        { label: t("general.twelve"), value: "twelve" },
    ];
    const dateChanger = [
        { label: t("general.dateStandard"), value: "standart" },
        { label: t("general.dateAmerican"), value: "american" },
    ];
    const langArr = [
        { label: t("general.russian"), value: "ru" },
        { label: t("general.english"), value: "en" },
    ];

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.language")}
                </div>
                <SelectList arr={langArr} className="settingSL" selected={lang} extraFunction={setNewLang}/>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.traffic")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv">
                        {t("general.autoLoadImages")}
                        <Toggler state={true} />
                    </div>
                    <div className="settingTogglerDiv">
                        {t("general.autoPlayGif")}
                        <Toggler state={true} />
                    </div>
                    <div className="settingTogglerDiv">
                        {t("general.useImageCache")}
                        <Toggler state={true} />
                    </div>
                </div>
                </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.text")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("general.fontSize")}
                    </div>
                    <SeekBar min={12} max={22} value={fontSize} unit="px" step={1} onChange={setFontSize} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("general.dateFormat")}
                    </div>
                    <RadioGroup list={dateChanger} val={"standart"} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("general.timeFormat")}
                    </div>
                    <RadioGroup list={timeChanger} val={"twentyFour"} />
                </div>
            </div>
        </div>
    );
}