import { useState } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import SeekBar from "../SeekBar";
import { Link } from "react-router-dom";
import { TranslateIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import Toggler from "../../../../components/ts/Toggler";
import { useNote } from "../../../../components/hooks/NoteHook";
import HighlightText from "../../../../components/ts/HighlightText";

export default function GeneralTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { showDevNote } = useNote()
    const [ fontSize, setFontSize ] = useState<number>(16);

    const timeChanger = [
        { label: t("general.twentyFour"), value: "twentyFour" },
        { label: t("general.twelve"), value: "twelve" },
    ];
    const dateChanger = [
        { label: t("general.dateStandard"), value: "standart" },
        { label: t("general.dateAmerican"), value: "american" },
    ];

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.traffic")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" data-setting-id="autoLoadImages" onClick={() => showDevNote()}>
                        <HighlightText text={t("general.autoLoadImages")} search={search} />
                        <Toggler state={true} />
                    </div>
                    <div className="settingTogglerDiv" data-setting-id="autoPlayGif" onClick={() => showDevNote()}>
                        <HighlightText text={t("general.autoPlayGif")} search={search} />
                        <Toggler state={true} />
                    </div>
                    <div className="settingTogglerDiv" data-setting-id="useImageCache" onClick={() => showDevNote()}>
                        <HighlightText text={t("general.useImageCache")} search={search} />
                        <Toggler state={true} />
                    </div>
                </div>
                </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.text")}
                </div>
                <div className="settingInnerWrapper" onClick={() => showDevNote()}>
                    <div className="settingSpan">
                        <HighlightText text={t("general.fontSize")} search={search} />
                    </div>
                    <SeekBar min={12} max={22} value={fontSize} unit="px" step={1} onChange={setFontSize} disabled={false} id="fontSize"/>
                </div>
                <div className="settingInnerWrapper" onClick={() => showDevNote()}>
                    <div className="settingSpan">
                        <HighlightText text={t("general.dateFormat")} search={search} />
                    </div>
                    <RadioGroup list={dateChanger} val={"standart"} id="dateFormat"/>
                </div>
                <div className="settingInnerWrapper" onClick={() => showDevNote()}>
                    <div className="settingSpan">
                        <HighlightText text={t("general.timeFormat")} search={search} />
                    </div>
                    <RadioGroup list={timeChanger} val={"twentyFour"} id="timeFormat"/>
                </div>
            </div>
            <div className="settingInnerDiv" data-setting-id="language">
                <div className="settingHeader">
                    <HighlightText text={t("general.language")} search={search} />
                </div>
                <Link to="/settings/language" state={{ from: "/settings/gen" }} className="settingTogglerDiv languageSettingLink"><TranslateIcon size={22}/><HighlightText text={t("general.language")} search={search}/><CaretRightIcon size={20}/></Link>
            </div>
        </div>
    );
}