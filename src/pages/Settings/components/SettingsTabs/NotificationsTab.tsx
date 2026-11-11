import { useEffect, useState } from "react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import Toggler from "../../../../components/ts/Toggler";
import "../../../../scss/habitsNoteTable.scss";
import { TagIcon } from "../../../HabitPage/utils/TagIcon";
import { BellIcon, CheckIcon, MagnifyingGlassIcon, SlidersHorizontalIcon, ClockIcon } from "@phosphor-icons/react";
import { formatClock } from "../../../../components/ts/utils/dateToStr";
import { useTranslation } from "react-i18next";
import { useNote } from "../../../../components/hooks/NoteHook";
import HighlightText from "../../../../components/ts/HighlightText";

import SectionArt from "../../../../components/ts/SectionArt";
import { getPushState, enableWebPush, disableWebPush, isIOS, isStandalonePWA, type PushState } from "../../../../components/ts/utils/webPush";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { api } from "../../../../components/ts/api";
import "./notificationPermission.scss";
import PlanRemindersSettings from "./PlanRemindersSettings";

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
    const [reminderSearch, setReminderSearch] = useState("");
    const [configuredOnly, setConfiguredOnly] = useState(false);
    const [commonTimeDraft, setCommonTimeDraft] = useState("18:00");
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
            setCommonTimeDraft(next.commonTime.slice(0, 5));
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
            setCommonTimeDraft(response.data.preferences.commonTime.slice(0, 5));
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
        const draft = reminderDrafts[`${habitId}:${code}`] ?? (code === "inp" ? "18:00" : "5");
        const isCustom = code === "inpstart" || code === "inpend";
        const minutes = isCustom ? Number(draft) : code.startsWith("10") ? 10 : code.startsWith("60") ? 60 : 0;
        const fixed = code === "inp" ? draft : null;
        if ((!old || updating) && ((isCustom && (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440)) ||
            (code === "inp" && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(draft)))) {
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

    const commitCommonTime = () => {
        if (!remindersLoaded || reminderBusy || !reminderPrefs.enabled || !reminderPrefs.commonEnabled) return;
        if (commonTimeDraft === reminderPrefs.commonTime.slice(0, 5)) return;
        if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(commonTimeDraft)) {
            showNotification("error", t("notifications.invalidReminderTime"));
            setCommonTimeDraft(reminderPrefs.commonTime.slice(0, 5));
            return;
        }
        void saveReminderPreferences({ ...reminderPrefs, commonTime: commonTimeDraft });
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

    const activeHabits = (habits || []).filter(h => h.ongoing).sort((a, b) => a.id - b.id);
    const visibleHabits = activeHabits.filter(h =>
        h.name.toLocaleLowerCase().includes(reminderSearch.trim().toLocaleLowerCase()) &&
        (!configuredOnly || reminderRules.some(rule => rule.habit_id === h.id))
    );
    const configuredHabits = activeHabits.filter(h => reminderRules.some(rule => rule.habit_id === h.id)).length;
    const selectedHabit = visibleHabits.find(h => h.id === showNoteList) || visibleHabits[0] || null;
    const selectedRules = selectedHabit ? reminderRules.filter(rule => rule.habit_id === selectedHabit.id) : [];
    const selectedTime = selectedHabit ? [
        selectedHabit.start_time && t("notifications.startsAt", { time: formatClock(selectedHabit.start_time) }),
        selectedHabit.end_time && t("notifications.until", { time: formatClock(selectedHabit.end_time) })
    ].filter(Boolean).join(" · ") : "";

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
            <div className="settingInnerDiv habitRemindersDiv">
                <div className="settingHeader">{t("notifications.reminders")}</div>
                <p className="habitRemindersDescription">{t("notifications.remindersDescription")}</p>
                <div className="habitReminderOverview">
                    <div className="habitReminderOverviewIcon"><BellIcon size={24}/></div>
                    <div className="habitReminderOverviewText">
                        <span>{t(reminderPrefs.enabled ? "notifications.remindersEnabled" : "notifications.remindersDisabled")}</span>
                        <small>{t("notifications.reminderTimezone", { timezone: reminderPrefs.timezone })}</small>
                    </div>
                    <span className={"habitReminderOverviewCount " + (configuredHabits ? "active" : "")}>
                        {configuredHabits} / {activeHabits.length}
                    </span>
                </div>
                <div className="habitReminderControls">
                    <div className="habitReminderControl settingTogglerDiv" data-setting-id="habitsNote"
                        onClick={() => { if (remindersLoaded && !reminderBusy) void saveReminderPreferences({ ...reminderPrefs, enabled: !reminderPrefs.enabled }); }}>
                        <div className="habitReminderControlText">
                            <span><HighlightText text={t("notifications.remindAboutActivities")} search={search}/></span>
                            <small>{t("notifications.reminderGeneralHint")}</small>
                        </div>
                        <Toggler state={reminderPrefs.enabled}
                            onToggle={(value: boolean) => void saveReminderPreferences({ ...reminderPrefs, enabled: value })}
                            disable={!remindersLoaded || reminderBusy} stopPropagation={true}/>
                    </div>
                    <div className={"habitReminderControl settingTogglerDiv " + (!reminderPrefs.enabled ? "settingInactive" : "")}
                        data-setting-id="commonReminderTime"
                        onClick={() => { if (remindersLoaded && !reminderBusy && reminderPrefs.enabled) void saveReminderPreferences({ ...reminderPrefs, commonEnabled: !reminderPrefs.commonEnabled }); }}>
                        <div className="habitReminderControlText">
                            <span><HighlightText text={t("notifications.commonReminderTime")} search={search}/></span>
                            <small>{t("notifications.commonReminderHint")}</small>
                        </div>
                        <Toggler state={reminderPrefs.commonEnabled}
                            onToggle={(value: boolean) => void saveReminderPreferences({ ...reminderPrefs, commonEnabled: value })}
                            disable={!remindersLoaded || reminderBusy || !reminderPrefs.enabled} stopPropagation={true}/>
                    </div>
                    {reminderPrefs.enabled && reminderPrefs.commonEnabled && <div className="habitReminderCommonTime">
                        <label htmlFor="commonHabitReminderTime">{t("notifications.reminderAt")}</label>
                        <input id="commonHabitReminderTime" type="time"
                            disabled={!remindersLoaded || reminderBusy}
                            value={commonTimeDraft}
                            onChange={event => setCommonTimeDraft(event.target.value)}
                            onBlur={commitCommonTime}
                            onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}/>
                    </div>}
                    {!push.subscribed && <p className="habitReminderPushHint">{t("notifications.remindersPushHint")}</p>}
                </div>
                <div className="habitRemindersCatalog">
                    <div className="habitRemindersCatalogHeading">
                        <div className="habitRemindersCatalogTitle">
                            <SlidersHorizontalIcon size={20}/>
                            <span>{t("notifications.activityReminders")}</span>
                        </div>
                        <small>{t("notifications.configuredHabits", { count: configuredHabits })}</small>
                    </div>
                    <p className="habitRemindersDescription">{t("notifications.reminderEditorIntro")}</p>
                    <div className="habitRemindersToolbar">
                        <label className="habitRemindersSearch">
                            <MagnifyingGlassIcon size={18} aria-hidden="true"/>
                            <input type="search" value={reminderSearch}
                                onChange={event => setReminderSearch(event.target.value)}
                                placeholder={t("notifications.remindersSearch")}
                                aria-label={t("notifications.remindersSearch")}/>
                        </label>
                        <div className="habitReminderFilters" role="group" aria-label={t("notifications.activityReminders")}>
                            <button type="button" className={!configuredOnly ? "active" : ""}
                                aria-pressed={!configuredOnly} onClick={() => setConfiguredOnly(false)}>
                                {t("notifications.allActivities")}
                            </button>
                            <button type="button" className={configuredOnly ? "active" : ""}
                                aria-pressed={configuredOnly} onClick={() => setConfiguredOnly(true)}>
                                {t("notifications.configuredActivities")}
                            </button>
                        </div>
                    </div>
                    <div className="habitRemindersWorkspace">
                        <div className="habitRemindersList" aria-label={t("notifications.activityReminders")}>
                            {visibleHabits.map(h => {
                                const active = selectedHabit?.id === h.id;
                                const count = reminderRules.filter(rule => rule.habit_id === h.id).length;
                                return (
                                    <button type="button" className={"habitReminderListItem " + (active ? "active" : "")}
                                        key={h.id} aria-pressed={active} onClick={() => setShowNoteList(h.id)}>
                                        <span className="habitReminderListIcon">{TagIcon(h, h.tag)}</span>
                                        <span className="habitReminderListInfo">
                                            <span>{h.name}</span>
                                            <small>{count ? t("notifications.notificationsCount", { count }) : t("notifications.remindersNoRules")}</small>
                                        </span>
                                        {count > 0 && <span className="habitReminderActiveDot"/>}
                                    </button>
                                );
                            })}
                            {!visibleHabits.length && <div className="habitRemindersEmpty">
                                {activeHabits.length ? t("notifications.remindersNoMatch") : t("notifications.remindersNoActivities")}
                            </div>}
                        </div>
                        <div className="habitRemindersEditor">
                            {selectedHabit ? <>
                                <div className="habitReminderEditorHeader">
                                    <div className="habitReminderEditorTitle">
                                        <span className="habitReminderListIcon">{TagIcon(selectedHabit, selectedHabit.tag)}</span>
                                        <div>
                                            <span>{selectedHabit.name}</span>
                                            <small>{selectedTime || t("notifications.noActivityTime")}</small>
                                        </div>
                                    </div>
                                    <span className="habitReminderEditorCount">
                                        {t("notifications.notificationsCount", { count: selectedRules.length })}
                                    </span>
                                </div>
                                <p className="habitNoteHelp">{t("notifications.remindersRuleHint")}</p>
                                {!reminderPrefs.enabled && <p className="habitNoteHelp inactive">{t("notifications.remindersInactiveHint")}</p>}
                                <div className="habitReminderEditorSections">
                                    {habitNoteArray.map((section, index) => (
                                        <div className={"habitReminderEventSection " + (((index === 0 && !selectedHabit.start_time) || (index === 2 && !selectedHabit.end_time)) ? "unavailable" : "")} key={section.title}>
                                            <div className="habitReminderEventHeader">
                                                <ClockIcon size={17}/>
                                                <span>{section.title}</span>
                                            </div>
                                            <div className={"habitReminderEvents " + (index === 1 ? "atTime" : "")}>
                                                {section.options.map(option => {
                                                    const rule = selectedRules.find(item => item.code === option.value);
                                                    const unavailable = (index === 0 && !selectedHabit.start_time) || (index === 2 && !selectedHabit.end_time);
                                                    const selected = !!rule;
                                                    const key = `${selectedHabit.id}:${option.value}`;
                                                    const draft = reminderDrafts[key] ?? (option.value === "inp" ? "18:00" : "5");
                                                    return (
                                                        <div className={"habitReminderEvent " + (selected ? "selected " : "") + (unavailable ? "unavailable" : "")} key={option.value}>
                                                            <button type="button" className="habitReminderEventButton" aria-pressed={selected}
                                                                disabled={!remindersLoaded || busyHabit !== null || !reminderPrefs.enabled || unavailable}
                                                                onClick={() => void saveHabitRule(selectedHabit.id, option.value)}>
                                                                <span className="habitReminderEventCheck">
                                                                    {selected && <CheckIcon size={14} aria-hidden="true"/>}
                                                                </span>
                                                                <span>{option.label}</span>
                                                            </button>
                                                            {option.input && <label className="habitNoteCustomInput">
                                                                <input type={option.value === "inp" ? "time" : "number"}
                                                                    aria-label={option.value === "inp" ? t("notifications.atTime") : t("notifications.minutesBefore")}
                                                                    min={option.value === "inp" ? undefined : 1}
                                                                    max={option.value === "inp" ? undefined : 1440}
                                                                    value={draft}
                                                                    disabled={!remindersLoaded || busyHabit !== null || !reminderPrefs.enabled || unavailable}
                                                                    onChange={event => setReminderDrafts(previous => ({
                                                                        ...previous, [key]: event.target.value
                                                                    }))}
                                                                    onBlur={() => {
                                                                        if (!rule) return;
                                                                        const saved = option.value === "inp" ? (rule.fixed_time || "").slice(0, 5) : String(rule.minutes_before);
                                                                        if (saved !== draft) void saveHabitRule(selectedHabit.id, option.value, true);
                                                                    }}
                                                                    onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}/>
                                                                {option.value !== "inp" && <span>{t("notifications.minutesUnit")}</span>}
                                                            </label>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {index === 0 && !selectedHabit.start_time && <small className="habitReminderEventHint">{t("notifications.reminderNeedsStart")}</small>}
                                            {index === 2 && !selectedHabit.end_time && <small className="habitReminderEventHint">{t("notifications.reminderNeedsEnd")}</small>}
                                        </div>
                                    ))}
                                </div>
                                <p className="habitReminderSaveHint">
                                    {busyHabit === selectedHabit.id ? t("notifications.reminderSaving") : t("notifications.reminderAutoSaved")}
                                </p>
                            </> : <div className="habitReminderEditorEmpty">
                                <BellIcon size={30}/>
                                <span>{t("notifications.reminderPickActivity")}</span>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
            <PlanRemindersSettings search={search}/>
        </div>
    );
}
