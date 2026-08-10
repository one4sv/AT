import { useState } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import SeekBar from "../SeekBar";
import SelectList from "../../../../components/ts/SelectList";
import { useTranslation } from "react-i18next";

export default function GeneralTab() {
    const { t } = useTranslation("settings");
    const [fontSize, setFontSize] = useState<number>(16);

    const timeChanger = [
        { label: t("genearal.twentyFour"), value: "twentyFour" },
        { label: t("genearal.twelve"), value: "twelve" },
    ];
    const dateChanger = [
        { label: t("genearal.dateStandard"), value: "standart" },
        { label: t("genearal.dateAmerican"), value: "american" },
    ];
    const trafficEconomy = [
        { label: t("genearal.on"), value: "on" },
        { label: t("genearal.off"), value: "off" },
    ];
    const langArr = [
        { label: t("genearal.russian"), value: "rus" },
        { label: t("genearal.english"), value: "eng" },
    ];

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("genearal.language")}
                </div>
                <SelectList arr={langArr} className="settingSL" selected={"rus"} />
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("genearal.traffic")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.autoLoadImages")}
                    </div>
                    <RadioGroup list={trafficEconomy} val="on" />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.autoPlayGif")}
                    </div>
                    <RadioGroup list={trafficEconomy} val="on" />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.useImageCache")}
                    </div>
                    <RadioGroup list={trafficEconomy} val="on" />
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("genearal.text")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.fontSize")}
                    </div>
                    <SeekBar min={12} max={22} value={fontSize} unit="px" step={1} onChange={setFontSize} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.dateFormat")}
                    </div>
                    <RadioGroup list={dateChanger} val={"standart"} />
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        {t("genearal.timeFormat")}
                    </div>
                    <RadioGroup list={timeChanger} val={"twentyFour"} />
                </div>
            </div>
        </div>
    );
}