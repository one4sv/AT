import "../../scss/HabitSettings.scss";
import { useState, useCallback, useEffect, type SetStateAction } from "react";
import Toggler from "../../../../components/ts/Toggler";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import type { asctype, metricsType } from "../../../../components/context/TheHabitContext";
import { CaretLeftIcon } from "@phosphor-icons/react";
import SelectList, { type Option } from "../../../../components/ts/SelectList";

interface HabitSettingsProps {
    id: number;
    readOnly: boolean;
    setShown: React.Dispatch<SetStateAction<boolean>>;
}

function SettingHint({ text }: { text: string }) {
    return <div className="settingHint">{text}</div>;
}

export default function HabitSettings({ id, readOnly, setShown }: HabitSettingsProps) {
    const { habitSettings, habitTimer, habit } = useTheHabit();
    const { setNewMetricType, setNewScheduleBool, setNewAutoScheduleCompletion } = useUpHabit();

    const [metric_type, setMetric_type] = useState<metricsType>(habitSettings.metric_type);
    const [scheduleToggle, setScheduleToggle] = useState(habitSettings.schedule);
    const [autoCompleteMode, setAutoCompleteMode] = useState<string | number | undefined>(
        habitSettings.auto_schedule_completion ?? "none"
    );

    const isMetricDisabled = readOnly || (habitTimer !== null && habitTimer.status !== "ended");

    // Синхронизация с контекстом
    useEffect(() => setMetric_type(habitSettings.metric_type), [habitSettings.metric_type]);
    useEffect(() => setScheduleToggle(habitSettings.schedule), [habitSettings.schedule]);
    useEffect(() => {
        setAutoCompleteMode(habitSettings.auto_schedule_completion ?? "none");
    }, [habitSettings.auto_schedule_completion]);

    const metrics: Option[] = [
        { label: "Таймер", value: "timer" },
        { label: "Счётчик", value: "counter" },
        { label: "Расписание", value: "schedule" },
    ];

    const availableMetrics = metrics.filter((m) => {
        if (m.value === "schedule" && habit?.periodicity === "sometimes") return false;
        return true;
    });

    const autoOptions: Option[] = [
        { label: "Выполнен один блок расписания", value: "one" },
        { label: "Выполнены все блоки расписания", value: "all" },
        { label: "Никогда", value: "none" },
    ];

    const handleMetricChange = (value: string) => {
        if (isMetricDisabled) return;
        const val = value as metricsType;
        setMetric_type(val);
        setNewMetricType(id, val);
    };

    const handleScheduleChange = useCallback(
        (newValue: boolean) => {
            if (habit?.periodicity === "sometimes") return;
            setScheduleToggle(newValue);
            setNewScheduleBool(id, newValue);
        },
        [habit?.periodicity, id, setNewScheduleBool]
    );

    const handleAutoCompletionChange = (value: string) => {
        const val = value as asctype;
        setAutoCompleteMode(value);
        setNewAutoScheduleCompletion(id, val);
    };

    if (!habit) return null;

    return (
        <div className="habitSettings">
            {/* Расписание */}
            <div className="redHabitBlock" onClick={() => handleScheduleChange(!scheduleToggle)}>
                <div className="redHabitStr">
                    <span className="redHabitSpan">Расписание:</span>
                    <span className="redHabitToggler">
                        <Toggler
                            state={scheduleToggle}
                            disable={readOnly}
                            setState={handleScheduleChange}
                        />
                    </span>
                </div>
                {habit?.periodicity === "sometimes" ? (
                    <SettingHint text="Расписание недоступно для периодичности «иногда»." />
                ) : (
                    <SettingHint text="Позволяет создать набор временных интервалов, привязанных к дням недели, с поддержкой раздельной настройки для чётных и нечётных недель." />
                )}
            </div>

            {/* Тип измерения */}
            <div className={`redHabitBlock ${isMetricDisabled ? "disabled" : ""}`}>
                <span className="redHabitSpan">Тип измерения:</span>
                <SelectList
                    className="redHabitSL habitSettingsSL"
                    arr={availableMetrics}
                    selected={metric_type}
                    extraFunction={handleMetricChange}
                    showOnly={isMetricDisabled}
                    id="habitSettingsSLMetric"
                />
                {isMetricDisabled ? (
                    <SettingHint text="Нельзя изменить пока запущен таймер." />
                ) : (
                    <SettingHint
                        text={
                            metric_type === "timer"
                                ? "Отслеживание по времени. Запусти таймер и фиксируй длительность."
                                : metric_type === "counter"
                                ? "Подходит для количественных привычек: отжимания, страницы, шаги."
                                : "Связано с расписанием. Выполнение зависит от заданных блоков."
                        }
                    />
                )}
            </div>

            {/* Автоматически выполнить */}
            {metric_type === "schedule" && (
                <div className="redHabitBlock">
                    <span className="redHabitSpan">Автоматически выполнить, если:</span>
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
                                ? "Автоматически считает активность выполненной в этот день, если выполнен один блок расписания."
                                : autoCompleteMode === "all"
                                ? "Автоматически считает активность выполненной в этот день, если выполнены все блоки расписания."
                                : "Выполнение фиксируется только вручную, независимо от блоков в расписании."
                        }
                    />
                </div>
            )}

            <div className="habitSettingsHeader" onClick={() => setShown(false)}>
                <CaretLeftIcon /> Назад
            </div>
        </div>
    );
}