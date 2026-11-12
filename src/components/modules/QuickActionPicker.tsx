import { useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/SettingsHook";
import { useUser } from "../hooks/UserHook";
import { useHabits } from "../hooks/HabitsHook";
import { useContacts } from "../hooks/ContactsHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
import { QuickActionVisual } from "../ts/utils/quickActions";
import type { QuickAction, QuickActionType } from "../context/SettingsContext";
import "../../pages/Settings/scss/QuickActionsSettings.scss";

export default function QuickActionPicker() {
    const { t } = useTranslation("settings");
    const { quickActions, setQuickActions, settingsLoaded } = useSettings();
    const { habits, loadingHabits } = useHabits();
    const { list, loadingList } = useContacts();
    const { user } = useUser();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ kind, setKind ] = useState<"habit" | "chat" | null>(null);
    const [ query, setQuery ] = useState("");
    const [ filter, setFilter ] = useState("all");
    const [ saving, setSaving ] = useState(false);
    const savingRef = useRef(false);

    const choices: { type: QuickActionType }[] = [
        { type: "feed" }, { type: "settings" }, { type: "profile" },
        { type: "habits" }, { type: "habit" }, { type: "chat" }
    ];

    const add = async (action: QuickAction) => {
        if (savingRef.current || !settingsLoaded || quickActions.length >= 3 ||
            quickActions.some(item => item.type === action.type && item.target === action.target)) return;

        savingRef.current = true;
        setSaving(true);
        const previous = quickActions;
        const next = [...quickActions, action];
        setQuickActions(next);
        try {
            const res = await api.post("updatesettings", { quick_actions: next });
            if (!res.data?.success) throw new Error("Could not save action");
            setBlackout({ seted: false });
        } catch {
            setQuickActions(previous);
            showNotification("error", t("general.quickActionsError"));
        } finally {
            setSaving(false);
            savingRef.current = false;
        }
    };

    const choose = (type: QuickActionType) => {
        if (type === "habit" || type === "chat") {
            setKind(type);
            setQuery("");
            setFilter("all");
            return;
        }
        void add({ type });
    };

    const filteredHabits = (habits ?? []).filter(item =>
        item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
        (filter === "all" || (filter === "mine" ? item.user_id === user.id : item.user_id !== user.id))
    );
    const filteredChats = list.filter(item =>
        (item.name || item.nick).toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
        (filter === "all" || (filter === "group" ? item.is_group : !item.is_group))
    );

    return (
        <div className="quickActionModal" role="dialog" aria-modal="true" aria-label={t("general.quickActionsTitle")}>
            <div className="quickActionModalHeader">
                {kind && (
                    <button type="button" aria-label={t("general.quickActionsSelect")}
                        onClick={() => { setKind(null); setQuery(""); }}><ArrowLeftIcon size={22}/></button>
                )}
                <span>{kind === "habit" ? t("general.quickActionsHabit") :
                    kind === "chat" ? t("general.quickActionsChat") : t("general.quickActionsTitle")}</span>
                <span>{quickActions.length}/3</span>
            </div>
            {kind && (
                <input
                    className="quickActionModalSearch"
                    type="search"
                    autoComplete="off"
                    value={query}
                    placeholder={t("general.quickActionsFind")}
                    onChange={e => setQuery(e.target.value)}
                />
            )}
            {kind && <div className="quickActionFilters">
                {(kind === "habit"
                    ? [["all", t("quickFilters.all")], ["mine", t("quickFilters.mine")], ["shared", t("quickFilters.shared")]]
                    : [["all", t("quickFilters.all")], ["private", t("quickFilters.private")], ["group", t("quickFilters.group")]]
                ).map(([value, label]) => (
                    <button key={value} type="button" className={filter === value ? "active" : ""}
                        onClick={() => setFilter(value)}>{label}</button>
                ))}
            </div>}
            <div className="quickActionModalList" key={kind ?? "all"}>
                {kind && (kind === "habit" ? loadingHabits : loadingList) &&
                    Array.from({ length: 4 }, (_, index) => (
                        <div className="quickActionModalOption" role="status" aria-busy="true" key={index}>
                            <div className="skeletonCircle"/>
                            <div className="skeletonLine skeletonShort"/>
                        </div>
                    ))}
                {!kind && choices.map(({ type }) => {
                    const action: QuickAction = { type };
                    const disabled = saving || quickActions.length >= 3 ||
                        (type !== "habit" && type !== "chat" && quickActions.some(item => item.type === type));
                    return (
                        <button key={type} type="button" className="quickActionModalOption" disabled={disabled}
                            onClick={() => choose(type)}>
                            <QuickActionVisual action={action}/>
                        </button>
                    );
                })}
                {kind === "habit" && !loadingHabits && filteredHabits.map(item => {
                    const action: QuickAction = { type: "habit", target: String(item.id), label: item.name };
                    return (
                        <button key={item.id} type="button" className="quickActionModalOption" disabled={saving || quickActions.some(a => a.type === "habit" && a.target === action.target)}
                            onClick={() => void add(action)}><QuickActionVisual action={action}/></button>
                    );
                })}
                {kind === "chat" && !loadingList && filteredChats.map(item => {
                    const action: QuickAction = {
                        type: "chat",
                        target: item.is_group ? `g/${item.id}` : item.nick,
                        label: item.name || item.nick
                    };
                    return (
                        <button key={item.id} type="button" className="quickActionModalOption" disabled={saving || quickActions.some(a => a.type === "chat" && a.target === action.target)}
                            onClick={() => void add(action)}><QuickActionVisual action={action}/></button>
                    );
                })}
                {kind && !(kind === "habit" ? loadingHabits : loadingList) &&
                    !(kind === "habit" ? filteredHabits.length : filteredChats.length) && (
                    <div className="quickActionModalEmpty">{t("general.quickActionsEmpty")}</div>
                )}
            </div>
        </div>
    );
}
