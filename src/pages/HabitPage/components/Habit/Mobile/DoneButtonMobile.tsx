import { CalendarBlankIcon, CalendarCheckIcon, CheckCircleIcon, Circle, ClockIcon } from "@phosphor-icons/react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useDone } from "../../../../../components/hooks/DoneHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import { usePlanned } from "../../../../../components/hooks/PlannedHook";
import type { Dispatch, SetStateAction } from "react";

interface DoneButtonProps {
    habitId: number;
    open: string;
    setOpen: Dispatch<SetStateAction<string>>
}

export default function DoneButton({ habitId, open, setOpen }: DoneButtonProps) {
    const { todayDone, isDone, doable, planable, isPlanned } = useTheHabit();
    const { markDoneWLoading, waitDoneAnswer } = useDone();
    const { waitPlanAnswer, markPlanWLoading } = usePlanned()
    const { chosenDay } = useCalendar();

    const displayDone = isDone !== null ? isDone : todayDone;
    const displayPlan = isPlanned

    return (
        <div className={`doneButtDivMobile ${open === "done" ? "open" : "close"} ${planable ? "planable" : doable ? "doable" : "waiting"}`}>
            {open === "comment" ? (
                <div className="bottomOpen" onClick={() => setOpen("done")}>
                    {planable
                        ? displayPlan
                            ? <CalendarCheckIcon size={22}/>
                            : <CalendarBlankIcon size={22}/>
                        : doable
                            ? displayDone
                                ? <CheckCircleIcon weight="fill" size={22}/>
                                : <Circle size={22}/>
                            : <ClockIcon size={22}/>
                    }
                </div>
            ) : (
                planable ? (
                    <button
                        className={`doneButtMobile planButt ${displayDone ? "dbComp" : "dbMark"}`}
                        onClick={() => markPlanWLoading(habitId, chosenDay)}
                    >
                        {displayPlan ? <CalendarCheckIcon size={22}/> : <CalendarBlankIcon size={22}/>}
                        {waitPlanAnswer ? <LoaderSmall/> : displayPlan ? "Запланировано" : "Запланировать"}
                    </button>
                ) : doable ? (
                    <button
                        className={`doneButtMobile ${displayDone ? "dbComp" : "dbMark"}`}
                        onClick={() => markDoneWLoading(habitId, chosenDay)}
                    >
                        {displayDone ? <CheckCircleIcon weight="fill" size={22}/> : <Circle size={22}/>}
                        {waitDoneAnswer ? <LoaderSmall/> : displayDone ? "Выполнено" : "Выполнить"}
                    </button>
                ) : (
                    <button
                        className="doneButtMobile disabled"
                        onClick={() => undefined}
                    >
                        <ClockIcon size={22}/>
                        Ожидаем
                    </button>
                )
            )}
        </div>
    );
}