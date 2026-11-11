import RadioGroup from "../../../../components/ts/RadioGroup";
import SeekBar from "../SeekBar";
import { Link } from "react-router-dom";
import { TranslateIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import Toggler from "../../../../components/ts/Toggler";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";
import QuickActionsSettings from "./QuickActionsSettings";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import useCompactLayout from "../../../../components/hooks/utils/useCompactLayout";

export default function GeneralTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const isMobile = useCompactLayout();
    const { fontSize, setFontSize, dateFormat, setDateFormat, timeFormat, setTimeFormat,
        autoLoadImages, setAutoLoadImages, autoPlayGif, setAutoPlayGif, useImageCache, setUseImageCache,
        startupPage, setStartupPage, showMobileMenuOnStart, setShowMobileMenuOnStart,
        startupSideMenuTab, setStartupSideMenuTab } = useSettings();

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
            {!search.trim() && <SectionArt theme="general"/>}
            <div className="settingInnerDiv" data-setting-id="startupPage">
                <div className="settingHeader">
                    {t("general.startupTitle")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        <HighlightText text={t("general.startupPage")} search={search}/>
                    </div>
                    <RadioGroup list={[
                        { label: t("general.startupFeed"), value: "feed" },
                        { label: t("general.startupHabits"), value: "habits" }
                    ]} val={startupPage}
                        newVal={value => setStartupPage(value === "habits" ? "habits" : "feed")}
                        id="startupPage"/>
                </div>
                {isMobile && <>
                    <div className="settingInnerList">
                        <div className="settingTogglerDiv" data-setting-id="showMobileMenuOnStart"
                            onClick={() => setShowMobileMenuOnStart(!showMobileMenuOnStart)}>
                            <HighlightText text={t("general.showMobileMenuOnStart")} search={search}/>
                            <Toggler state={showMobileMenuOnStart} setState={setShowMobileMenuOnStart} stopPropagation={true}/>
                        </div>
                    </div>
                    {showMobileMenuOnStart && <div className="settingInnerWrapper" data-setting-id="startupSideMenuTab">
                        <div className="settingSpan">
                            <HighlightText text={t("general.startupSideMenuTab")} search={search}/>
                        </div>
                        <RadioGroup list={[
                            { label: t("general.startupChats"), value: "chats" },
                            { label: t("general.startupActivities"), value: "habits" }
                        ]} val={startupSideMenuTab}
                            newVal={value => setStartupSideMenuTab(value === "habits" ? "habits" : "chats")}
                            id="startupSideMenuTab"/>
                    </div>}
                </>}
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.traffic")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" data-setting-id="autoLoadImages" onClick={() => setAutoLoadImages(!autoLoadImages)}>
                        <HighlightText text={t("general.autoLoadImages")} search={search} />
                        <Toggler state={autoLoadImages} setState={setAutoLoadImages} stopPropagation={true} />
                    </div>
                    <div className="settingTogglerDiv" data-setting-id="autoPlayGif" onClick={() => setAutoPlayGif(!autoPlayGif)}>
                        <HighlightText text={t("general.autoPlayGif")} search={search} />
                        <Toggler state={autoPlayGif} setState={setAutoPlayGif} stopPropagation={true} />
                    </div>
                    <div className="settingTogglerDiv" data-setting-id="useImageCache" onClick={() => setUseImageCache(!useImageCache)}>
                        <HighlightText text={t("general.useImageCache")} search={search} />
                        <Toggler state={useImageCache} setState={setUseImageCache} stopPropagation={true} />
                    </div>
                </div>
                <div className="settingHint">{t("general.trafficHint")}</div>
                </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("general.text")}
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        <HighlightText text={t("general.fontSize")} search={search} />
                    </div>
                    <SeekBar min={12} max={22} value={fontSize} unit="px" step={1} onChange={setFontSize} disabled={false} id="fontSize"/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        <HighlightText text={t("general.dateFormat")} search={search} />
                    </div>
                    <RadioGroup list={dateChanger} val={dateFormat} newVal={value => setDateFormat(value === "american" ? "american" : "standart")} id="dateFormat"/>
                </div>
                <div className="settingInnerWrapper">
                    <div className="settingSpan">
                        <HighlightText text={t("general.timeFormat")} search={search} />
                    </div>
                    <RadioGroup list={timeChanger} val={timeFormat} newVal={value => setTimeFormat(value === "twelve" ? "twelve" : "twentyFour")} id="timeFormat"/>
                </div>
            </div>
            <QuickActionsSettings search={search}/>
            <div className="settingInnerDiv" data-setting-id="language">
                <div className="settingHeader">
                    <HighlightText text={t("general.language")} search={search} />
                </div>
                <Link to="/settings/language" state={{ from: "/settings/gen" }} className="settingTogglerDiv languageSettingLink"><TranslateIcon size={22}/><HighlightText text={t("general.language")} search={search}/><CaretRightIcon size={20}/></Link>
            </div>
        </div>
    );
}