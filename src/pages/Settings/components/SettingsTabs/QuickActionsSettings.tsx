import { useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../../components/ts/HighlightText";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useNote } from "../../../../components/hooks/NoteHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { api } from "../../../../components/ts/api";
import { QuickActionVisual } from "../../../../components/ts/utils/quickActions";
import type { QuickAction } from "../../../../components/context/SettingsContext";
import "./QuickActionsSettings.scss";

export default function QuickActionsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { quickActions, setQuickActions, settingsLoaded } = useSettings();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ saving, setSaving ] = useState(false);
    const savingRef = useRef(false);

    const save = async (next: QuickAction[]) => {
        if (savingRef.current || !settingsLoaded || next.length > 3) return;
        savingRef.current = true;
        const previous = quickActions;
        setQuickActions(next);
        setSaving(true);
        try {
            const result = await api.post("updatesettings", { quick_actions: next });
            if (!result.data?.success) throw new Error("Quick actions not saved");
        } catch {
            setQuickActions(previous);
            showNotification("error", t("general.quickActionsError"));
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

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
                {quickActions.length < 3 ? (
                    <button
                        type="button"
                        className="quickActionAdd"
                        disabled={saving || !settingsLoaded}
                        onClick={() => setBlackout({ seted: true, module: "QuickActionPicker" })}
                    >
                        <PlusIcon size={20}/>
                        {t("general.quickActionsAdd")}
                    </button>
                ) : <div className="settingHint">{t("general.quickActionsLimit")}</div>}
            </div>
        </div>
    );
}
