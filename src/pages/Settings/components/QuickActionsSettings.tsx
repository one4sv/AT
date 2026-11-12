import { useRef, useState, type PointerEvent } from "react";
import { ListIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import HighlightText from "../../../components/ts/HighlightText";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { useNote } from "../../../components/hooks/NoteHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { api } from "../../../components/ts/api";
import { QuickActionVisual } from "../../../components/ts/utils/quickActions";
import type { QuickAction } from "../../../components/context/SettingsContext";
import "../scss/QuickActionsSettings.scss";

export default function QuickActionsSettings({ search }: { search: string }) {
    const { t } = useTranslation("settings");
    const { quickActions, setQuickActions, settingsLoaded } = useSettings();
    const { setBlackout } = useBlackout();
    const { showNotification } = useNote();
    const [ saving, setSaving ] = useState(false);
    const [ preview, setPreview ] = useState<QuickAction[] | null>(null);
    const [ dragging, setDragging ] = useState(false);
    const savingRef = useRef(false);
    const previewRef = useRef<QuickAction[] | null>(null);
    const dragRef = useRef<{ id: number; index: number; changed: boolean } | null>(null);

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

    const startDrag = (e: PointerEvent<HTMLButtonElement>, index: number) => {
        if (savingRef.current || quickActions.length < 2) return;
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = { id: e.pointerId, index, changed: false };
        previewRef.current = [...quickActions];
        setPreview([...quickActions]);
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const moveDrag = (e: PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== e.pointerId || !previewRef.current) return;
        e.preventDefault();
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const target = element?.closest<HTMLElement>(".quickActionSelected");
        if (!target) return;
        const index = Number(target.dataset.index);
        if (!Number.isInteger(index) || index < 0 || index >= previewRef.current.length ||
            index === drag.index) return;

        const next = [...previewRef.current];
        next.splice(index, 0, ...next.splice(drag.index, 1));
        drag.index = index;
        drag.changed = true;
        previewRef.current = next;
        setPreview(next);
    };

    const finishDrag = (e: PointerEvent<HTMLButtonElement>, cancel = false) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== e.pointerId) return;
        const next = previewRef.current;
        dragRef.current = null;
        previewRef.current = null;
        setDragging(false);
        setPreview(null);

        if (!cancel && drag.changed && next &&
            next.some((action, index) => action !== quickActions[index])) void save(next);
    };

    const moveByKeyboard = (index: number, direction: number) => {
        const nextIndex = index + direction;
        if (saving || nextIndex < 0 || nextIndex >= quickActions.length) return;
        const next = [...quickActions];
        next.splice(nextIndex, 0, ...next.splice(index, 1));
        void save(next);
    };

    const items = preview ?? quickActions;

    return (
        <div className="settingInnerDiv" data-setting-id="quickActions">
            <div className="settingHeader">
                <HighlightText text={t("general.quickActionsTitle")} search={search}/>
            </div>
            <div className="settingHint">{t("general.quickActionsDesc")}</div>
            <div className="quickActionsSettings">
                {items.map((action, index) => (
                    <div className={`quickActionSelected ${dragging && dragRef.current?.index === index ? "dragging" : ""}`}
                        key={`${action.type}:${action.target || ""}`} data-index={index}>
                        <button type="button" className="quickActionDragHandle" data-no-pull-refresh="true"
                            disabled={saving || items.length < 2}
                            aria-label={t("general.quickActionsUp") + " / " + t("general.quickActionsDown")}
                            onPointerDown={e => startDrag(e, index)}
                            onPointerMove={moveDrag}
                            onPointerUp={e => finishDrag(e)}
                            onPointerCancel={e => finishDrag(e, true)}
                            onKeyDown={e => {
                                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                    e.preventDefault();
                                    moveByKeyboard(index, e.key === "ArrowUp" ? -1 : 1);
                                }
                            }}
                        ><ListIcon size={20}/></button>
                        <QuickActionVisual action={action}/>
                        <button type="button" className="quickActionRemove"
                            disabled={saving} aria-label={t("general.quickActionsRemove")}
                            onClick={() => void save(quickActions.filter((_, i) => i !== index))}
                        ><TrashIcon size={19}/></button>
                    </div>
                ))}
                {quickActions.length < 3 ? (
                    <button type="button" className="quickActionAdd"
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
