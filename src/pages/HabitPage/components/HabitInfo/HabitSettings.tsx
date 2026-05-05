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
    return <div className="settingHint">{text}</div>;
}

export default function HabitSettings({ id, readOnly, isArchived, isMy }: HabitSlideProps) {
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
        { label: "Таймер", value: "timer"},
        { label: "Счётчик", value: "counter"},
        { label: "Расписание", value: "schedule"},
        { label: "Список задач", value: "checklist"},
        { label: "Нет", value: "done"},
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
    const metricText: Record<metricsType, string> = {
        timer: "Фиксирует продолжительность выполнения.",
        counter: "Подходит для количественных привычек.",
        schedule: "Выполнение заданных в расписании блоков.",
        checklist: "Фиксированный список задач.",
        done: "Без измерения."
    };

    if (!habit) return null;

    return (
        <div className="habitInnerSlide">
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
                        text={metricText[metric_type] ?? metricText.done}
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
            {isMy && (
                <>
                    {/* Архивировать */}
                        <div className="redHabitBlock but danger" onClick={() => isArchived && setNewOngoing(habit.id, isArchived)}>
                            {!isArchived ? (
                                <>
                                    <span className="redHabitSpan but"> <BoxArrowDownIcon/> Завершить и архивировать</span>
                                    <div className="settingHint">
                                        Активность будет завершена и перемещена в архив. Статистика сохранится и будет доступна для просмотра, новые выполнения отмечать нельзя.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="redHabitSpan but"> <BoxArrowDownIcon/> Разархивировать</span>
                                    <div className="settingHint">
                                        Активность снова станет выполнимой и вернётся в список текущих.
                                    </div>
                                </>
                            )}
                        </div>
                    
                    {/* Удалить */}
                    <div className="redHabitBlock but danger" onClick={() => {
                        setDeleteConfirm({goal:"habit", id:id, name:habit.name})
                        setBlackout({seted:true, module:"Delete"})
                    }}>
                        <span className="redHabitSpan but"> 
                            <Trash/> Удалить
                        </span>
                        <div className="settingHint">
                            Активность и вся связанная статистика будут удалены без возможности восстановления.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}