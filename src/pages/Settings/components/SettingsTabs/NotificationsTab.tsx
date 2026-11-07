import { useEffect, useState } from "react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import "../../../../scss/habitsNoteTable.scss";
import { TagIcon } from "../../../HabitPage/utils/TagIcon";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useNote } from "../../../../components/hooks/NoteHook";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";
import { getPushState, enableWebPush, disableWebPush, isIOS, isStandalonePWA, type PushState } from "../../../../components/ts/utils/webPush";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { api } from "../../../../components/ts/api";
import "./notificationPermission.scss";

const browserPermission = (): NotificationPermission | "unsupported" =>
    typeof window === "undefined" || !("Notification" in window) ? "unsupported" : Notification.permission;

export default function NotificationsTab({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { note, messNote, habitsNote } = useSettings();
    const { setNewNote, setNewMessNote, setNewHabitsNote } = useUpSettings();
    const { habits } = useHabits();
    const { showDevNote, showNotification } = useNote()
    const { setBlackout } = useBlackout();
    const [showNoteList, setShowNoteList] = useState<number>(0);
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">(browserPermission);
    const [push, setPush] = useState<PushState>({ supported: false, configured: false, subscribed: false, publicKey: null });
    const [busy, setBusy] = useState(false);
    const [pushError, setPushError] = useState(false);
    const iosNeedsInstall = isIOS() && !isStandalonePWA();

    useEffect(() => {
        let mounted = true;
        const update = () => {
            setPermission(browserPermission());
            void getPushState().then(value => {
                if (mounted) {
                    setPush(value);
                    setPushError(false);
                }
            }).catch(() => {
                if (mounted) setPushError(true);
            });
        };
        update();
        window.addEventListener("focus", update);
        document.addEventListener("visibilitychange", update);
        return () => {
            mounted = false;
            window.removeEventListener("focus", update);
            document.removeEventListener("visibilitychange", update);
        };
    }, []);

    const togglePreference = async (key: "all_note" | "new_mess_note", value: boolean) => {
        const update = key === "all_note" ? setNewNote : setNewMessNote;
        update(value);
        try {
            await api.post("updatesettings", { [key]: value });
        } catch {
            update(!value);
            showNotification("error", t("notifications.preferenceError"));
        }
    };

    const enableBrowserNotifications = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await enableWebPush(push.publicKey);
            setPush(await getPushState());
            showNotification("success", t("notifications.pushSuccess"));
        } catch {
            showNotification("error", t("notifications.pushError"));
        } finally {
            setPermission(browserPermission());
            setBusy(false);
        }
    };

    const disableBrowserNotifications = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await disableWebPush();
            setPush(await getPushState());
            showNotification("success", t("notifications.pushDisabled"));
        } catch {
            showNotification("error", t("notifications.pushError"));
        } finally {
            setBusy(false);
        }
    };

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
            {!search.trim() && <SectionArt theme="notifications"/>}
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("notifications.general")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => void togglePreference("all_note", !note)} data-setting-id="note">
                        <span title="Не кликабельно"><HighlightText text={t("notifications.generalNotifications")} search={search} /></span>
                        <Toggler state={note} setState={(value) => void togglePreference("all_note", value)} stopPropagation={true} />
                    </div>
                    <div className={`settingTogglerDiv ${!note && "settingInactive"}`} onClick={() => { if (note) void togglePreference("new_mess_note", !messNote); }} data-setting-id="messNote">
                        <span title="Не кликабельно"><HighlightText text={t("notifications.newMessages")} search={search} /></span>
                        <Toggler state={messNote} setState={(value) => void togglePreference("new_mess_note", value)} disable={!note} stopPropagation={true} />
                    </div>
                </div>
            </div>
            <div className="notificationPermissionPanel" data-setting-id="browserNotifications">
                <div className={"notificationPermissionStatus " + (permission === "denied" ? "blocked" : "")}>
                    {t("notifications.browserTitle")}: {t("notifications.browser" + (permission === "granted" ? "Granted" : permission === "denied" ? "Denied" : permission === "unsupported" ? "Unsupported" : "Disabled"))}
                </div>
                {permission === "denied" && <p>{t("notifications.permissionHelp")}</p>}
                {iosNeedsInstall && <p>{t("notifications.pushRequiresPwa")}</p>}
                {pushError && <p>{t("notifications.pushError")}</p>}
                {!push.configured && !pushError && <p>{t("notifications.pushUnavailable")}</p>}
                {push.configured && permission === "granted" && push.supported &&
                    <p>{t(push.subscribed ? "notifications.pushActive" : "notifications.pushInactive")}</p>}
                {push.supported && push.configured && permission !== "denied" && (
                    push.subscribed ?
                        <button type="button" className="notificationPermissionSecondary" disabled={busy}
                            onClick={() => void disableBrowserNotifications()}>{t("notifications.pushDisable")}</button> :
                        <button type="button" disabled={busy} onClick={() => void enableBrowserNotifications()}>
                            {t(busy ? "notifications.pushLoading" : "notifications.enableBrowser")}
                        </button>
                )}
                <button type="button" className="notificationPermissionSecondary"
                    onClick={() => setBlackout({ seted: true, module: "PushInstallHelp" })}>
                    {t("notifications.iosAdd")}
                </button>
                <p>{t("notifications.noAdvertising")}</p>
            </div>
        </div>
            <div className="settingInnerDiv" onClick={() => showDevNote()}>
                <div className="settingHeader">
                    {t("notifications.reminders")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => setNewHabitsNote(!habitsNote)} data-setting-id="habitsNote">
                        <span><HighlightText text={t("notifications.remindAboutActivities")} search={search} /></span>
                        <Toggler state={habitsNote} setState={setNewHabitsNote} />
                    </div>
                    <div className={`settingTogglerDiv ${!habitsNote && "settingInactive"}`} data-setting-id="commonReminderTime">
                        <span><HighlightText text={t("notifications.commonReminderTime")} search={search} /></span>
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