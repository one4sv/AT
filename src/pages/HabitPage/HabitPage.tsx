import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTheHabit } from "../../components/hooks/TheHabitHook";
import { useCalendar } from "../../components/hooks/CalendarHook";
import Loader from "../../components/ts/Loader";
import "./scss/habitInfo.scss";
import "./scss/redHabit.scss";
import HabitInfo from "./components/HabitInfo/HabitInfo";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import HabitSettings from "./components/HabitInfo/HabitSettings";
import HabitName from "./components/HabitInfo/HabitName";
import Calendar from "./components/Habit/Complete/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams";
import DayComment from "./components/Habit/Comment/DayComment";
import Complete from "./components/Habit/Complete/Complete";
import CompJurnal from "./components/Habit/Complete/Calendar/CompJurnal";
import Schedule from "./components/Schedule/Schedule";
import ChosenDay from "./components/Habit/Complete/Calendar/ChosenDay";
import { useDiagrams } from "../../components/hooks/DiagramHook";
import HabitSave from "./components/HabitInfo/HabitSave";
import { useSchedule } from "../../components/hooks/ScheduleHook";
import HabitExtraButts from "./components/HabitInfo/HabitExtraButts";


export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarWLoading, chosenDay, calendarLoading } = useCalendar()
    const { loadHabitWLoading, habit, isReadOnly, loadingHabit, habitSettings } = useTheHabit()
    const { schedules } = useSchedule()
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle()
    const { mainRef } = useDiagrams()

    const [ showHabitMenu, setShowHabitMenu ] = useState(false)
    const [ showSettings, setShowSettings ] = useState(false)

    useEffect(() => {
        if (!showHabitMenu) setShowSettings(false)
    }, [showHabitMenu])

    useEffect(() => {
        if (habitId) {
            loadHabitWLoading(habitId)
            fetchCalendarHabit(habitId)
        } else {
            fetchCalendarWLoading()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);

    useEffect(() => {
        if (habit && Number(habitId) === habit.id && habit?.name && !loadingHabit) {
            setTitle(habit.name)
        } else if (!habitId) {
            document.title = "Активности";
        }
    }, [habitId, habit, habit?.name, loadingHabit, setTitle]);

    const shouldShowSchedule =
        (!habitId && Object.values(schedules).some(arr => arr.length > 0)) ||
        (habit && habitId === String(habit.id) && habit.periodicity !== "sometimes" && habitSettings.schedule);

    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }

    return (
        <div className={`statsDiv ${isMobile ? "mobile" : ""}`}>
            {habitId && <HabitName habit={habit} showHabitMenu={showHabitMenu} setShowHabitMenu={setShowHabitMenu} isReadOnly={isReadOnly}/>}
            <div className={`StatsDivMain ${habitId ? "sdmwm" : ""}`} style={{top:habitId ? "6vh" : "0"}} ref={mainRef}>
                <div className="StatsDivHabit">
                    <Calendar/>
                    {habitId &&
                        <>
                            <Complete isMy={!isReadOnly}/>
                            <DayComment id={habitId} isMy={!isReadOnly}/>
                        </>
                    }
                    <CompJurnal/>
                    {!habitId && chosenDay && <ChosenDay/>}
                </div>
                {shouldShowSchedule && (
                    <Schedule id={habitId} isMy={!isReadOnly}/>
                )}
                <Diagrams/>
            </div>
            {habitId && habit && (
                <div
                    className={`habitMenu ${isMobile ? "mobile" : ""}`}
                    style={{ right: showHabitMenu ? "0" : isMobile ? "-100vw" : "-25vw" }}
                >
                    <div className={`habitSlider ${showSettings ? "toSettings" : ""}`}>

                        {/* Слайд 1 */}
                        <div className="habitSlide">
                            <HabitInfo habit={habit} readOnly={isReadOnly}/>
                            <HabitExtraButts
                                habit={habit}
                                readOnly={isReadOnly}
                                id={Number(habitId)}
                                setShowSettings={setShowSettings}
                            />
                        </div>

                        {/* Слайд 2 */}
                        <div className="habitSlide">
                            <HabitSettings
                                readOnly={isReadOnly}
                                id={habit.id}
                                setShown={setShowSettings}
                            />
                        </div>

                    </div>

                    {/* ВСЕГДА поверх */}
                    <HabitSave
                        readOnly={isReadOnly}
                        id={habit.id}
                        archived={habit.is_archived}
                    />
                </div>
            )}
        </div>
    );
}

