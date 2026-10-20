import { useSchedule } from "../../../../../components/hooks/ScheduleHook";
import { useParams } from "react-router";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import "../../../scss/scheduleComp.scss";
import { CheckCircleIcon, CircleIcon, ListChecksIcon } from "@phosphor-icons/react";
import { LoaderSmall } from "../../../../../components/ts/LoaderSmall";
import { todayStrFunc } from "../../../../../components/ts/utils/dateToStr";
import { useScheduleCompleted } from "../../../../../components/hooks/utils/useScheduleCompleted";
import { useTranslation } from "react-i18next";

export default function ScheduleCompletion({ isMy }: { isMy: boolean }) {
    const { scheduleComplete, loadingComp, loading } = useSchedule();
    const { chosenDay } = useCalendar();
    const { habitId: id } = useParams<{ habitId: string }>();
    const { t } = useTranslation("common");
    const scheduleCompleted = useScheduleCompleted(id);
    const date = chosenDay || todayStrFunc();

    if (!id) return null;

    return (
        <div className="scheduleCompilition" aria-busy={loading}>
            {loading && scheduleCompleted.length === 0 && <div className="completionEmpty" role="status"><LoaderSmall/></div>}
            {!loading && scheduleCompleted.length === 0 && <div className="completionEmpty"><ListChecksIcon size={32}/><span>{t("activityCompletion.noTasks")}</span></div>}
            {scheduleCompleted.map(block => {
                const key = `${block.id} - ${date}`;
                const pending = loadingComp.includes(key);
                const time = [block.start_time, block.end_time].filter(Boolean).join(" — ");
                return (
                    <button type="button" className={`scheduleButt ${block.completed ? "completed" : ""}`} key={key} disabled={!isMy || pending} aria-pressed={block.completed} onClick={() => scheduleComplete(id, block.id, date)}>
                        <span className="scheduleButtInfo">
                            {time && <span className="scheduleButtSpan">{time}</span>}
                            <span>{block.name}</span>
                        </span>
                        <span className="scheduleButtSvg" aria-hidden="true">{pending ? <LoaderSmall/> : block.completed ? <CheckCircleIcon weight="fill" className="scsvg"/> : <CircleIcon/>}</span>
                    </button>
                );
            })}
        </div>
    );
}
