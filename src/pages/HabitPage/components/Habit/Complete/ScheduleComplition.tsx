import { useState } from "react";
import { useSchedule } from "../../../../../components/hooks/ScheduleHook";
import { useParams } from "react-router";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/scheduleComp.scss";
import { CheckCircleIcon, Circle } from "@phosphor-icons/react";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import { todayStrFunc } from "../../../utils/dateToStr";
import { useScheduleCompleted } from "../../../../../components/hooks/utils/useScheduleCompleted";

export default function ScheduleComplition() {
    const { scheduleComplete, loadingComp, loading } = useSchedule();
    const { chosenDay } = useCalendar();
    const { habitId: id } = useParams<{ habitId: string }>();
    const [ hover, setHover ] = useState<number>(0)

    const scheduleCompleted = useScheduleCompleted(id)
    const date = chosenDay || todayStrFunc();

    if (!id) return null;
    if (loading) return (
        <div className="scheduleCompilition">
            <span className="scheduleRest">Загрузка</span>
        </div>
    )
    
    return (
        <div className="scheduleCompilition">
            {!loading && scheduleCompleted.length === 0 &&(<span className="scheduleRest">Выходной</span>)}
            {scheduleCompleted.map((s) => {
                const key = `${s.id} - ${date}`
                console.log(key, loadingComp.some(l => l === key))
                return (
                    <div
                        className="scheduleButt"
                        key={key}
                        onClick={() => scheduleComplete(id, s.id, date)}
                        onMouseOver={() => setHover(s.id)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <div className="scheduleButtInfo">
                            <span className="scheduleButtSpan">
                                {s.start_time} - {s.end_time}:
                            </span>
                            {s.name}
                        </div>
                        <div className="scheduleButtSvg">
                            {loadingComp.some(l => l === key) 
                                ? <LoaderSmall/>
                                : s.completed
                                    ? <CheckCircleIcon weight="fill" className="scsvg"/>
                                    : hover === s.id ? <CheckCircleIcon/> : <Circle/>
                            }
                        </div>
                    </div>
                )
            })}
        </div>
    );
}