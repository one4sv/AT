import { Plus } from "@phosphor-icons/react"
import { formatHabitTime } from "../../../components/ts/utils/formatHabitTime"
import type { Habit } from "../../../components/context/HabitsContext"
import { useCalendar } from "../../../components/hooks/CalendarHook"
import { dateToCalendarFormat } from "./dateToStr"
import { useRef, type SetStateAction } from "react"
import { useNavigate } from "react-router-dom"
import type { CountInpsType } from "../components/Schedule/Schedule"
import { isOddWeek } from "./isOddWeek"
import { useSettings } from "../../../components/hooks/SettingsHook"

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
    isGeneral?: boolean,
    countInps?: CountInpsType[],
    setCountInps?: React.Dispatch<SetStateAction<CountInpsType[]>>,
    extraBlocks?: ExtraScheduleBlock[],
    isSeparator?:boolean,
}

export default function ScheduleBlock({ 
    habit, 
    d, 
    edit, 
    isGeneral, 
    countInps, 
    setCountInps,
    isSeparator = false,
    extraBlocks = []
}: ScheduleBlock) {
    const { weekStart } = useSettings()
    const { calendar } = useCalendar()
    const today = new Date()
    const navigate = useNavigate()
    const tempIdRef = useRef(1)
    const getTimeClass = (h: Habit, day: number, date:Date) => {
        const now = new Date()

        if (calendar.find(c => c.isDone && c.date === dateToCalendarFormat(date) && Number(c.habitId) === h.id)) return "done"

        if (!h.start_time) return ""

        const [sh, sm] = h.start_time.split(":").map(Number)
        const start = new Date()
        start.setHours(sh, sm, 0, 0)

        if (h.end_time) {
            const [eh, em] = h.end_time.split(":").map(Number)
            const end = new Date()
            end.setHours(eh, em, 0, 0)

            if (day === today.getDay()) {
                if (now > start) return "ongoing"
            }
        }

        return ""
    }

    const countProcents = (habit: Habit) => {
        const [ eh, em ] = habit.end_time.split(':')
        const [ sh, sm ] = habit.start_time.split(':')
        const et = Number(eh) * 60 + Number(em)
        const st = Number(sh) * 60 + Number(sm)
        const now = today.getHours() * 60 + today.getMinutes()
        const dur = et - st
        const pass = now - st
        const percent = Math.min(Math.max(pass / dur * 100, 0), 100)
        return `${percent}%`
    }

    const timeToMinutes = (t: string) => {
        if (!t) return 0
        const normalized = t.replace(".", ":")
        const [h, m] = normalized.split(":")
        return (Number(h) || 0) * 60 + (Number(m) || 0)
    }
    return (
        <div className={`scheduleBlock ${!edit && getTimeClass(habit, d.value, d.date)}`} onClick={() => isGeneral && !edit && navigate(`/habit/${habit.id}`)}>
            {getTimeClass(habit, d.value, d.date) === "ongoing" && !edit &&
                <div className="scheduleBar">
                    <div className="scheduleBarGoing" style={{width:countProcents(habit)}}></div>
                </div>
            }
            <div className="scheduleBlockText">
                <span className="scheduleHabitTime">{formatHabitTime(habit)}</span>
                <span className="scheduleHabitName">{habit.name}</span>
            </div>
            {!edit && extraBlocks.length > 0 && (
                <div className="scheduleExtraBlocks">
                    {extraBlocks
                        .filter(b => b.isSeparator !== isOddWeek(weekStart, d.date))
                        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
                        .map((block) => (
                            <div className="scheduleExtraBlockWrapper" key={`${block.id}-${d.fullDate}`}>
                                <div className="scheduleExtraBlockLine">
                                </div>
                                <div  className="scheduleExtraBlock">
                                    <span className="scheduleHabitTime">
                                        {block.start_time && block.end_time 
                                            ? `с ${block.start_time} до ${block.end_time}` 
                                            : block.start_time || ""}
                                    </span>
                                    <span className="scheduleHabitName">{block.name}</span>
                                </div>
                            </div>
                        ))
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
                                с
                                <input
                                    type="text"
                                    className="scheduleInp"
                                    placeholder="чч:мм"
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
                                до
                                <input
                                    type="text"
                                    className="scheduleInp"
                                    placeholder="чч:мм"
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

                            <textarea
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
                    onClick={() =>
                        setCountInps(prev => [
                            ...prev,
                            {
                                fullDate: d.fullDate,
                                day_of_week: d.value,
                                isSeparator: isSeparator,
                                id: 0,
                                tempId: tempIdRef.current++,
                                start_time: "",
                                end_time: "",
                                name: ""
                            }
                        ])
                    }
                >
                    <Plus/>Добавить блок
                </button>
            )}
        </div>
    )
}