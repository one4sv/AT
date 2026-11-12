import TA from "../../../../components/ts/TA";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, Plus } from "@phosphor-icons/react"
import { formatHabitTime } from "../../../../components/ts/utils/formatHabitTime"
import type { Habit } from "../../../../components/context/HabitsContext"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { useBlackout } from "../../../../components/hooks/BlackoutHook"
import { type SetStateAction } from "react"
import { useNavigate } from "react-router-dom"
import type { CountInpsType } from "./Schedule"
import { useSettings } from "../../../../components/hooks/SettingsHook"
import { isOddWeek } from "../../utils/isOddWeek"
import { clockInAppZone, dateToCalendarFormat, timeToMinutes, todayStrFunc } from "../../../../components/ts/utils/dateToStr"

export type ExtraScheduleBlock = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    isSeparator:boolean
};

export type ScheduleBlock = {
    habit: Habit,
    d: {value:number, dateStr:string, label:string, fullDate:string, date:Date}
    edit: boolean,
    id?:string,
    isGeneral?: boolean,
    countInps?: CountInpsType[],
    setCountInps?: React.Dispatch<SetStateAction<CountInpsType[]>>,
    extraBlocks?: ExtraScheduleBlock[],
    isSeparator?:boolean,
    isSeparated?:boolean,
}

export default function ScheduleBlock({ 
    habit, 
    d, 
    edit, 
    isGeneral, 
    id,
    countInps, 
    setCountInps,
    extraBlocks = [],
    isSeparated = false,
}: ScheduleBlock) {
    const { t } = useTranslation("common");
    const { weekStart } = useSettings()
    const { calendar } = useCalendar()
    const navigate = useNavigate()
    const { setBlackout } = useBlackout()
    const visibleExtraBlocks = extraBlocks.filter(
        b => !isSeparated || b.isSeparator !== isOddWeek(weekStart, d.date)
    )
    

    const getTimeClass = (h: Habit, date:Date) => {
        const clock = clockInAppZone()

        if (calendar.find(c => c.isDone && c.date === dateToCalendarFormat(date) && Number(c.habitId) === h.id)) return "done"

        if (!h.start_time) return ""

        if (h.end_time && dateToCalendarFormat(date) === todayStrFunc() &&
            clock >= h.start_time.slice(0, 5) && clock <= h.end_time.slice(0, 5)) {
            return "ongoing";
        }

        return ""
    }

    const countProcents = (habit: Habit) => {
        const [ eh, em ] = habit.end_time.split(':')
        const [ sh, sm ] = habit.start_time.split(':')
        const et = Number(eh) * 60 + Number(em)
        const st = Number(sh) * 60 + Number(sm)
        const now = timeToMinutes(clockInAppZone())
        const dur = et - st
        const pass = now - st
        const percent = Math.min(Math.max(pass / dur * 100, 0), 100)
        return `${percent}%`
    }

    const habitInfo = () => {
        return (
            <div className="scheduleBlockText">
                <span className="scheduleHabitTime">{formatHabitTime(habit)}</span>
                <span className="scheduleHabitName">{habit.name}</span>
                {!edit && getTimeClass(habit, d.date) === "done" && <CheckCircleIcon className="isScheduleBlockDone" weight="fill"/>}
            </div>
        )
    }

    return (
        <div className="scheduleBlock" onClick={() => isGeneral && !edit && navigate(`/habit/${habit.id}`)}>
            {getTimeClass(habit, d.date) === "ongoing" && !edit &&
                <div className="scheduleBar">
                    <div className="scheduleBarGoing" style={{width:countProcents(habit)}}></div>
                </div>
            }
            {(!id || (edit ? extraBlocks.length === 0 : visibleExtraBlocks.length === 0)) && habitInfo()}
            {!edit && visibleExtraBlocks.length > 0 && (
                <div className="scheduleExtraBlocks">
                    {visibleExtraBlocks
                        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
                        .map((block) => {
                            return (
                                <div className="scheduleExtraBlockWrapper" key={`${block.id}-${d.fullDate}`}>
                                    {!id && extraBlocks.length > 0 && (
                                        <div className="scheduleExtraBlockLine"></div>
                                    )}
                                    <div className="scheduleExtraBlock">
                                        <span className="scheduleHabitTime">
                                            {block.start_time && block.end_time 
                                                ? t("habitPageUi.day.fromTo", { start: block.start_time, end: block.end_time }) 
                                                : block.start_time || ""}
                                        </span>
                                        <span className="scheduleHabitName">{block.name}</span>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            )}

            {edit && !isGeneral && countInps && (
                <div className="scheduleBlockInputs">
                    {countInps
                    .filter(c => c.fullDate === d.fullDate)
                    .map((i) => (
                        <div className="scheduleExtraBlock" key={`${i.fullDate}-${i.tempId ?? i.id}`}>
                            <div className="scheduleInpTime">
                                {t("habitPageUi.schedule.from")}
                                <input
                                    type="text"
                                    className="scheduleInp"
                                    placeholder={t("habitPageUi.schedule.timePlaceholder")}
                                    value={i.start_time}
                                    onChange={(e) =>
                                        setCountInps?.(prev =>
                                            prev.map(x =>
                                                (
                                                    (x.tempId !== undefined && i.tempId !== undefined)
                                                        ? x.tempId === i.tempId
                                                        : x.id === i.id
                                                ) && x.fullDate === i.fullDate
                                                    ? { ...x, start_time: e.target.value }
                                                    : x
                                            )
                                        )
                                    }
                                />
                                {t("habitPageUi.schedule.to")}
                                <input
                                    type="text"
                                    className="scheduleInp"
                                    placeholder={t("habitPageUi.schedule.timePlaceholder")}
                                    value={i.end_time}
                                    onChange={(e) =>
                                        setCountInps?.(prev =>
                                            prev.map(x =>
                                                (
                                                    (x.tempId !== undefined && i.tempId !== undefined)
                                                        ? x.tempId === i.tempId
                                                        : x.id === i.id
                                                ) && x.fullDate === i.fullDate
                                                    ? { ...x, end_time: e.target.value }
                                                    : x
                                            )
                                        )
                                    }
                                />
                            </div>

                            <TA
                                className="scheduleInpText"
                                value={i.name}
                                onChange={(e) =>
                                    setCountInps?.(prev =>
                                        prev.map(x =>
                                            (
                                                (x.tempId !== undefined && i.tempId !== undefined)
                                                    ? x.tempId === i.tempId
                                                    : x.id === i.id
                                            ) && x.fullDate === i.fullDate
                                                ? { ...x, name: e.target.value }
                                                : x
                                        )
                                    )
                                }
                            />
                        </div>
                    ))}
                </div>
            )}

            {edit && !isGeneral && setCountInps && (
                <button
                    className="scheduleBlockAdd"
                    onClick={() => setBlackout({ seted: true, module: "HabitTaskEditor", point: "schedule", options: { id: d.fullDate } })}
                >
                    <Plus/>{t("habitPageUi.schedule.addBlock")}
                </button>
            )}
        </div>
    )
}