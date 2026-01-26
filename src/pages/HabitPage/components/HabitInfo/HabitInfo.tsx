import { useState, useEffect } from "react";
import { SquareCheck, Pin, PinOff, Trash2, Square } from "lucide-react";
import CalendarInput from "../../../../components/ts/CalendarInput";
import SelectList from "../../../../components/ts/SelectList";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import type { Habit } from "../../../../components/context/HabitsContext";
import TagSelector from "../../../../components/ts/TagSelector";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { useDelete } from "../../../../components/hooks/DeleteHook";
import { tags, type Tag } from "../../../../components/ts/tags";
import DayChanger from "../../../../components/ts/DayChanger";
import { initialChosenDays } from "../../../../components/ts/initialChosenDays";
import { BoxArrowDown, BoxArrowUp, WarningCircle } from "@phosphor-icons/react";

interface RedHabitProps {
    habit: Habit;
    readOnly:boolean;
}

export default function HabitInfo({ habit, readOnly }: RedHabitProps) {
    const {
        setNewName, setNewDescription, setNewStartDate, setNewEndDate,
        setNewOngoing, setNewPeriodicity, setNewDays, setNewStartTime,
        setNewEndTime, setNewTag, setPin, isUpdating, putInArchieve
    } = useUpHabit();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete()

    const [ name, setName ] = useState<string>("");
    const [ desc, setDesc ] = useState<string | undefined>("");
    const [ startTime, setStartTime ] = useState<string>("");
    const [ endTime, setEndTime ] = useState<string>("");
    const [ startDate, setStartDate ] = useState<Date | null>(null);
    const [ endDate, setEndDate ] = useState<Date | null>(null);
    const [ periodicity, setPeriodicity ] = useState<string>("")
    const [ ongoing, setOngoing ] = useState<boolean>(false);
    const [ pinned, setPinned ] = useState<boolean>(false);
    const [ archived, setArcvhieved ] = useState<boolean>(false);
    const [ selectedTag, setSelectedTag ] = useState<string | null>(null)
    const [ chosenDays, setChosenDays ] = useState<{ value: number; label: string; chosen: boolean }[]>(initialChosenDays);

    useEffect(() => {
        if (!habit) return;
        setName(habit.name ?? "");
        setDesc(habit.desc ?? "");
        setStartTime(habit.start_time ?? "");
        setEndTime(habit.end_time ?? "");
        setStartDate(habit.start_date ? new Date(habit.start_date) : null);
        setEndDate(habit.end_date ? new Date(habit.end_date) : null);
        setPeriodicity(habit.periodicity ?? "");
        setOngoing(Boolean(habit.ongoing));
        setPinned(Boolean(habit.pinned));
        setArcvhieved(Boolean(habit.is_archived));
        if (Array.isArray(habit.chosen_days)) {
            setChosenDays(initialChosenDays.map(day => ({
            ...day,
            chosen: (habit.chosen_days as number[]).includes(day.value)
            })));
        } else {
            setChosenDays(initialChosenDays);
        }
    // зависимости: когда меняется объект привычки — обновляем state
    }, [habit]);

    const periodicityArr = [
        { label: "каждый день", value: "everyday" },
        { label: "несколько дней в неделю", value: "weekly" },
        { label: "иногда", value: "sometimes" },
    ];

    const formatTimeInput = (val: string) => {
        const digits = val.replace(/\D/g, "");
        if (digits.length >= 3) {
            let hh = digits.slice(0, 2);
            let mm = digits.slice(2, 4);
            if (parseInt(hh) > 23) hh = "23";
            if (parseInt(mm) > 59) mm = "59";
            return hh + ":" + mm;
        }
        return digits;
    };
    
    const toggleDay = (value: number) => {
        if (readOnly) return;
        setPeriodicity("weekly"); // локально
        setNewPeriodicity(habit.id, "weekly");

        setChosenDays(prev => {
            const next = prev.map(day => day.value === value ? { ...day, chosen: !day.chosen } : day);
            // отправляем на сервер выбранные дни в виде массива чисел (или null)
            setNewDays(habit.id, next);
            return next;
        });
    };

    const clearChosenDays = (val:string) => {
        if (val !== "weekly") {
            setChosenDays(initialChosenDays);
            setNewDays(habit.id, null);
        }
    };

    const tagIcon = () => {
        let tag:Tag | undefined
        if (selectedTag || habit.tag) tag = tags.find(tag => tag.value === (selectedTag || habit.tag))
        if (!tag) return null
        const Icon = tag.icon
        return <Icon size={24} />
    }
    
    useEffect(() => {
        if (selectedTag !== habit.tag && selectedTag) setNewTag(habit.id, selectedTag)
    }, [habit.id, habit.tag, selectedTag, setNewTag])

    return (
        <div className="redHabit">
            <div className="habitFirstStr">
                <div className="saveHabit">
                    <span
                        className="spanSaveHabit"
                        style={{ display: isUpdating.includes(`habit_${habit.id}`) ? "block" : "none" }}
                    >
                        Сохранение...
                    </span>
                </div>
                <div className="habitButts">
                    <div onClick={() => {
                        setArcvhieved(!archived)
                        putInArchieve(habit.id, !archived)
                    }}>
                        {archived ? <BoxArrowUp className="pinHabit"/> : <BoxArrowDown className="pinHabit"/>}
                    </div>
                    <div onClick={() => {
                        setPinned(!pinned);
                        setPin(habit.id, !pinned);
                    }}>
                        {pinned || habit.pinned ? <PinOff className="pinHabit" /> : <Pin className="pinHabit" />}
                    </div>
                    <div onClick={() => {
                        setDeleteConfirm({goal:"habit", id:habit.id, name:habit.name})
                        setBlackout({seted:true, module:"Delete"})}}
                    >
                        <Trash2 className="delHabit" />
                    </div>
                </div>
            </div>
            {archived && (
                <div className="thisarchived">
                    <div className="thisarchivedSvg">
                        <WarningCircle />
                    </div>
                    <div className="thisarchivedText">
                        <span className="thisarchived1str">Активность перенесена в архив.</span>
                        {!readOnly && <span className="thisarchived2str">Её невозможно обновить.</span>}
                    </div>
                </div>
            )}
            <div className="habitWrapperIcon">
                {(selectedTag || habit.tag) && (
                    <div className="habitIconWrapper">
                        {tagIcon()}
                    </div>
                )}
                <div className="addHabitWrapper">
                    <label htmlFor="redHabitName">Название</label>
                    <input
                        id="redHabitName"
                        type="text"
                        className="addHabitInput"
                        maxLength={40}
                        readOnly={readOnly || archived}
                        value={name}
                        minLength={1}
                        onChange={(e) => {
                            setName(e.target.value);
                            setNewName(habit.id, e.target.value);
                        }}
                    />
                    <span>{name?.length || 0}/40</span>
                </div>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="redHabitDesc">Описание</label>
                <textarea
                    id="redHabitDesc"
                    className="addHabitInput"
                    maxLength={120}
                    value={desc}
                    readOnly={readOnly || archived}
                    onChange={(e) => {
                        setDesc(e.currentTarget.value);
                        setNewDescription(habit.id, e.currentTarget.value);
                    }}
                />
                <span>{desc?.length || 0}/120</span>
            </div>
            <div className="addHabitWrapper">
                <TagSelector selectedTag={habit.tag || selectedTag} setSelectedTag={setSelectedTag} showOnly={readOnly || archived}/>
            </div>
            <div className="addHabitTimeWrapper">
                <div className="addHabitWrapper">
                    <label htmlFor="sdInput">Дата начала</label>
                    <CalendarInput
                        id="sdInput"
                        value={startDate}
                        readOnly={readOnly || archived}
                        onChange={(date) => {
                            setStartDate(date);
                            setNewStartDate(habit.id, date);
                        }}
                        maxDate={new Date()}
                        placeholder={"С дд.мм.гггг"}
                        className="addHabitInput"
                    />
                </div>
                <div className="addHabitWrapper">
                    <label>Дата окончания</label>
                    {ongoing || habit.ongoing  ? (
                        <input type="text" className="addHabitInput ongoingInput" readOnly value={"По настоящее время"} />
                    ) : (
                        <CalendarInput
                            value={endDate}
                            readOnly={readOnly || archived}
                            onChange={(date) => {
                                setEndDate(date);
                                setNewEndDate(habit.id, date);
                            }}
                            minDate={startDate || undefined}
                            placeholder={"По дд.мм.гггг"}
                            className="addHabitInput"
                        />
                    )}
                </div>
            </div>

            <div className="addHabbitCheckBox redHabitCheckbox" onClick={() => {
                if (!readOnly && !archived) {
                    setOngoing(!ongoing);
                    setNewOngoing(habit.id, !ongoing);
                }
            }}>
                {ongoing || habit.ongoing ? (
                    <SquareCheck id="checkBoxPresent" className="active" />
                ) : (
                    <Square id="checkBoxPresent" className="notactive" />
                )}
                <label htmlFor="checkBoxPresent">по настоящее время</label>
            </div>

            <div className="inpWrapperRedHabit">
                <label>Периодичность</label>
                <SelectList
                    placeholder=""
                    className="redHabitSL"
                    showOnly={readOnly || archived}
                    arr={periodicityArr}
                    prop={(value) => {
                        setPeriodicity(value as string);
                        setNewPeriodicity(habit.id, value as string);
                    }}
                    extraFunction={clearChosenDays}
                    selected={periodicity || habit.periodicity}
                />
            </div>

            {(periodicity || habit.periodicity) === "weekly" && (
                <DayChanger toggleDay={toggleDay} chosenDays={chosenDays} showOnly={readOnly || archived} chosenArr={habit.chosen_days}/>
            )}

            <div className="addHabitTimeWrapper">
                <div className="addHabitWrapper time">
                    <label>Время (начало)</label>
                    <input
                        type="text"
                        placeholder="чч:мм"
                        className="addHabitInput"
                        value={startTime}
                        readOnly={readOnly || archived}
                        onChange={(e) => {
                            const formattedTime = formatTimeInput(e.target.value);
                            setStartTime(formattedTime);
                            setNewStartTime(habit.id, formattedTime);
                        }}
                    />
                </div>
                <div className="addHabitWrapper time">
                    <label>Время (конец)</label>
                    <input
                        type="text"
                        placeholder="чч:мм"
                        className="addHabitInput"
                        value={endTime}
                        readOnly={readOnly || archived}
                        onChange={(e) => {
                            const formattedTime = formatTimeInput(e.target.value);
                            setEndTime(formattedTime);
                            setNewEndTime(habit.id, formattedTime);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}