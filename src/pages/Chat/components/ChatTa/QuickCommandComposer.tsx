import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import SelectList from "../../../../components/ts/SelectList";
import TA from "../../../../components/ts/TA";
import type { QuickCreateDraft } from "../../../../components/ts/utils/quickCreateCommand";

export interface QuickCommandDraft extends QuickCreateDraft {
    weeklyDays?: string;
    cycleActive?: string;
    cycleRest?: string;
}

export default function QuickCommandComposer({ draft, onChange, onSubmit, onCancel, disabled }: {
    draft: QuickCommandDraft;
    onChange: (next: QuickCommandDraft) => void;
    onSubmit: () => void;
    onCancel: () => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation("common");
    const containerRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const update = (key: keyof QuickCommandDraft, value: string) => onChange({ ...draft, [key]: value });

    useEffect(() => {
        nameRef.current?.focus({ preventScroll: true });
    }, [draft.kind]);

    const focusable = () => Array.from(containerRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "[data-quick-field] input, [data-quick-field] textarea"
    ) || []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        const fields = focusable();
        const index = fields.indexOf(target);
        if (index < 0) return;
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (index === fields.length - 1) onSubmit();
            else fields[index + 1].focus({ preventScroll: true });
        } else if (event.key === "Backspace" && !target.value) {
            event.preventDefault();
            if (index === 0) onCancel();
            else fields[index - 1].focus({ preventScroll: true });
        } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    };

    const periodOptions = ["everyday", "weekly", "cycle", "sometimes"].map(value => ({
        value,
        label: t("habitUi.period." + value)
    }));

    return <div ref={containerRef} className="chatQuickComposer" onKeyDown={handleKeyDown}>
        <div className="chatQuickCommandName">/{draft.kind === "habit" ? "act" : "plan"}</div>
        <label data-quick-field>
            <span>{t("chatUi.name")}</span>
            <input ref={nameRef} type="text" required maxLength={draft.kind === "habit" ? 40 : 160}
                disabled={disabled} value={draft.name || ""} onChange={event => update("name", event.target.value)}/>
        </label>
        <label data-quick-field>
            <span>{t("chatUi.description")}</span>
            <TA minHeight={3} maxHeight={12} disabled={disabled}
                maxLength={draft.kind === "habit" ? 120 : 1200}
                value={draft.description || ""} onChange={event => update("description", event.target.value)}/>
        </label>
        {draft.kind === "habit" ? <>
            <div data-quick-field className="chatQuickChoice">
                <span>{t("habitUi.periodicity")}</span>
                <SelectList className="chatQuickPeriod" arr={periodOptions}
                    selected={draft.periodicity || "everyday"}
                    onChange={value => update("periodicity", value)}/>
            </div>
            {draft.periodicity === "weekly" && <label data-quick-field>
                <span>{t("chatUi.quickCommands.days")}</span>
                <input type="text" placeholder={t("chatUi.quickCommands.daysPlaceholder")}
                    disabled={disabled} value={draft.weeklyDays || ""} onChange={event => update("weeklyDays", event.target.value)}/>
            </label>}
            {draft.periodicity === "cycle" && <div className="chatQuickTimeRow">
                <label data-quick-field>
                    <span>{t("habitUi.activeDays")}</span>
                    <input type="number" min={1} max={365} disabled={disabled}
                        value={draft.cycleActive || ""} onChange={event => update("cycleActive", event.target.value)}/>
                </label>
                <label data-quick-field>
                    <span>{t("habitUi.restDays")}</span>
                    <input type="number" min={1} max={365} disabled={disabled}
                        value={draft.cycleRest || ""} onChange={event => update("cycleRest", event.target.value)}/>
                </label>
            </div>}
        </> : <label data-quick-field>
            <span>{t("plans.date")}</span>
            <input type="date" disabled={disabled} required value={draft.date || ""}
                onChange={event => update("date", event.target.value)}/>
        </label>}
        <div className="chatQuickTimeRow">
            <label data-quick-field>
                <span>{t("chatUi.quickCommands.startShort")}</span>
                <input type="time" disabled={disabled} value={draft.startTime || ""}
                    onChange={event => update("startTime", event.target.value)}/>
            </label>
            <label data-quick-field>
                <span>{t("chatUi.quickCommands.endShort")}</span>
                <input type="time" disabled={disabled} value={draft.endTime || ""}
                    onChange={event => update("endTime", event.target.value)}/>
            </label>
        </div>
        <div className="chatQuickHelp">{t("chatUi.quickCommands.enterHint")}</div>
    </div>;
}
