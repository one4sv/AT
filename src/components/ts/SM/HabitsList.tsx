import "../../../scss/SM/habitsList.scss";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { GhostIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../../hooks/HabitsHook";
import { usePlans } from "../../hooks/PlansHook";
import { useCalendar } from "../../hooks/CalendarHook";
import { useSettings } from "../../hooks/SettingsHook";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useContacts } from "../../hooks/ContactsHook";
import HabitDiv from "../Habit";
import PlanDiv from "../Plan";
import useHabitDayProgress from "../../hooks/utils/useHabitDayProgress";
import { makeSideMenuEntries } from "../utils/dayTimeline";
import { clockInAppZone, shiftCalendarDay, todayStrFunc } from "../utils/dateToStr";

export default function HabitsList({ filter }: { filter?: string }) {
    const { t } = useTranslation("common");
    const { search } = useContacts();
    const { habits, refetchHabitsWLoading } = useHabits();
    const { plans } = usePlans();
    const { allCalendar } = useCalendar();
    const { showArchived, showHabitGoals } = useSettings();
    const { habitId } = useParams();
    const { setBlackout } = useBlackout();
    const progressDay = filter === "plans" || filter === "archived" ? "" :
        filter === "tomorrow" ? shiftCalendarDay(todayStrFunc(), 1) :
        filter && /^\d{4}-\d{2}-\d{2}$/.test(filter) ? filter : todayStrFunc();
    const progress = useHabitDayProgress(progressDay);
    const [planClock,setPlanClock] = useState(()=>todayStrFunc()+" "+clockInAppZone());
    useEffect(()=>{
        const update=()=>setPlanClock(todayStrFunc()+" "+clockInAppZone());
        const timer=window.setInterval(update,15000);
        window.addEventListener("focus",update);
        return ()=>{window.clearInterval(timer);window.removeEventListener("focus",update);};
    },[]);
    const entries = useMemo(
        () => makeSideMenuEntries(filter, habits, plans, allCalendar, showArchived, search, planClock.slice(11)),
        [filter, habits, plans, allCalendar, showArchived, search, planClock]
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
                showIndicators progress={progress[String(entry.habit.id)]} showPinnedGoal={showHabitGoals && entry.habit.ongoing}/> :
            <PlanDiv plan={entry.plan!} entry={entry} key={entry.key}/>
        )}
    </div>;
}
