import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import EntitySuggestionList, { type EntitySuggestionItem } from "../../../../components/ts/EntitySuggestionList";
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

function InlineQuickField({ label, value, onChange, inputRef, maxLength, inputMode, disabled, onFocus, suggestionsOpen }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    inputRef?: Ref<HTMLTextAreaElement>;
    maxLength?: number;
    inputMode?: "text" | "numeric";
    disabled?: boolean;
    onFocus?: () => void;
    suggestionsOpen?: boolean;
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
                aria-autocomplete={suggestionsOpen !== undefined ? "list" : undefined}
                aria-expanded={suggestionsOpen}
                onFocus={onFocus}
                value={value}
                disabled={disabled}
                maxLength={maxLength}
                onChange={event => onChange(event.target.value)}
            />
        </span>
    </label>;
}

export default function QuickCommandComposer({ draft, onChange, onSubmit, onCancel, disabled, suggestionPopupRef }: {
    draft: QuickCommandDraft;
    onChange: (next: QuickCommandDraft) => void;
    onSubmit: () => void;
    onCancel: () => void;
    disabled?: boolean;
    suggestionPopupRef?: RefObject<HTMLDivElement | null>;
}) {
    const { t, i18n } = useTranslation("common");
    const containerRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLTextAreaElement>(null);
    const periodicityRef = useRef<HTMLTextAreaElement>(null);
    const [periodicitySuggestionsOpen, setPeriodicitySuggestionsOpen] = useState(false);
    const [activePeriodicitySuggestion, setActivePeriodicitySuggestion] = useState(0);
    const periodicities: EntitySuggestionItem[] = (["everyday", "weekly", "cycle", "sometimes"] as const).map(id => ({
        id,
        label: t("habitUi.period." + id),
        description: t("habitUi.periodHint." + id)
    }));
    const currentPeriodicityLabel = periodicities.find(option => option.id === draft.periodicity)?.label;
    const periodicityQuery = draft.periodicityText?.trim().toLocaleLowerCase() || "";
    const searchPeriodicity = periodicityQuery === currentPeriodicityLabel?.toLocaleLowerCase() ? "" : periodicityQuery;
    const suggestedPeriodicities = searchPeriodicity ? periodicities.filter(option =>
        [option.label, option.description || "", option.id].some(value =>
            value.toLocaleLowerCase().includes(searchPeriodicity)
        )
    ) : periodicities;
    const update = (key: keyof QuickCommandDraft, value: string) => onChange({ ...draft, [key]: value });

    useEffect(() => {
        nameRef.current?.focus({ preventScroll: true });
    }, [draft.kind]);

    const focusable = () => Array.from(containerRef.current?.querySelectorAll<HTMLTextAreaElement>(
        "[data-quick-field] textarea"
    ) || []);

    const selectPeriodicity = (option: EntitySuggestionItem, advance = false) => {
        setPeriodicitySuggestionsOpen(false);
        onChange({ ...draft, periodicity: option.id as QuickCreateDraft["periodicity"], periodicityText: option.label });
        if (advance) requestAnimationFrame(() => {
            const fields = focusable();
            const index = fields.indexOf(periodicityRef.current as HTMLTextAreaElement);
            fields[index + 1]?.focus({ preventScroll: true });
        });
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        const target = event.target as HTMLTextAreaElement;
        const fields = focusable();
        const index = fields.indexOf(target);
        if (index < 0) return;
        if (target === periodicityRef.current && periodicitySuggestionsOpen) {
            if (event.key === "Escape") {
                event.preventDefault();
                setPeriodicitySuggestionsOpen(false);
                return;
            }
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestedPeriodicities.length) {
                event.preventDefault();
                setActivePeriodicitySuggestion(previous =>
                    (previous + (event.key === "ArrowDown" ? 1 : -1) + suggestedPeriodicities.length) % suggestedPeriodicities.length
                );
                return;
            }
            if (event.key === "Enter" && !event.shiftKey && suggestedPeriodicities.length) {
                event.preventDefault();
                selectPeriodicity(suggestedPeriodicities[Math.min(activePeriodicitySuggestion, suggestedPeriodicities.length - 1)], true);
                return;
            }
        }
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

    return <div ref={containerRef} className="chatQuickComposer" onKeyDown={handleKeyDown}
        onFocusCapture={event => {
            if (event.target instanceof HTMLTextAreaElement && event.target !== periodicityRef.current) {
                setPeriodicitySuggestionsOpen(false);
            }
        }}>
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
                    inputRef={periodicityRef}
                    disabled={disabled}
                    suggestionsOpen={periodicitySuggestionsOpen}
                    onFocus={() => {
                        if (disabled) return;
                        setPeriodicitySuggestionsOpen(true);
                        setActivePeriodicitySuggestion(0);
                    }}
                    value={draft.periodicityText ?? t("habitUi.period." + (draft.periodicity || "everyday"))}
                    onChange={value => {
                        onChange({ ...draft, periodicityText: value, periodicity: parseQuickFieldPeriodicity(value) });
                        setActivePeriodicitySuggestion(0);
                        setPeriodicitySuggestionsOpen(true);
                    }}
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
        {draft.kind === "habit" && periodicitySuggestionsOpen && !disabled && <EntitySuggestionList
            className="chatQuickPeriodicitySuggestions"
            anchorRef={containerRef}
            popupRef={suggestionPopupRef}
            items={suggestedPeriodicities}
            activeIndex={Math.min(activePeriodicitySuggestion, suggestedPeriodicities.length - 1)}
            onSelect={selectPeriodicity}
            onPreview={item => setActivePeriodicitySuggestion(suggestedPeriodicities.findIndex(option => option.id === item.id))}
        />}
        <div className="chatQuickHelp">{t("chatUi.quickCommands.enterHint")}</div>
    </div>;
}
