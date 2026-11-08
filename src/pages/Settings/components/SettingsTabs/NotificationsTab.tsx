import { useEffect, useState } from "react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import "../../../../scss/habitsNoteTable.scss";
import { TagIcon } from "../../../HabitPage/utils/TagIcon";
import { CaretDownIcon } from "@phosphor-icons/react";
import { formatClock } from "../../../../components/ts/utils/dateToStr";
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
    const { note, messNote } = useSettings();
    const { setNewNote, setNewMessNote, setNewHabitsNote } = useUpSettings();
    const { habits } = useHabits();
    const { showNotification } = useNote()
    const { setBlackout } = useBlackout();
    const [showNoteList, setShowNoteList] = useState<number>(0);
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">(browserPermission);
    const [push, setPush] = useState<PushState>({ supported: false, configured: false, subscribed: false, publicKey: null });
    const [busy, setBusy] = useState(false);
    const [pushError, setPushError] = useState(false);
    const iosNeedsInstall = isIOS() && !isStandalonePWA();
    type ReminderRule = { habit_id: number; code: string; minutes_before: number; fixed_time: string | null };
    type ReminderPreferences = { enabled: boolean; commonEnabled: boolean; commonTime: string; timezone: string };
    const [reminderPrefs, setReminderPrefs] = useState<ReminderPreferences>({
        enabled: false, commonEnabled: true, commonTime: "18:00",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    });
    const [reminderRules, setReminderRules] = useState<ReminderRule[]>([]);
    const [remindersLoaded, setRemindersLoaded] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [busyHabit, setBusyHabit] = useState<number | null>(null);
    const [reminderDrafts, setReminderDrafts] = useState<Record<string, string>>({});

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

    useEffect(() => {
        let mounted = true;
        void api.get("settings/reminders").then(response => {
            if (!mounted || !response.data?.success) return;
            const next: ReminderPreferences = response.data.preferences;
            const items: ReminderRule[] = response.data.rules || [];
            setReminderPrefs(next);
            setReminderRules(items);
            setNewHabitsNote(next.enabled);
            setReminderDrafts(Object.fromEntries(items.map(rule => [
                `${rule.habit_id}:${rule.code}`,
                rule.code === "inp" ? (rule.fixed_time || "18:00").slice(0, 5) : String(rule.minutes_before)
            ])));
            setRemindersLoaded(true);
        }).catch(() => {
            if (mounted) showNotification("error", t("notifications.remindersLoadError"));
        });
        return () => { mounted = false; };
    }, []);

    const saveReminderPreferences = async (next: ReminderPreferences) => {
        if (reminderBusy || !remindersLoaded) return;
        setReminderBusy(true);
        try {
            const response = await api.post("settings/reminders/preferences", next);
            if (!response.data?.success) throw new Error("reminders");
            setReminderPrefs(response.data.preferences);
            setNewHabitsNote(response.data.preferences.enabled);
        } catch {
            showNotification("error", t("notifications.remindersSaveError"));
        } finally {
            setReminderBusy(false);
        }
    };

    const saveHabitRule = async (habitId: number, code: string, updating = false) => {
        if (busyHabit !== null || !remindersLoaded) return;
        const previous = reminderRules.filter(rule => rule.habit_id === habitId);
        const old = previous.find(rule => rule.code === code);
        const draft = reminderDrafts[`${habitId}:${code}`] || (code === "inp" ? "18:00" : "5");
        const isCustom = code === "inpstart" || code === "inpend";
        const minutes = isCustom ? Number(draft) : code.startsWith("10") ? 10 : code.startsWith("60") ? 60 : 0;
        const fixed = code === "inp" ? draft : null;
        if ((isCustom && (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440)) ||
            (code === "inp" && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(draft))) {
            showNotification("error", t("notifications.invalidReminderTime"));
            return;
        }
        const next = previous.filter(rule => rule.code !== code);
        if (!old || updating) next.push({ habit_id: habitId, code, minutes_before: minutes, fixed_time: fixed });
        setBusyHabit(habitId);
        try {
            const response = await api.post("settings/reminders/habit", {
                habitId, rules: next.map(rule => ({ code: rule.code, minutes_before: rule.minutes_before, fixed_time: rule.fixed_time }))
            });
            if (!response.data?.success) throw new Error("reminders");
            setReminderRules(items => [
                ...items.filter(rule => rule.habit_id !== habitId),
                ...response.data.rules.map((rule: ReminderRule) => ({ ...rule, habit_id: habitId }))
            ]);
        } catch {
            showNotification("error", t("notifications.remindersSaveError"));
        } finally {
            setBusyHabit(null);
        }
    };

    const togglePreference = async (key: "all_note" | "new_mess_note", value: boolean) => {
        const update = key === "all_note" ? setNewNote : setNewMessNote;
        update(value);
        try {
            const response = await api.post("updatesettings", { [key]: value });
            if (!response.data?.success) throw new Error("update");
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
                        <span><HighlightText text={t("notifications.generalNotifications")} search={search} /></span>
                        <Toggler state={note} setState={(value: boolean) => void togglePreference("all_note", value)} stopPropagation={true} />
                    </div>
                    <div className={`settingTogglerDiv ${!note && "settingInactive"}`} onClick={() => { if (note) void togglePreference("new_mess_note", !messNote); }} data-setting-id="messNote">
                        <span><HighlightText text={t("notifications.newMessages")} search={search} /></span>
                        <Toggler state={messNote} setState={(value: boolean) => void togglePreference("new_mess_note", value)} disable={!note} stopPropagation={true} />
                    </div>
                </div>
                <div className="notificationPermissionPanel" data-setting-id="browserNotifications">
                    <div className="settingTogglerDiv notificationPushToggle"
                        onClick={() => {
                            if (!busy && !pushError && push.supported && push.configured && permission !== "denied") {
                                void (push.subscribed ? disableBrowserNotifications() : enableBrowserNotifications());
                            }
                        }}>
                        <div className="notificationPushText">
                            <span>{t("notifications.pushToggleTitle")}</span>
                            <p>{t("notifications.pushToggleHint")}</p>
                        </div>
                        <Toggler state={push.subscribed}
                            disable={busy || pushError || !push.supported || !push.configured || permission === "denied"}
                            onToggle={(value: boolean) => void (value ? enableBrowserNotifications() : disableBrowserNotifications())}
                            stopPropagation={true}/>
                    </div>
                    <div className={"notificationPermissionStatus " + (permission === "denied" ? "blocked" : "")}>
                        {t("notifications.browserTitle")}: {t("notifications.browser" + (permission === "granted" ? "Granted" : permission === "denied" ? "Denied" : permission === "unsupported" ? "Unsupported" : "Disabled"))}
                    </div>
                    {permission === "denied" && <p>{t("notifications.permissionHelp")}</p>}
                    {iosNeedsInstall && <p>{t("notifications.pushRequiresPwa")}</p>}
                    {pushError && <p>{t("notifications.pushError")}</p>}
                    {!push.configured && !pushError && <p>{t("notifications.pushUnavailable")}</p>}
                    {!push.supported && !iosNeedsInstall && !pushError &&
                        <p>{t("notifications.pushNotSupported")}</p>}
                    {push.configured && push.supported && permission === "granted" &&
                        <p>{t(push.subscribed ? "notifications.pushActive" : "notifications.pushInactive")}</p>}
                    {iosNeedsInstall && <button type="button" className="notificationPermissionSecondary"
                        onClick={() => setBlackout({ seted: true, module: "PushInstallHelp" })}>
                        {t("notifications.iosAdd")}
                    </button>}
                    <p className="notificationNoAdvertising">{t("notifications.noAdvertising")}</p>
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    {t("notifications.reminders")}
                </div>
                <div className="settingInnerList">
                    <div className="settingTogglerDiv" onClick={() => { if (remindersLoaded) void saveReminderPreferences({ ...reminderPrefs, enabled: !reminderPrefs.enabled }); }} data-setting-id="habitsNote">
                        <span><HighlightText text={t("notifications.remindAboutActivities")} search={search} /></span>
                        <Toggler state={reminderPrefs.enabled} onToggle={(value: boolean) => void saveReminderPreferences({ ...reminderPrefs, enabled: value })}
                            disable={!remindersLoaded || reminderBusy} stopPropagation={true}/>
                    </div>
                    <div className={`settingTogglerDiv ${!reminderPrefs.enabled && "settingInactive"}`} data-setting-id="commonReminderTime">
                        <span><HighlightText text={t("notifications.commonReminderTime")} search={search} /></span>
                        <Toggler state={reminderPrefs.commonEnabled}
                            onToggle={(value: boolean) => void saveReminderPreferences({ ...reminderPrefs, commonEnabled: value })}
                            disable={!remindersLoaded || reminderBusy || !reminderPrefs.enabled} stopPropagation={true}/>
                    </div>
                    {reminderPrefs.enabled && reminderPrefs.commonEnabled && <div className="settingTogglerDiv">
                        <label htmlFor="commonHabitReminderTime">{t("notifications.reminderAt")}</label>
                        <input id="commonHabitReminderTime" type="time" className="extraInfoInput"
                            disabled={reminderBusy} value={reminderPrefs.commonTime}
                            onChange={event => void saveReminderPreferences({ ...reminderPrefs, commonTime: event.target.value })}/>
                    </div>}
                    {!push.subscribed && <span className="settingHint">{t("notifications.remindersPushHint")}</span>}
                </div>
                <div className={`settingsInnerDiv ${!reminderPrefs.enabled && "settingInactive"}`}>
                    <div className="settingInnerList">
                        <div className="habitsNoteTable">
                            {habits?.filter(h => h.ongoing).sort((a, b) => a.id - b.id).map((h) => {
                                let timePart = "";
                                if (h.start_time && h.end_time) {
                                    timePart = t("notifications.fromTo", { start: formatClock(h.start_time), end: formatClock(h.end_time) });
                                } else if (h.start_time) {
                                    timePart = t("notifications.startsAt", { time: formatClock(h.start_time) });
                                } else if (h.end_time) {
                                    timePart = t("notifications.until", { time: formatClock(h.end_time) });
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
                                                <div className={`habitNoteTime ${!reminderPrefs.enabled && "settingInactive"}`}>
                                                    {timePart}
                                                </div>
                                            </div>
                                            <div className="habitNoteCounter">
                                                {t("notifications.notificationsCount", { count: reminderRules.filter(rule => rule.habit_id === h.id).length })}
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
                                                            <div className="habitNoteRule" key={n.value}>
                                                                <button type="button" className={`habitNoteArrayButton ${reminderRules.some(rule => rule.habit_id === h.id && rule.code === n.value) ? "selected" : ""}`}
                                                                    disabled={!remindersLoaded || busyHabit !== null || !reminderPrefs.enabled}
                                                                    onClick={() => void saveHabitRule(h.id, n.value)}>{n.label}</button>
                                                                {n.input && <input className="extraInfoInput" type={n.value === "inp" ? "time" : "number"}
                                                                    min={n.value === "inp" ? undefined : 1} max={n.value === "inp" ? undefined : 1440}
                                                                    value={reminderDrafts[`${h.id}:${n.value}`] || (n.value === "inp" ? "18:00" : "5")}
                                                                    disabled={!remindersLoaded || busyHabit !== null || !reminderPrefs.enabled}
                                                                    onChange={event => setReminderDrafts(previous => ({ ...previous, [`${h.id}:${n.value}`]: event.target.value }))}
                                                                    onBlur={() => { if (reminderRules.some(rule => rule.habit_id === h.id && rule.code === n.value)) void saveHabitRule(h.id, n.value, true); }}/>
                                                                }
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