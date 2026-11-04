import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import SelectList from "../../../../components/ts/SelectList";
import HighlightText from "../../../../components/ts/HighlightText";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useContacts } from "../../../../components/hooks/ContactsHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { api } from "../../../../components/ts/api";
import { QuickActionVisual } from "../../../../components/ts/utils/quickActions";
import type { QuickAction, QuickActionType } from "../../../../components/context/SettingsContext";
import "./QuickActionsSettings.scss";

export default function QuickActionsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { quickActions, setQuickActions, settingsLoaded } = useSettings();
    const { habits } = useHabits();
    const { list } = useContacts();
    const { showNotification } = useNote();
    const [ kind, setKind ] = useState("");
    const [ query, setQuery ] = useState("");
    const [ saving, setSaving ] = useState(false);

    const choices = [
        { value: "feed", label: t("general.quickActionsFeed") },
        { value: "settings", label: t("general.quickActionsSettings") },
        { value: "profile", label: t("general.quickActionsProfile") },
        { value: "habits", label: t("general.quickActionsHabits") },
        { value: "habit", label: t("general.quickActionsHabit") },
        { value: "chat", label: t("general.quickActionsChat") },
    ];

    const save = async (next: QuickAction[]) => {
        if (saving || !settingsLoaded || next.length > 3) return;
        const previous = quickActions;
        setQuickActions(next);
        setSaving(true);
        try {
            const result = await api.post("updatesettings", { quick_actions: next });
            if (!result.data?.success) throw new Error("Quick actions not saved");
            setKind("");
            setQuery("");
        } catch {
            setQuickActions(previous);
            showNotification("error", t("general.quickActionsError"));
        } finally {
            setSaving(false);
        }
    };

    const add = (action: QuickAction) => {
        if (quickActions.length >= 3 || quickActions.some(item =>
            item.type === action.type && item.target === action.target)) return;
        void save([...quickActions, action]);
    };

    const choose = (value: string) => {
        setKind(value);
        setQuery("");
        if (value !== "habit" && value !== "chat") add({ type: value as QuickActionType });
    };

    const visibleHabits = (habits ?? []).filter(item => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const visibleChats = list.filter(item => (item.name || item.nick).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    const isFull = quickActions.length >= 3;

    return (
        <div className="settingInnerDiv" data-setting-id="quickActions">
            <div className="settingHeader">
                <HighlightText text={t("general.quickActionsTitle")} search={search}/>
            </div>
            <div className="settingHint">{t("general.quickActionsDesc")}</div>
            <div className="quickActionsSettings">
                {quickActions.map((action, index) => (
                    <div className="quickActionSelected" key={`${action.type}:${action.target || ""}`}>
                        <QuickActionVisual action={action}/>
                        <div className="quickActionControls">
                            <button type="button" disabled={saving || index === 0} aria-label={t("general.quickActionsUp")}
                                onClick={() => {
                                    const next = [...quickActions];
                                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                    void save(next);
                                }}><ArrowUpIcon/></button>
                            <button type="button" disabled={saving || index === quickActions.length - 1} aria-label={t("general.quickActionsDown")}
                                onClick={() => {
                                    const next = [...quickActions];
                                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                    void save(next);
                                }}><ArrowDownIcon/></button>
                            <button type="button" disabled={saving} aria-label={t("general.quickActionsRemove")}
                                onClick={() => void save(quickActions.filter((_, i) => i !== index))}><TrashIcon/></button>
                        </div>
                    </div>
                ))}
                {!isFull && (
                    <>
                        <div className="quickActionPicker">
                            <PlusIcon size={20}/>
                            <SelectList className="quickActionsSelect" arr={choices}
                                placeholder={t("general.quickActionsSelect")} selected={kind}
                                onChange={choose}/>
                        </div>
                        {(kind === "habit" || kind === "chat") && (
                            <div className="quickActionCandidates">
                                <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("general.quickActionsFind")}/>
                                <div className="quickActionCandidatesList">
                                    {kind === "habit" && visibleHabits.map(item => (
                                        <button type="button" key={item.id} disabled={saving || quickActions.some(a => a.type === "habit" && a.target === String(item.id))}
                                            onClick={() => add({ type: "habit", target: String(item.id), label: item.name })}>
                                            <QuickActionVisual action={{ type: "habit", target: String(item.id), label: item.name }}/>
                                        </button>
                                    ))}
                                    {kind === "chat" && visibleChats.map(item => (
                                        <button type="button" key={item.id} disabled={saving || quickActions.some(a => a.type === "chat" && a.target === (item.is_group ? `g/${item.id}` : item.nick))}
                                            onClick={() => add({ type: "chat", target: item.is_group ? `g/${item.id}` : item.nick, label: item.name || item.nick })}>
                                            <QuickActionVisual action={{ type: "chat", target: item.is_group ? `g/${item.id}` : item.nick, label: item.name || item.nick }}/>
                                        </button>
                                    ))}
                                    {(kind === "habit" ? visibleHabits.length === 0 : visibleChats.length === 0) && <span>{t("general.quickActionsEmpty")}</span>}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {isFull && <div className="settingHint">{t("general.quickActionsLimit")}</div>}
            </div>
        </div>
    );
}
