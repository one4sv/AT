import { useTranslation } from "react-i18next";
import TA from "../../../../components/ts/TA";
import { useState, useEffect } from "react";
import SelectList from "../../../../components/ts/SelectList";
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook";
import type { Habit } from "../../../../components/context/HabitsContext";
import TagSelector from "../../../../components/ts/TagSelector";
import DayChanger from "../../../../components/ts/DayChanger";
import { initialChosenDays } from "../../../../components/ts/initialChosenDays";
import { WarningCircle, XIcon } from "@phosphor-icons/react";
import { TagIcon } from "../../utils/TagIcon";
import { dateToCalendarFormat, formatDateFromString } from "../../../../components/ts/utils/dateToStr";


interface RedHabitProps {
    habit: Habit;
    readOnly: boolean;
}

export default function HabitInfo({ habit, readOnly }: RedHabitProps) {
    const { t } = useTranslation("common");
    const {
        localChanges, setNewName, setNewDescription, setNewPeriodicity,
        setNewDays, setNewStartTime, setNewEndTime, setNewTag,
        setNewCycleDaysActive, setNewCycleDaysRest
    } = useUpHabit();

    const draft = localChanges[habit.id] || {};
    const name = String(draft.name ?? habit.name ?? "");
    const desc = String(draft.desc ?? habit.desc ?? "");
    const startTime = String(("start_time" in draft ? draft.start_time : habit.start_time) ?? "").slice(0, 5);
    const endTime = String(("end_time" in draft ? draft.end_time : habit.end_time) ?? "").slice(0, 5);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(null);
    const periodicity = String(draft.periodicity ?? habit.periodicity ?? "");
    const cycle_days_active = String(("cycle_days_active" in draft ? draft.cycle_days_active : habit.cycle_days_active) ?? "");
    const cycle_days_rest = String(("cycle_days_rest" in draft ? draft.cycle_days_rest : habit.cycle_days_rest) ?? "");
    const [ongoing, setOngoing] = useState<boolean>(false);
    const [selectedTag, setSelectedTag] = useState<string | undefined>();
    const [chosenDays, setChosenDays] = useState<{ value: number; label: string; chosen: boolean }[]>(initialChosenDays);

    useEffect(() => {
        if (!habit) return;
        setStartDate(new Date(habit.start_date + "T12:00:00"));
        setEndDate(habit.end_date ? new Date(habit.end_date + "T12:00:00") : null);
        setOngoing(Boolean(habit.ongoing));

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

    const toggleDay = (value: number) => {
        if (readOnly) return;

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
                    value={desc}
                    readOnly={infoReadOnly}
                    onChange={(e) => {

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
                            readOnly={infoReadOnly}
                            placeholder="1"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => {

                                setNewCycleDaysActive(habit.id, e.target.value === "" ? null : e.target.valueAsNumber)
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
                            readOnly={infoReadOnly}
                            placeholder="1"
                            pattern="[1-9]\d*"
                            min={1}
                            max={365}
                            onChange={(e) => {

                                setNewCycleDaysRest(habit.id, e.target.value === "" ? null : e.target.valueAsNumber)
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
                    <label htmlFor="habitStartTime">{t("habitUi.startTime")}</label>
                    <div className="timeInputShell">
                        <input id="habitStartTime" type="time" className="addHabitInput"
                            value={startTime} readOnly={infoReadOnly}
                            onChange={e => setNewStartTime(habit.id, e.target.value || null)}/>
                        {startTime && !infoReadOnly && <button type="button" className="timeInputClear"
                            aria-label={t("habitUi.clearTime") + " · " + t("habitUi.startTime")}
                            onClick={() => setNewStartTime(habit.id, null)}><XIcon size={18}/></button>}
                    </div>
                </div>
                <div className="addHabitWrapper time">
                    <label htmlFor="habitEndTime">{t("habitUi.endTime")}</label>
                    <div className="timeInputShell">
                        <input id="habitEndTime" type="time" className="addHabitInput"
                            value={endTime} readOnly={infoReadOnly}
                            onChange={e => setNewEndTime(habit.id, e.target.value || null)}/>
                        {endTime && !infoReadOnly && <button type="button" className="timeInputClear"
                            aria-label={t("habitUi.clearTime") + " · " + t("habitUi.endTime")}
                            onClick={() => setNewEndTime(habit.id, null)}><XIcon size={18}/></button>}
                    </div>
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