import "../../../scss/SM/habitsList.scss";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircleIcon, GhostIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../../hooks/HabitsHook";
import { usePlans } from "../../hooks/PlansHook";
import { useCalendar } from "../../hooks/CalendarHook";
import { useSettings } from "../../hooks/SettingsHook";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useContacts } from "../../hooks/ContactsHook";
import { useSideMenu } from "../../hooks/SideMenuHook";
import HabitDiv from "../Habit";
import ActivityIndicators from "../ActivityIndicators";
import useHabitDayProgress from "../../hooks/utils/useHabitDayProgress";
import { makeSideMenuEntries, describeDayTime } from "../utils/dayTimeline";
import { formatDateFromString, relativePlanDay, shiftCalendarDay, todayStrFunc } from "../utils/dateToStr";
import { tags } from "../tags";

function PlanTagIcon({ tag }: { tag?: string | null }) {
    const selectedTag = tags.find(item => item.value === tag);
    if (!selectedTag) return null;
    const Icon = selectedTag.icon;
    return <div className="habitIcon"><Icon className="habitIconSvg"/></div>;
}

export default function HabitsList({ filter }: { filter?: string }) {
    const { t } = useTranslation("common");
    const { search } = useContacts();
    const { habits, refetchHabitsWLoading } = useHabits();
    const { plans } = usePlans();
    const { allCalendar } = useCalendar();
    const { showArchived } = useSettings();
    const { habitId } = useParams();
    const { pathname } = useLocation();
    const { setBlackout } = useBlackout();
    const { closeMenu } = useSideMenu();
    const progressDay = filter === "plans" || filter === "archived" ? "" :
        filter === "tomorrow" ? shiftCalendarDay(todayStrFunc(), 1) :
        filter && /^\d{4}-\d{2}-\d{2}$/.test(filter) ? filter : todayStrFunc();
    const progress = useHabitDayProgress(progressDay);
    const entries = useMemo(
        () => makeSideMenuEntries(filter, habits, plans, allCalendar, showArchived, search),
        [filter, habits, plans, allCalendar, showArchived, search]
    );

    if (!entries.length) return <div className="habitsList SMlist nothing">
        <div className="hbListNothingAction" onClick={() => setBlackout({ seted:true, module:"AddHabit" })}>
            <GhostIcon size={50} strokeWidth={1.5}/>
            {t("plans.emptyTimeline")}
            <a>{t("sideMenu.newActivity")}</a>
        </div>
        <div className="wtbgButt" onClick={() => void refetchHabitsWLoading()}>{t("sideMenu.loading")}</div>
    </div>;

    return <div className="habitsList SMlist">
        {entries.map(entry => entry.habit ?
            <HabitDiv habit={entry.habit} key={entry.key} id={Number(habitId)} isMyAcc={true}
                showIndicators progress={progress[String(entry.habit.id)]}/> :
            <Link to={"/plan/" + entry.plan!.id} key={entry.key}
                className={`habit smPlanItem ${pathname.replace(/\/$/, "") === "/plan/" + entry.plan!.id ? "active" : ""}`}
                aria-current={pathname.replace(/\/$/, "") === "/plan/" + entry.plan!.id ? "page" : undefined}
                onClick={closeMenu}>
                <PlanTagIcon tag={entry.plan?.tag}/>
                <span className="habitInfo">
                    <span className="habitName">
                        <span className="habitNameText">{entry.name}</span>
                        <ActivityIndicators part="aside" plan={entry.plan}/>
                    </span>
                    <span className="habitPer">
                        {relativePlanDay(entry.date, t) || formatDateFromString(entry.date)} · {describeDayTime(entry, t)}
                        {entry.completed && <CheckCircleIcon className="habitHLStatus" weight="fill"/>}
                    </span>
                </span>
            </Link>
        )}
    </div>;
}
