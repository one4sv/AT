import { useEffect, useRef} from "react";
import { useParams } from "react-router";
import { useTheHabit } from "../../components/hooks/TheHabitHook";
import { useCalendar } from "../../components/hooks/CalendarHook";
import Loader from "../../components/ts/Loader";
import "./scss/habitInfo.scss";
import "./scss/redHabit.scss";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import HabitName from "./components/HabitInfo/HabitName";
import Calendar from "./components/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams";
import DayComment from "./components/Habit/Comment/DayComment";
import Complete from "./components/Habit/Complete/Complete";
import Schedule from "./components/Schedule/Schedule";
import ChosenDay from "./components/Calendar/ChosenDay";
import { useSchedule } from "../../components/hooks/ScheduleHook";
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
    const { fetchCalendarHabit, fetchCalendarWLoading, calendarLoading } = useCalendar();
    const { loadHabitWLoading, habit, loadingHabit, habitSettings } = useTheHabit();
    const {
        showHabitMenu,
        setShowHabitMenu,
        setShowSlide,
    } = useSideMenu();

    const { schedules } = useSchedule();
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle();
    const { habits, loadingHabits } = useHabits();

    const mainRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!showHabitMenu) {
            setShowSlide(null);
        }
    }, [setShowSlide, showHabitMenu]);

    useEffect(() => {
        if (habitId) {
            loadHabitWLoading(habitId);
            fetchCalendarHabit(habitId);
        } else {
            fetchCalendarWLoading();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);

    useEffect(() => {
        if (habitId && habit) {
            setTitle(habit.name);
        } else if (!habitId) {
            setTitle("Активности");
        }
    }, [habitId, habit, habit?.name, loadingHabit, setTitle]);

    const shouldShowSchedule =
        (!habitId && Object.values(schedules).some(arr => arr.length > 0)) ||
        (habit &&
            habitId === String(habit.id) &&
            habit.periodicity !== "sometimes" &&
            habitSettings.schedule);

    if (loadingHabit || loadingHabits || calendarLoading) {
        return <Loader />;
    }

    const isMy =
        (habitId !== undefined &&
            habits?.some(h => String(h.id) === habitId)) ??
        false;

    const isArchived = !habit?.ongoing;
    const isReadOnly = !isMy || isArchived;
    

    return (
        <div className="statsDiv">
            {habitId && (
                <HabitName
                    habit={habit}
                    showHabitMenu={showHabitMenu}
                    setShowHabitMenu={setShowHabitMenu}
                    isReadOnly={isReadOnly}
                />
            )}

            <div
                className="StatsDivMain"
                ref={mainRef}
            >
                <div className="StatsDivHabit">
                    {isMobile ? (
                        <>
                            {habitId && (
                                <div className="mobileHabitLayout">
                                    <Complete isMy={!isReadOnly} />
                                    {habitSettings.metric_type === "timer" && <CompletionProgress />}
                                    {habitSettings.metric_type === "counter" && (
                                        <CounterProgression />
                                    )}
                                </div>
                            )}

                            <Calendar />
                            {!habitId && <ChosenDay />}
                        </>
                    ) : (
                        <>
                            <Calendar />
                            {habitId ? (
                                <>
                                    <Complete isMy={!isReadOnly} />
                                    <div className="dayCommentDiv">
                                        <DayComment id={habitId!} isMy={!isReadOnly} />
                                        {habitSettings.metric_type === "timer" && <CompletionProgress />}
                                        {habitSettings.metric_type === "counter" && (
                                            <CounterProgression />
                                        )}
                                    </div>
                                </>
                            ) : (
                                <ChosenDay />
                            )}
                        </>
                    )}
                </div>

                {shouldShowSchedule && (
                    <Schedule id={habitId} isMy={!isReadOnly} />
                )}

                <Diagrams mainRef={mainRef} />
            </div>
            {isMobile && habitId ? (
                <HabitMobileDone habitId={habitId} isReadOnly={isReadOnly}/>
            ): ""}
            {habitId && habit && (
                <HabitMenu isMy={isMy} isArchived={isArchived} isReadOnly={isReadOnly}/>
            )}
        </div>
    );
}