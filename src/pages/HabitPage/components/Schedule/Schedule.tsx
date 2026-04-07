import { useEffect, useState, useMemo } from "react"
import "../../scss/Schedule.scss"
import { useHabits } from "../../../../components/hooks/HabitsHook"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import type { Habit } from "../../../../components/context/HabitsContext"
import { Pencil } from "lucide-react"
import { useSchedule } from "../../../../components/hooks/ScheduleHook"
import ScheduleBlock from "./ScheduleBlock"
import type { ScheduleBlockType } from "../../../../components/context/ScheduleContext"
import { isOddWeek } from "../../utils/isOddWeek"
import { useSettings } from "../../../../components/hooks/SettingsHook"
import { isMobile } from "react-device-detect"

export type CountInpsType = {
    fullDate: string;
    id?: number;
    tempId?: number;
    day_of_week: number;
    isSeparator: boolean;
    start_time: string;
    end_time: string;
    name: string;
}

export default function Schedule({ id, isMy }: { id?: string; isMy: boolean }) {
    const { habits } = useHabits()
    const { habit } = useTheHabit()
    const { weekStart } = useSettings()
    const { schedules, habitSchedule, loadHabitSchedule, saveHabitSchedule, loading, schedule_settings } = useSchedule()
    
    const [ edit, setEdit ] = useState(false)
    const [ isWeek, setIsWeek ] = useState(true)
    const [ oldWeekSet, setOldWeekSet ] = useState(true)
    const [ weekSeparator, setWeekSeparator] = useState(false)
    const [ countInps, setCountInps ] = useState<CountInpsType[]>([])
    const hasAnySeparated = useMemo(() =>
        Object.values(schedule_settings).some(s => Boolean(s?.isSeparated)),
        [schedule_settings]
    )
    const currentSettings = id ? schedule_settings[String(id)] : null

    const currentHabitBlocks = useMemo<ScheduleBlockType[]>(() => {
        return id ? (habitSchedule[id] || []) : []
    }, [id, habitSchedule])

    useEffect(() => {
        if (id) {
            loadHabitSchedule(id)
        }
    }, [id])

    const createWeek = (startDate: Date) => {
        const result = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate)
            if (isWeek) {
                date.setDate(startDate.getDate() + i)
            } else {
                const day = startDate.getDay()
                const mondayOffset = day === 0 ? -6 : 1 - day
                date.setDate(startDate.getDate() + mondayOffset + i)
            }
            result.push({
                date: new Date(date),
                value: date.getDay(),
                label: date.toLocaleDateString("ru-RU", { weekday: "short" }),
                dateStr: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
                fullDate: date.toISOString().split("T")[0]
            })
        }
        return result
    }

    const week = createWeek(new Date())
    const secondWeekStart = new Date()
    secondWeekStart.setDate(secondWeekStart.getDate() + 7)
    const secondWeek = createWeek(secondWeekStart)

    const sortHabits = (a: Habit, b: Habit) => {
        const getPriority = (h: Habit) => {
            const hasTime = !!h.start_time
            if (h.periodicity === "everyday" && hasTime) return 1
            if (h.periodicity === "everyday" && !hasTime) return 2
            if (h.periodicity === "weekly" && hasTime) return 3
            return 4
        }
        return getPriority(a) - getPriority(b)
    }

    const enterEditMode = async () => {
        setOldWeekSet(isWeek)
        setIsWeek(false)
        setEdit(true)
    }

    useEffect(() => {
        if (!edit || !id) return

        const newCountInps: CountInpsType[] = []

        currentHabitBlocks.forEach((b) => {
            const targetWeek = b.isSeparator ? secondWeek : week

            const dayEntry = targetWeek.find(d => d.value === b.day_of_week)
            if (dayEntry) {
                newCountInps.push({
                    id: b.id,
                    day_of_week: b.day_of_week,
                    isSeparator: b.isSeparator,
                    fullDate: dayEntry.fullDate,
                    start_time: b.start_time || "",
                    end_time: b.end_time || "",
                    name: b.name || ""
                })
            }
        })

        setCountInps(newCountInps)
    }, [edit, id, currentHabitBlocks, week, secondWeek, weekSeparator])

    const handleSave = async () => {
        if (!id || !habit) return
        const blocksToSend = countInps
            .filter(c => c.name.trim().length > 0)
            .map(c => ({
                id: c.id ?? 0,
                day_of_week: c.day_of_week,
                isSeparator: c.isSeparator,
                name: c.name.trim(),
                start_time: c.start_time || null,
                end_time: c.end_time || null
            }))

        await saveHabitSchedule(id, blocksToSend, weekSeparator)
        setEdit(false)
        setIsWeek(oldWeekSet)
        setCountInps([])
    }

    const isVisible = (value: number) =>
        habit &&
        habit.periodicity !== "sometimes" &&
        !habit.is_archived &&
        (habit.chosen_days?.includes(value) || habit.periodicity === "everyday")

    return (
        <div className="scheduleDiv">
            <div className="scheduleOptions">
                <div
                    className="scheduleOptWeek"
                    onClick={() => {
                        if (edit && id) setWeekSeparator(!weekSeparator)
                        else setIsWeek(!isWeek)
                    }}
                >
                    {edit && id ? (
                        <>
                            <span className={!weekSeparator ? "white" : ""}>1 неделя</span> /{" "}
                            <span className={weekSeparator ? "white" : ""}>Разделение недель</span>
                        </>
                    ) : (
                        <>
                            <span className={isWeek ? "white" : ""}>От сегодняшнего дня</span> /{" "}
                            <span className={!isWeek ? "white" : ""}>Текущая неделя</span>
                        </>
                    )}
                </div>
                {(isMy && !id || (habit && id === String(habit.id) && !habit?.is_archived)) && (
                    <div className="scheduleOptionsButts">
                        {loading ? (
                            <div className="scheduleOpt">Загрузка</div>
                        ) : (
                            <>
                                {edit && (
                                    <div
                                        className="scheduleOpt restore"
                                        onClick={() => {
                                            setIsWeek(oldWeekSet)
                                            setEdit(false)
                                            setCountInps([])
                                            setWeekSeparator(false)
                                        }}
                                    >
                                        сбросить
                                    </div>
                                )}
                                <div
                                    className={`scheduleOpt ${edit ? "save" : "edit"}`}
                                    onClick={() => {
                                        setIsWeek(false)
                                        if (!edit) setWeekSeparator(currentSettings?.isSeparated ?? false)
                                        if (edit) {
                                            handleSave()
                                        } else {
                                            enterEditMode()
                                        }
                                    }}
                                >
                                    {edit ? "сохранить" : <Pencil fill="currentColor" />}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            {weekSeparator && edit && id && <div className="scheduleWeekSign odd">Нечётная неделя:</div>}
            <div className="schedule">
                {week.map(d => (
                    <div className="scheduleWrapper" key={d.fullDate}>
                        <div
                            className={`scheduleInfo ${
                                (id ? currentSettings?.isSeparated : hasAnySeparated) && !edit
                                    ? isOddWeek(weekStart, d.date) === true ? "oddWeek" : "evenWeek"
                                    : ""
                            }`}
                        >
                            <span className="scheduleWeekDay">{d.label.toUpperCase()}</span>
                            {!edit && <span className="scheduleDate">{d.dateStr}</span>}
                        </div>

                        {id ? (
                            isVisible(d.value) && habit && (
                                <ScheduleBlock
                                    habit={habit}
                                    d={d}
                                    edit={edit}
                                    countInps={countInps}
                                    setCountInps={setCountInps}
                                    key={`${habit.id}-${d.fullDate}`}
                                    extraBlocks={currentHabitBlocks.filter(b => b.day_of_week === d.value)}
                                />
                            )
                        ) : (
                            habits && habits
                                .filter(
                                    h =>
                                        h.periodicity !== "sometimes" &&
                                        !h.is_archived &&
                                        (h.chosen_days?.includes(d.value) || h.periodicity === "everyday")
                                )
                                .sort(sortHabits)
                                .map(h => {
                                    const habitBlocks = schedules[String(h.id)]?.filter(b => b.day_of_week === d.value) || []
                                    return (
                                        <ScheduleBlock
                                            habit={h}
                                            d={d}
                                            edit={edit}
                                            isGeneral
                                            key={`${h.id}-${d.fullDate}`}
                                            extraBlocks={habitBlocks}
                                        />
                                    )
                                })
                        )}
                    </div>
                ))}
            </div>
            {weekSeparator && edit && id && <div className="scheduleWeekSign even">Чётная неделя:</div>}
            {id && weekSeparator && edit && (
                <div className="schedule">
                    {secondWeek.map(d => (
                        <div className="scheduleWrapper" key={d.fullDate}>
                            {isMobile && (
                                <div className="scheduleInfo">
                                    <span className="scheduleWeekDay">{d.label.toUpperCase()}</span>
                                </div>
                            )}
                            {isVisible(d.value) && habit && (
                                <ScheduleBlock
                                    habit={habit}
                                    d={d}
                                    edit={edit}
                                    countInps={countInps}
                                    setCountInps={setCountInps}
                                    key={d.fullDate}
                                    extraBlocks={currentHabitBlocks.filter(b => b.day_of_week === d.value)}
                                    isSeparator
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}