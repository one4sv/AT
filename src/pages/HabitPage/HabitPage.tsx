import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation, useNavigate } from "react-router";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { useUser } from "../../components/hooks/UserHook";
import { useTheHabit } from "../../components/hooks/TheHabitHook";
import { useCalendar } from "../../components/hooks/CalendarHook";
import Skeleton from "../../components/ts/Skeleton";
import "./scss/habitInfo.scss";
import "./scss/redHabit.scss";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import HabitName from "./components/HabitInfo/HabitName";
import Calendar from "./components/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams";
import SharedDayComments from "./components/Habit/Comment/SharedDayComments";
import DayComment from "./components/Habit/Comment/DayComment";
import Complete from "./components/Habit/Complete/Complete";
import Schedule from "./components/Schedule/Schedule";
import HabitOverviewLayout from "./components/Overview/HabitOverviewLayout";
import { useSchedule } from "../../components/hooks/ScheduleHook";
import { usePlans } from "../../components/hooks/PlansHook";
import { todayStrFunc } from "../../components/ts/utils/dateToStr";
import { useHabits } from "../../components/hooks/HabitsHook";
import { useSideMenu } from "../../components/hooks/SideMenuHook";
import HabitMenu from "./components/HabitInfo/HabitMenu";
import CompletionProgress from "./components/Habit/Comment/ComplitionProgress";
import CounterProgression from "./components/Habit/Comment/CounterProgression";
import HabitMobileDone from "./components/Habit/Mobile/HabitMobileDone";
export interface HabitSlideProps {
    readOnly?: boolean;
    isArchived?: boolean;
    isMy?: boolean;
}
export default function Habit() {
    const { t } = useTranslation("common");
    const { setBlackout } = useBlackout();
    const location = useLocation();
    const navigate = useNavigate();
    const {
        fetchCalendarHabitWLoading,
        fetchCalendarWLoading,
        calendarLoading
    } = useCalendar();
    const {
        loadHabitWLoading,
        habit,
        loadingHabit,
        habitSettings
    } = useTheHabit();
    const {
        showHabitMenu,
        setShowHabitMenu,
        setShowSlide
    } = useSideMenu();
    const { schedules } = useSchedule();
    const { plans } = usePlans();
    const { user } = useUser();
    const { habitId } = useParams<{
        habitId: string;
    }>();
    const { setTitle } = usePageTitle();
    const {
        habits,
        loadingHabits
    } = useHabits();
    const mainRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!habitId || !habit || String(habit.id) !== habitId ||
            !habit.access?.can_invite || !new URLSearchParams(location.search).has("invite")) return;
        setBlackout({ seted: true, module: "HabitParticipantPicker",
            point: habit.chat_id ? "shared" : "personal" });
        const params = new URLSearchParams(location.search);
        params.delete("invite");
        navigate({ pathname: location.pathname, search: params.toString() ? "?" + params.toString() : "" },
            { replace: true });
    }, [habitId, habit?.id, habit?.chat_id, habit?.access?.can_invite,
        location.pathname, location.search, navigate, setBlackout]);

    useEffect(
        () => {
            if (!showHabitMenu) {
                setShowSlide(null);
            }
        },
        [setShowSlide, showHabitMenu]
    );

    useEffect(
        () => {
            if (habitId) {
                loadHabitWLoading(habitId);
                fetchCalendarHabitWLoading(habitId);
            } else {
                fetchCalendarWLoading();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [habitId]
    );

    useEffect(
        () => {
            if (habitId && habit) {
                setTitle(habit.name);
            } else if (!habitId) {
                setTitle(t("sideMenu.plansAndActivities"));
            }
        },
        [habitId, habit, habit?.name, loadingHabit, setTitle, t]
    );
    useEffect(() => {
        if (!habitId && !loadingHabits && !calendarLoading) {
            mainRef.current?.scrollTo(0, 0);
        }
    }, [habitId, loadingHabits, calendarLoading]);

    const shouldShowSchedule = (!habitId && (Object.values(schedules).some(arr => arr.length > 0) ||
        plans.some(plan => plan.membership_status !== "pending" && plan.status !== "canceled" &&
            plan.plan_date >= todayStrFunc()))) ||
        !!(habit && habitId === String(habit.id) && habit.periodicity !== "sometimes" && habitSettings.schedule);
    if (habitId && (loadingHabit || loadingHabits || calendarLoading)) {
        return <Skeleton type="habit" overview={!habitId} />;
    }
    const isMy = !!habit && habit.user_id === user.id;
    const isMember = !!habits?.some(h => h.id === habit?.id);
    const canComplete = habit?.access?.can_complete ?? (isMy || isMember);
    const canComment = habit?.access?.can_comment ?? (isMy || isMember);
    const isArchived = !habit?.ongoing;
    const isReadOnly = !isMy || isArchived;
    const isCompletionReadOnly = !canComplete || isArchived;

    return (
        <div className="statsDiv">
            {habitId && <HabitName
                habit={habit}
                showHabitMenu={showHabitMenu}
                setShowHabitMenu={setShowHabitMenu}
                isReadOnly={isReadOnly}
            />}

            <div className="StatsDivMain" ref={mainRef}>
                {!habitId ? <HabitOverviewLayout /> : <div className="StatsDivHabit">
                    {isMobile ? <>
                        <div className="mobileHabitLayout">
                            <Complete isMy={!isCompletionReadOnly} />
                            {habitSettings.metric_type === "timer" && <CompletionProgress />}
                            {habitSettings.metric_type === "counter" && <CounterProgression />}
                        </div>
                        <Calendar />
                    </> : <>
                        <Calendar />
                        <Complete isMy={!isCompletionReadOnly} />
                        <div className="dayCommentDiv">
                            <DayComment id={habitId} isMy={canComment && !isArchived} />
                            <SharedDayComments />
                            {habitSettings.metric_type === "timer" && <CompletionProgress />}
                            {habitSettings.metric_type === "counter" && <CounterProgression />}
                        </div>
                    </>}
                </div>}

                {shouldShowSchedule && <Schedule id={habitId} isMy={!!habit?.access?.can_edit_blocks || isMy} />}

                {isMobile && habitId && <SharedDayComments mobile />}
                <Diagrams mainRef={mainRef} />
            </div>
            {isMobile && habitId ? <HabitMobileDone habitId={habitId} isReadOnly={isCompletionReadOnly} canComment={canComment && !isArchived} /> : ""}
            {habitId && habit && <HabitMenu isMy={isMy} isArchived={isArchived} isReadOnly={isReadOnly} />}
        </div>
    );
}
