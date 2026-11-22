import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { parseQuickFieldDate, parseQuickFieldPeriodicity, parseQuickFieldTime } from "../../../../components/ts/utils/quickCreateCommand";
import type { QuickCreateDraft } from "../../../../components/ts/utils/quickCreateCommand";

export interface QuickCommandDraft extends QuickCreateDraft {
    weeklyDays?: string;
    cycleActive?: string;
    cycleRest?: string;
    periodicityText?: string;
    dateText?: string;
    startTimeText?: string;
    endTimeText?: string;
}

function InlineQuickField({ label, value, onChange, inputRef, maxLength, inputMode, disabled }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    inputRef?: Ref<HTMLTextAreaElement>;
    maxLength?: number;
    inputMode?: "text" | "numeric";
    disabled?: boolean;
}) {
    const fieldRef = useRef<HTMLLabelElement>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const field = fieldRef.current;
        const label = titleRef.current;
        const area = areaRef.current;
        const mirror = measureRef.current;
        if (!field || !label || !area || !mirror) return;
        const resize = () => {
            // Keep the empty field almost invisible; the label remains a large tap target.
            const container = field.parentElement;
            const available = Math.max(16, (container?.clientWidth || field.clientWidth) - label.offsetWidth - 16);
            const measured = mirror.getBoundingClientRect().width;
            area.style.width = Math.max(1, Math.min(available, Math.ceil(measured) + (value ? 3 : 0))) + "px";
            area.style.height = "auto";
            area.style.height = Math.max(area.scrollHeight, parseFloat(getComputedStyle(area).lineHeight) || 22) + "px";
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(field);
        return () => observer.disconnect();
    }, [value, label]);

    return <label ref={fieldRef} className="chatQuickField" data-quick-field>
        <span ref={titleRef} className="chatQuickFieldLabel">{label}:</span>
        <span className="chatQuickFieldValue">
            <span ref={measureRef} className="chatQuickMeasure" aria-hidden="true">{value || ""}</span>
            <textarea
                ref={node => {
                    areaRef.current = node;
                    if (typeof inputRef === "function") inputRef(node);
                    else if (inputRef) inputRef.current = node;
                }}
                rows={1}
                inputMode={inputMode}
                aria-label={label}
                value={value}
                disabled={disabled}
                maxLength={maxLength}
                onChange={event => onChange(event.target.value)}
            />
        </span>
    </label>;
}

export default function QuickCommandComposer({ draft, onChange, onSubmit, onCancel, disabled }: {
    draft: QuickCommandDraft;
    onChange: (next: QuickCommandDraft) => void;
    onSubmit: () => void;
    onCancel: () => void;
    disabled?: boolean;
}) {
    const { t, i18n } = useTranslation("common");
    const containerRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLTextAreaElement>(null);
    const update = (key: keyof QuickCommandDraft, value: string) => onChange({ ...draft, [key]: value });

    useEffect(() => {
        nameRef.current?.focus({ preventScroll: true });
    }, [draft.kind]);

    const focusable = () => Array.from(containerRef.current?.querySelectorAll<HTMLTextAreaElement>(
        "[data-quick-field] textarea"
    ) || []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        const target = event.target as HTMLTextAreaElement;
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
            else {
                const previous = fields[index - 1];
                previous.focus({ preventScroll: true });
                previous.setSelectionRange(previous.value.length, previous.value.length);
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
        }
    };

    const dateText = draft.dateText ?? (draft.date
        ? (i18n.language.startsWith("ru")
            ? draft.date.slice(8, 10) + "." + draft.date.slice(5, 7) + "." + draft.date.slice(0, 4)
            : draft.date)
        : "");

    return <div ref={containerRef} className="chatQuickComposer" onKeyDown={handleKeyDown}>
        <div className="chatQuickCommandName">/{draft.kind === "habit" ? "act" : "plan"}</div>
        <div className="chatQuickFields">
            <InlineQuickField
                label={t("chatUi.name")}
                inputRef={nameRef}
                maxLength={draft.kind === "habit" ? 40 : 160}
                disabled={disabled}
                value={draft.name || ""}
                onChange={value => update("name", value)}
            />
            <InlineQuickField
                label={t("chatUi.description")}
                maxLength={draft.kind === "habit" ? 120 : 1200}
                disabled={disabled}
                value={draft.description || ""}
                onChange={value => update("description", value)}
            />
            {draft.kind === "habit" ? <>
                <InlineQuickField
                    label={t("habitUi.periodicity")}
                    disabled={disabled}
                    value={draft.periodicityText ?? t("habitUi.period." + (draft.periodicity || "everyday"))}
                    onChange={value => onChange({
                        ...draft, periodicityText: value, periodicity: parseQuickFieldPeriodicity(value)
                    })}
                />
                {draft.periodicity === "weekly" && <InlineQuickField
                    label={t("chatUi.quickCommands.days")}
                    disabled={disabled}
                    value={draft.weeklyDays || ""}
                    onChange={value => update("weeklyDays", value)}
                />}
                {draft.periodicity === "cycle" && <>
                    <InlineQuickField
                        label={t("habitUi.activeDays")}
                        inputMode="numeric"
                        disabled={disabled}
                        maxLength={3}
                        value={draft.cycleActive || ""}
                        onChange={value => update("cycleActive", value)}
                    />
                    <InlineQuickField
                        label={t("habitUi.restDays")}
                        inputMode="numeric"
                        disabled={disabled}
                        maxLength={3}
                        value={draft.cycleRest || ""}
                        onChange={value => update("cycleRest", value)}
                    />
                </>}
            </> : <InlineQuickField
                label={t("plans.date")}
                disabled={disabled}
                inputMode="numeric"
                maxLength={10}
                value={dateText}
                onChange={value => onChange({ ...draft, dateText: value, date: parseQuickFieldDate(value) })}
            />}
            <InlineQuickField
                label={t("chatUi.quickCommands.startShort")}
                disabled={disabled}
                inputMode="numeric"
                maxLength={5}
                value={draft.startTimeText ?? draft.startTime ?? ""}
                onChange={value => onChange({ ...draft, startTimeText: value, startTime: parseQuickFieldTime(value) })}
            />
            <InlineQuickField
                label={t("chatUi.quickCommands.endShort")}
                disabled={disabled}
                inputMode="numeric"
                maxLength={5}
                value={draft.endTimeText ?? draft.endTime ?? ""}
                onChange={value => onChange({ ...draft, endTimeText: value, endTime: parseQuickFieldTime(value) })}
            />
        </div>
        <div className="chatQuickHelp">{t("chatUi.quickCommands.enterHint")}</div>
    </div>;
}
