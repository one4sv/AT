import "../../../scss/SM/habitsList.scss";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { GhostIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useHabits } from "../../hooks/HabitsHook";
import { usePlans } from "../../hooks/PlansHook";
import { useCalendar } from "../../hooks/CalendarHook";
import { useSettings } from "../../hooks/SettingsHook";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useContacts } from "../../hooks/ContactsHook";
import { useSideMenu } from "../../hooks/SideMenuHook";
import HabitDiv from "../Habit";
import { makeSideMenuEntries, describeDayTime } from "../utils/dayTimeline";
import { formatDateFromString, relativePlanDay } from "../utils/dateToStr";
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
    const { calendar } = useCalendar();
    const { showArchived } = useSettings();
    const { habitId } = useParams();
    const { pathname } = useLocation();
    const { setBlackout } = useBlackout();
    const { closeMenu } = useSideMenu();
    const entries = useMemo(
        () => makeSideMenuEntries(filter, habits, plans, calendar, showArchived, search),
        [filter, habits, plans, calendar, showArchived, search]
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
            <HabitDiv habit={entry.habit} key={entry.key} id={Number(habitId)} isMyAcc={true}/> :
            <Link to={"/plan/" + entry.plan!.id} key={entry.key}
                className={`habit smPlanItem ${pathname.replace(/\/$/, "") === "/plan/" + entry.plan!.id ? "active" : ""}`}
                aria-current={pathname.replace(/\/$/, "") === "/plan/" + entry.plan!.id ? "page" : undefined}
                onClick={closeMenu}>
                <PlanTagIcon tag={entry.plan?.tag}/>
                <span className="habitInfo">
                    <span className="habitName">{entry.name}</span>
                    <span className="habitPer">{relativePlanDay(entry.date, t) || formatDateFromString(entry.date)} · {describeDayTime(entry, t)}</span>
                </span>
            </Link>
        )}
    </div>;
}
