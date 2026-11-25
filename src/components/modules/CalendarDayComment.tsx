import {useTranslation} from "react-i18next";
import {useBlackout} from "../hooks/BlackoutHook";
import DayComment from "../../pages/HabitPage/components/Habit/Comment/DayComment";
import {formatDateFromString} from "../ts/utils/dateToStr";
import "./scss/addPlan.scss";

export default function CalendarDayComment(){
    const {t}=useTranslation("common"),{blackout}=useBlackout();
    const id=blackout.options?.habitId || "",date=blackout.options?.id || "";
    return <div className="addHabitDiv addPlanDiv calendarCommentModal">
        <h2>{t("calendarDay.editComment")} · {formatDateFromString(date)}</h2>
        <DayComment key={id+":"+date} id={id} date={date} isMy={false} modal/>
    </div>;
}
