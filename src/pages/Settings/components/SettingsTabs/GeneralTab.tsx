import { useMemo } from "react";
import RadioGroup from "../../../../components/ts/RadioGroup";
import SelectList from "../../../../components/ts/SelectList";
import { browserTimeZone } from "../../../../components/ts/utils/dateToStr";
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
    const { fontSize, setFontSize, dateFormat, setDateFormat, timeFormat, setTimeFormat, timeZone, setTimeZone,
        autoLoadImages, setAutoLoadImages, autoPlayGif, setAutoPlayGif, useImageCache, setUseImageCache,
        startupPage, setStartupPage, showMobileMenuOnStart, setShowMobileMenuOnStart,
        startupSideMenuTab, setStartupSideMenuTab } = useSettings();

    const timeZones = useMemo(() => {
        const device = browserTimeZone();
        const now = new Date();
        // One familiar IANA zone per current whole-hour UTC offset.
        const zones = [
            "Pacific/Honolulu", "Pacific/Pago_Pago", "America/Adak", "America/Anchorage",
            "America/Los_Angeles", "America/Denver", "America/Chicago",
            "America/New_York", "America/Halifax", "America/Sao_Paulo",
            "America/Noronha", "Atlantic/Azores", "Europe/London",
            "Europe/Paris", "Europe/Kaliningrad", "Europe/Moscow",
            "Asia/Dubai", "Asia/Karachi", "Asia/Dhaka", "Asia/Bangkok",
            "Asia/Singapore", "Asia/Tokyo", "Australia/Brisbane",
            "Pacific/Noumea", "Pacific/Auckland", "Pacific/Tongatapu",
            "Pacific/Kiritimati"
        ];
        const offsetMinutes = (zone: string): number | null => {
            try {
                const value = new Intl.DateTimeFormat("en-US", {
                    timeZone: zone, timeZoneName: "shortOffset"
                }).formatToParts(now).find(part => part.type === "timeZoneName")?.value || "GMT";
                if (value === "GMT" || value === "UTC") return 0;
                const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(value);
                if (!match) return null;
                const sign = match[1] === "-" ? -1 : 1;
                return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
            } catch {
                return null;
            }
        };
        const representative = new Map<number, string>();
        for (const zone of zones) {
            const minutes = offsetMinutes(zone);
            if (minutes !== null && minutes % 60 === 0 && !representative.has(minutes)) {
                representative.set(minutes, zone);
            }
        }
        // Include even sparsely populated offsets, without repeating cities for an hour.
        for (let hour = -12; hour <= 14; hour++) {
            if (!representative.has(hour * 60)) {
                representative.set(hour * 60, hour === 0 ? "UTC" :
                    `Etc/GMT${hour > 0 ? "-" : "+"}${Math.abs(hour)}`);
            }
        }
        // Preserve an existing non-standard choice without silently resetting settings.
        if (timeZone && timeZone !== "auto") {
            const minutes = offsetMinutes(timeZone);
            if (minutes !== null) representative.set(minutes, timeZone);
        }
        const labels = Array.from(representative.entries()).sort(([a], [b]) => a - b)
            .map(([minutes, zone]) => {
                const sign = minutes < 0 ? "-" : "+";
                const absolute = Math.abs(minutes);
                const offset = `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
                return { value: zone, label: `${offset} · ${zone}` };
            });
        return [{ value: "auto", label: t("general.timeZoneAuto", { zone: device }) }, ...labels];
    }, [t, timeZone]);

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
                <div className="settingInnerWrapper" data-setting-id="timeZone">
                    <div className="settingSpan">
                        <HighlightText text={t("general.timeZone")} search={search}/>
                    </div>
                    <SelectList className="generalTimeZoneSelect" id="timeZone"
                        selected={timeZone} arr={timeZones} onChange={setTimeZone}/>
                </div>
                <div className="settingHint">{t("general.timeZoneHint")}</div>
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