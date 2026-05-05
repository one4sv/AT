import { useEffect, useState} from "react";
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
import Calendar from "./components/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams";
import DayComment from "./components/Habit/Comment/DayComment";
import Complete from "./components/Habit/Complete/Complete";
import CompJurnal from "./components/Calendar/CompJurnal";
import Schedule from "./components/Schedule/Schedule";
import ChosenDay from "./components/Calendar/ChosenDay";
import { useDiagrams } from "../../components/hooks/DiagramHook";
import HabitSave from "./components/HabitInfo/HabitSave";
import { useSchedule } from "../../components/hooks/ScheduleHook";
import HabitExtraButts from "./components/HabitInfo/HabitExtraButts";
import { useHabits } from "../../components/hooks/HabitsHook";

export interface HabitSlideProps {
    id: number;
    readOnly?: boolean;
    isArchived?:boolean,
    isMy?:boolean
}

export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarWLoading, calendarLoading } = useCalendar()
    const { loadHabitWLoading, habit, loadingHabit, habitSettings } = useTheHabit()
    const { schedules } = useSchedule()
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle()
    const { mainRef } = useDiagrams()
    const { habits } = useHabits()
    const [ showHabitMenu, setShowHabitMenu ] = useState(false)
    const [ showSettings, setShowSettings ] = useState(false)
    const [ showJurnal, setShowJurnal ] = useState(false)

    const isSlided = showJurnal || showSettings
    
    useEffect(() => {
        if (!showHabitMenu) {
            setShowSettings(false)
            setShowJurnal(false)
        }
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
        if (habitId && habit) {
            setTitle(habit.name)
        } else if (!habitId) {
            setTitle("Активности")
        }
    }, [habitId, habit, habit?.name, loadingHabit, setTitle]);

    const shouldShowSchedule =
        (!habitId && Object.values(schedules).some(arr => arr.length > 0)) ||
        (habit && habitId === String(habit.id) && habit.periodicity !== "sometimes" && habitSettings.schedule);

    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }

    const isMy = (habitId !== undefined && habits?.some(h => String(h.id) === habitId)) ?? false
    const isArchived = !habit?.ongoing
    const isReadOnly = !isMy || isArchived

    const returnSlide = () => {
        if (showJurnal) setShowJurnal(false)
        else if (showSettings) setShowSettings(false)
        else setShowHabitMenu(false)
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
                    {!habitId && <ChosenDay/>}
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
                    <div className={`habitSlider ${showSettings || showJurnal ? "toSlide" : ""}`}>

                        {/* Слайд 1 */}
                        <div className="habitSlide">
                            <HabitInfo habit={habit} readOnly={isReadOnly}/>
                            <HabitExtraButts
                                habit={habit}
                                readOnly={isReadOnly}
                                id={Number(habitId)}
                                setShowSettings={setShowSettings}
                                setShowJurnal={setShowJurnal}
                            />
                        </div>

                        {/* Слайд 2 */}
                        <div className="habitSlide">
                            {showSettings && (
                                <HabitSettings
                                    readOnly={isReadOnly}
                                    id={habit.id}
                                    isArchived={isArchived}
                                    isMy={isMy}
                                />
                            )}
                            {showJurnal && (
                                <CompJurnal id={habit.id}/>
                            )}
                        </div>

                    </div>
                    <HabitSave
                        readOnly={isReadOnly}
                        id={habit.id}
                        archived={!habit.ongoing}
                        returnSlide={returnSlide}
                        isSlided={isSlided}
                    />
                </div>
            )}
        </div>
    );
}

