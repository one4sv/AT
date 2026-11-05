import { useTranslation } from "react-i18next";
import "../../scss/HabitSettings.scss";
import { useState, useCallback, useEffect } from "react";
import Toggler from "../../../../components/ts/Toggler";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import type { asctype, metricsType } from "../../../../components/context/TheHabitContext";
import { BoxArrowDownIcon, Trash } from "@phosphor-icons/react";
import SelectList, { type Option } from "../../../../components/ts/SelectList";
import type { HabitSlideProps } from "../../HabitPage";
import { useDelete } from "../../../../components/hooks/DeleteHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";

function SettingHint({ text }: { text: string }) {
    return <div className="habitSettingHint">{text}</div>;
}

export default function HabitSettings({ readOnly, isArchived, isMy }: HabitSlideProps) {
    const { t } = useTranslation("common");
    const { habitSettings, habitTimer, habit } = useTheHabit();
    const { setNewMetricType, setNewScheduleBool, setNewAutoScheduleCompletion, setNewOngoing } = useUpHabit();
    const { setDeleteConfirm } = useDelete()
    const { setBlackout } = useBlackout()
    const [ metric_type, setMetric_type ] = useState<metricsType>(habitSettings.metric_type);
    const [ scheduleToggle, setScheduleToggle ] = useState(habitSettings.schedule);
    const [ autoCompleteMode, setAutoCompleteMode ] = useState<string | number | undefined>(
        habitSettings.auto_schedule_completion ?? "none"
    );

    const isMetricDisabled = readOnly || (habitTimer !== null && habitTimer.status !== "ended");

    useEffect(() => setMetric_type(habitSettings.metric_type), [habitSettings.metric_type]);
    useEffect(() => setScheduleToggle(habitSettings.schedule), [habitSettings.schedule]);
    useEffect(() => {
        setAutoCompleteMode(habitSettings.auto_schedule_completion ?? "none");
    }, [habitSettings.auto_schedule_completion]);

    const metrics: Option[] = [
        { label: t("habitUi.metric.timer"), value: "timer"},
        { label: t("habitUi.metric.counter"), value: "counter"},
        { label: t("habitUi.metric.schedule"), value: "schedule"},
        { label: t("habitUi.metric.checklist"), value: "checklist"},
        { label: t("habitUi.metric.done"), value: "done"},
    ];

    const availableMetrics = metrics.filter((m) => {
        if (m.value === "schedule" && habit?.periodicity === "sometimes") return false;
        return true;
    });

    const autoOptions: Option[] = [
        { label: t("habitUi.auto.one"), value: "one" },
        { label: t("habitUi.auto.all"), value: "all" },
        { label: t("habitUi.auto.none"), value: "none" },
    ];

    const handleMetricChange = (value: string) => {
        if (isMetricDisabled || !habit) return;
        const val = value as metricsType;
        setMetric_type(val);
        setNewMetricType(habit.id, val);
    };

    const handleScheduleChange = useCallback(
        (newValue: boolean) => {
            if (!habit) return
            if (habit?.periodicity === "sometimes") return;
            setScheduleToggle(newValue);
            setNewScheduleBool(habit.id, newValue);
        },
        [habit, setNewScheduleBool]
    );

    const handleAutoCompletionChange = (value: string) => {
        if (!habit) return
        const val = value as asctype;
        setAutoCompleteMode(value);
        setNewAutoScheduleCompletion(habit.id, val);
    };
    const metricText: Record<metricsType, string> = {
        timer: t("habitUi.metricHint.timer"),
        counter: t("habitUi.metricHint.counter"),
        schedule: t("habitUi.metricHint.schedule"),
        checklist: t("habitUi.metricHint.checklist"),
        done: t("habitUi.metricHint.done")
    };

    if (!habit) return null;

    return (
        <div className="habitInnerSlide">
            {/* Расписание */}
            <div className="redHabitBlock but" onClick={() => handleScheduleChange(!scheduleToggle)}>
                <div className="redHabitStr">
                    <span className="redHabitSpan">{t("habitUi.schedule")}</span>
                    <span className="redHabitToggler">
                        <Toggler
                            state={scheduleToggle}
                            disable={readOnly || habit?.periodicity === "sometimes"}
                            setState={handleScheduleChange}
                        />
                    </span>
                </div>
                {habit?.periodicity === "sometimes" ? (
                    <SettingHint text={t("habitUi.scheduleUnavailable")} />
                ) : (
                    <SettingHint text={t("habitUi.scheduleHint")} />
                )}
            </div>

            {/* Тип измерения */}
            <div className={`redHabitBlock ${isMetricDisabled ? "disabled" : ""}`}>
                <span className="redHabitSpan">{t("habitUi.metricType")}</span>
                <SelectList
                    className="redHabitSL habitSettingsSL"
                    arr={availableMetrics}
                    selected={metric_type}
                    extraFunction={handleMetricChange}
                    showOnly={isMetricDisabled}
                    id="habitSettingsSLMetric"
                />
                {isMetricDisabled ? (
                    <SettingHint text={t("habitUi.timerRunning")} />
                ) : (
                    <SettingHint
                        text={metricText[metric_type] ?? metricText.done}
                    />
                )}
            </div>

            {/* Автоматически выполнить */}
            {metric_type === "schedule" && (
                <div className="redHabitBlock">
                    <span className="redHabitSpan">{t("habitUi.autoCompletion")}</span>
                    <SelectList
                        className="redHabitSL"
                        arr={autoOptions}
                        selected={autoCompleteMode}
                        extraFunction={handleAutoCompletionChange}
                        showOnly={readOnly}
                        id="habitSettingsSLScheduleComp"
                    />
                    <SettingHint
                        text={
                            autoCompleteMode === "one"
                                ? t("habitUi.autoHint.one")
                                : autoCompleteMode === "all"
                                ? t("habitUi.autoHint.all")
                                : t("habitUi.autoHint.none")
                        }
                    />
                </div>
            )}
            {isMy && (
                <>
                    {/* Архивировать */}
                        <div className="redHabitBlock but danger" onClick={() => isArchived !== undefined && setNewOngoing(habit.id, isArchived)}>
                            {!isArchived ? (
                                <>
                                    <span className="redHabitSpan but"> <BoxArrowDownIcon/> {t("habitUi.archive")}</span>
                                    <div className="habitSettingHint">
                                        {t("habitUi.archiveHint")}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="redHabitSpan but"> <BoxArrowDownIcon/> {t("habitUi.unarchive")}</span>
                                    <div className="habitSettingHint">
                                        {t("habitUi.unarchiveHint")}
                                    </div>
                                </>
                            )}
                        </div>
                    
                    {/* {t("habitUi.delete")} */}
                    <div className="redHabitBlock but danger" onClick={() => {
                        setDeleteConfirm({goal:"habit", id:habit.id, name:habit.name})
                        setBlackout({seted:true, module:"Delete"})
                    }}>
                        <span className="redHabitSpan but"> 
                            <Trash/> {t("habitUi.delete")}
                        </span>
                        <div className="habitSettingHint">
                            {t("habitUi.deleteHint")}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}