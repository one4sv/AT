import { useTranslation } from "react-i18next";
import TA from "../../../../components/ts/TA";
import { useState, useEffect } from "react";
import SelectList from "../../../../components/ts/SelectList";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import type { Habit } from "../../../../components/context/HabitsContext";
import TagSelector from "../../../../components/ts/TagSelector";
import DayChanger from "../../../../components/ts/DayChanger";
import { initialChosenDays } from "../../../../components/ts/initialChosenDays";
import { WarningCircle } from "@phosphor-icons/react";
import { TagIcon } from "../../utils/TagIcon";
import { dateToCalendarFormat, formatDateFromString } from "../../../../components/ts/utils/dateToStr";


interface RedHabitProps {
    habit: Habit;
    readOnly: boolean;
}

export default function HabitInfo({ habit, readOnly }: RedHabitProps) {
    const { t } = useTranslation("common");
    const {
        setNewName, setNewDescription, setNewPeriodicity,
        setNewDays, setNewStartTime, setNewEndTime, setNewTag,
        setNewCycleDaysActive, setNewCycleDaysRest
    } = useUpHabit();

    const [name, setName] = useState<string>("");
    const [desc, setDesc] = useState<string | undefined>("");
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [periodicity, setPeriodicity] = useState<string>("");
    const [cycle_days_active, setCycleDaysActive] = useState<string>("");
    const [cycle_days_rest, setCycleDaysRest] = useState<string>("");
    const [ongoing, setOngoing] = useState<boolean>(false);
    const [selectedTag, setSelectedTag] = useState<string | undefined>();
    const [chosenDays, setChosenDays] = useState<{ value: number; label: string; chosen: boolean }[]>(initialChosenDays);

    useEffect(() => {
        if (!habit) return;
        setStartDate(new Date(habit.start_date + "T12:00:00"));
        setEndDate(habit.end_date ? new Date(habit.end_date + "T12:00:00") : null);
        setPeriodicity(habit.periodicity ?? "");
        setOngoing(Boolean(habit.ongoing));

        if (name === "" || name === habit.name) {
            setName(habit.name ?? "");
        }
        if (!desc || desc === habit.desc) {
            setDesc(habit.desc ?? "");
        }
        if (!startTime || startTime === habit.start_time) {
            setStartTime(habit.start_time ?? "");
        }
        if (!endTime || endTime === habit.end_time) {
            setEndTime(habit.end_time ?? "");
        }
        if (!periodicity || periodicity === habit.periodicity) {
            setCycleDaysActive(String(habit.cycle_days_active ?? ""));
            setCycleDaysRest(String(habit.cycle_days_rest ?? ""));
        }
        if (Array.isArray(habit.chosen_days)) {
            setChosenDays(initialChosenDays.map(day => ({
                ...day,
                chosen: (habit.chosen_days as number[]).includes(day.value)
            })));
        } else {
            setChosenDays(initialChosenDays);
        }
    }, [habit]);
    
    const periodicityArr = [
        { label: t("habitUi.period.everyday"), value: "everyday" },
        { label: t("habitUi.period.weekly"), value: "weekly" },
        { label: t("habitUi.period.cycle"), value: "cycle"},
        { label: t("habitUi.period.sometimes"), value: "sometimes" },
    ];

    const infoReadOnly = !(habit.access?.can_edit_info ?? !readOnly) || !ongoing;

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
        setPeriodicity("weekly");
        setNewPeriodicity(habit.id, "weekly");

        setChosenDays(prev => {
            const next = prev.map(day => day.value === value ? { ...day, chosen: !day.chosen } : day);
            setNewDays(habit.id, next);
            return next;
        });
    };
    
    useEffect(() => {
        if (selectedTag !== habit.tag && selectedTag) setNewTag(habit.id, selectedTag);
    }, [habit.id, habit.tag, selectedTag, setNewTag]);

    return (
        <div className="redHabit">
            {!ongoing && (
                <div className="thisarchived">
                    <div className="thisarchivedSvg">
                        <WarningCircle />
                    </div>
                    <div className="thisarchivedText">
                        <span className="thisarchived1str">{t("habitUi.archived")}</span>
                        {!readOnly && <span className="thisarchived2str">{t("habitUi.archivedReadOnly")}</span>}
                    </div>
                </div>
            )}
            <div className="habitWrapperIcon">
                {(selectedTag || habit.tag) && (
                    <div className="habitIconWrapper">
                        {TagIcon(habit, selectedTag)}
                    </div>
                )}
                <div className="addHabitWrapper">
                    <label htmlFor="redHabitName">{t("habitUi.name")}</label>
                    <input
                        id="redHabitName"
                        type="text"
                        className="addHabitInput"
                        maxLength={40}
                        readOnly={infoReadOnly}
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
                <label htmlFor="redHabitDesc">{t("habitUi.description")}</label>
                <TA
                    id="redHabitDesc"
                    className="addHabitInput redHabitDesc"
                    maxLength={120}
                    value={desc || habit.desc}
                    readOnly={infoReadOnly}
                    onChange={(e) => {
                        setDesc(e.currentTarget.value);
                        setNewDescription(habit.id, e.currentTarget.value);
                    }}
                />
                <span>{desc?.length || 0}/120</span>
            </div>
            <div className="addHabitWrapper">
                <TagSelector selectedTag={habit.tag || selectedTag} setSelectedTag={setSelectedTag} showOnly={infoReadOnly}/>
            </div>

            <div className="inpWrapperRedHabit">
                <label>{t("habitUi.periodicity")}</label>
                <SelectList
                    placeholder=""
                    className="redHabitSL"
                    showOnly={readOnly || !ongoing}
                    arr={periodicityArr}
                    prop={(value) => {
                        setPeriodicity(value as string);
                        setNewPeriodicity(habit.id, value as string);
                    }}
                    selected={periodicity || habit.periodicity}
                />
                <div className="settingHint">
                    {t(`habitUi.periodHint.${periodicity || habit.periodicity}`)}
                </div>
            </div>
            {(periodicity || habit.periodicity) === "cycle" && (
                <div className="addHabitTimeWrapper">
                    <div className="addHabitWrapper time">
                        <label htmlFor="inputActive">{t("habitUi.activeDays")}</label>
                        <input
                            type="number"
                            id="inputActive"
                            className="addHabitInput"
                            placeholder="1"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => {
                                setCycleDaysActive(e.target.value)
                                setNewCycleDaysActive(habit.id, Number(e.target.value))
                            }}
                            value={cycle_days_active}
                        />
                    </div>

                    <div className="addHabitWrapper time">
                        <label htmlFor="inputRest">{t("habitUi.restDays")}</label>
                        <input
                            type="number"
                            id="inputRest"
                            className="addHabitInput"
                            placeholder="1"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => {
                                setCycleDaysRest(e.target.value)
                                setNewCycleDaysRest(habit.id, Number(e.target.value))
                            }}
                            value={cycle_days_rest}
                        />
                    </div>
                </div>
            )}
            {(periodicity || habit.periodicity) === "weekly" && (
                <DayChanger toggleDay={toggleDay} chosenDays={chosenDays} showOnly={readOnly || !ongoing} chosenArr={habit.chosen_days}/>
            )}
            <div className="addHabitTimeWrapper">
                <div className="addHabitWrapper time">
                    <label>{t("habitUi.startTime")}</label>
                    <input
                        type="text"
                        placeholder="hh:mm"
                        className="addHabitInput"
                        value={startTime}
                        readOnly={readOnly || !ongoing}
                        onChange={(e) => {
                            const formattedTime = formatTimeInput(e.target.value);
                            setStartTime(formattedTime);
                            setNewStartTime(habit.id, formattedTime);
                        }}
                    />
                </div>
                <div className="addHabitWrapper time">
                    <label>{t("habitUi.endTime")}</label>
                    <input
                        type="text"
                        placeholder="hh:mm"
                        className="addHabitInput"
                        value={endTime}
                        readOnly={readOnly || !ongoing}
                        onChange={(e) => {
                            const formattedTime = formatTimeInput(e.target.value);
                            setEndTime(formattedTime);
                            setNewEndTime(habit.id, formattedTime);
                        }}
                    />
                </div>
            </div>
            <div className="addHabitWrapper">
                <div className="addHabitWrapper date">
                    <div className="AddHabitDateSpan">{t("habitUi.startDate")}</div>
                    <div className="AddHabitDateSpan">{formatDateFromString(dateToCalendarFormat(startDate))}</div>
                </div>
                {endDate && (
                    <div className="addHabitWrapper date">
                        <div className="AddHabitDateSpan">{t("habitUi.endDate")}</div>
                        <div className="AddHabitDateSpan">{formatDateFromString(dateToCalendarFormat(endDate))}</div>
                    </div>
                )}
            </div>
        </div>
    );
}