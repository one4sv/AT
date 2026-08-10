import { useState } from "react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import "../../../../scss/habitsNoteTable.scss";
import { TagIcon } from "../../../HabitPage/utils/TagIcon";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export default function NotificationsTab() {
    const { t } = useTranslation("settings");
    const { note, messNote, habitsNote } = useSettings();
    const { setNewNote, setNewMessNote, setNewHabitsNote } = useUpSettings();
    const { habits } = useHabits();
    const [showNoteList, setShowNoteList] = useState<number>(0);

    const habitNoteArray = [
        {
            title: t("notifications.beforeStart"),
            options: [
                { label: t("notifications.atStart"), value: "start" },
                { label: t("notifications.minutesBefore"), value: "inpstart", input: true },
                { label: t("notifications.10minBefore"), value: "10start" },
                { label: t("notifications.1hourBefore"), value: "60start" },
            ],
        },
        {
            title: t("notifications.atTime"),
            options: [
                { label: t("notifications.atTime"), value: "inp", input: true },
            ],
        },
        {
            title: t("notifications.beforeEnd"),
            options: [
                { label: t("notifications.atEnd"), value: "end" },
                { label: t("notifications.minutesBefore"), value: "inpend", input: true },
                { label: t("notifications.10minBefore"), value: "10end" },
                { label: t("notifications.1hourBefore"), value: "60end" },
            ],
        },
    ];

    return (
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("notifications.general")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewNote(!note)}>
                        <span title="Не кликабельно">{t("notifications.generalNotifications")}</span>
                        <Toggler state={note} setState={setNewNote} />
                    </div>
                    <div className={`settingTogglerDiv ${!note && "settingInactive"}`} onClick={() => setNewMessNote(!messNote)}>
                        <span title="Не кликабельно">{t("notifications.newMessages")}</span>
                        <Toggler state={messNote} setState={setNewMessNote} disable={!note} />
                    </div>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("notifications.reminders")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewHabitsNote(!habitsNote)}>
                        <span>{t("notifications.remindAboutActivities")}</span>
                        <Toggler state={habitsNote} setState={setNewHabitsNote} />
                    </div>
                    <div className={`settingTogglerDiv ${!habitsNote && "settingInactive"}`}>
                        <span>{t("notifications.commonReminderTime")}</span>
                    </div>
                </div>
                <div className={`settingsInnerDiv ${!habitsNote && "settingInactive"}`}>
                    <div className="settingInnerList">
                        <div className="habitsNoteTable">
                            {habits?.filter(h => h.ongoing).sort((a, b) => a.id - b.id).map((h) => {
                                let timePart = "";
                                if (h.start_time && h.end_time) {
                                    timePart = t("notifications.fromTo", { start: h.start_time, end: h.end_time });
                                } else if (h.start_time) {
                                    timePart = t("notifications.startsAt", { time: h.start_time });
                                } else if (h.end_time) {
                                    timePart = t("notifications.until", { time: h.end_time });
                                }
                                const opened = showNoteList === h.id;
                                return (
                                    <div className="habitNoteWrapper" key={h.id}>
                                        <div className="habitNoteRow" onClick={() => setShowNoteList(prev => (prev === h.id ? 0 : h.id))}>
                                            <div className="habitNoteMain">
                                                <div className="habitNoteMainIcon">
                                                    {TagIcon(h, h.tag)}
                                                </div>
                                                <div className="habitNoteName">
                                                    {h.name}
                                                </div>
                                                <div className={`habitNoteTime ${!habitsNote && "settingInactive"}`}>
                                                    {timePart}
                                                </div>
                                            </div>
                                            <div className="habitNoteCounter">
                                                {t("notifications.notificationsCount", { count: 0 })}
                                            </div>
                                            <div className="habitNoteIsShown">
                                                <CaretDownIcon style={{ transform: opened ? "rotate(180deg)" : "" }} />
                                            </div>
                                        </div>
                                        <div className={`habitNoteArray ${opened ? "opened" : ""}`}>
                                            {habitNoteArray.map((a) => (
                                                <div key={a.title}>
                                                    <div className="habitNoteTitle">{a.title}</div>
                                                    <div className="habitNoteArrayNote">
                                                        {a.options.map((n) => (
                                                            <div className="habitNoteArrayButton" key={n.value}>
                                                                {n.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}