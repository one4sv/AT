import { useTranslation } from "react-i18next";
import { enGB, ru } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import HighlightText from "../../../../components/ts/HighlightText";
import SectionArt from "../../../../components/ts/SectionArt";

export default function HabitsTab({ search }: { search: string }) {
    const { t, i18n } = useTranslation("settings");
    const { showArchived, showArchivedInAcc, weekStart } = useSettings();
    const { setNewShowArchived, setNewShowArchivedInAcc, setNewWeekStart } = useUpSettings();

    return <div className="settingTab">
        {!search.trim() && <SectionArt theme="habits"/>}
        <div className="settingInnerDiv">
            <div className="settingHeader">{t("habits.archive")}</div>
            <div className="settingInnerList">
                <div className="settingTogglerDiv" onClick={() => setNewShowArchived(!showArchived)} data-setting-id="showArchived">
                    <HighlightText text={t("habits.archivedInSideMenu")} search={search}/>
                    <Toggler state={showArchived}/>
                </div>
                <div className="settingHint">{t("habits.archivedInSideMenuHint")}</div>
                <div className="settingTogglerDiv" onClick={() => setNewShowArchivedInAcc(!showArchivedInAcc)} data-setting-id="showArchivedInAcc">
                    <HighlightText text={t("habits.archivedInProfile")} search={search}/>
                    <Toggler state={showArchivedInAcc}/>
                </div>
                <div className="settingHint">{t("habits.archivedInProfileHint")}</div>
            </div>
        </div>
        <div className="settingInnerDiv" data-setting-id="weekStart">
            <div className="settingHeader">{t("habits.schedule")}</div>
            <div className="habitTabDiv">
                <div className="settingSpan">
                    <HighlightText text={t("habits.weekStartFrom")} search={search}/>
                </div>
                <DatePicker className="habitTabDP" selected={weekStart ? new Date(weekStart) : null}
                    locale={i18n.resolvedLanguage?.startsWith("en") ? enGB : ru}
                    maxDate={new Date()} dateFormat="dd.MM.yyyy" minDate={new Date(2000,0,1)}
                    onChange={date => {
                        if (date) setNewWeekStart(date.toISOString().split("T")[0]);
                    }}/>
            </div>
        </div>
    </div>;
}
