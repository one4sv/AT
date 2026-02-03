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
import GoalsChats from "./components/HabitInfo/GoalsChats";
import HabitSettings from "./components/HabitInfo/HabitSettings";
import HabitName from "./components/HabitInfo/HabitName";
import Timer from "./components/Habit/Timer/Timer";
import Calendar from "./components/Stats/Calendar/Calendar";
import Diagrams from "./components/Stats/Diagrams/Diagrams";
import DayComment from "./components/Habit/Comment/DayComment";


export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarWLoading } = useCalendar()
    const { calendarLoading } = useCalendar()
    const { loadHabitWLoading, habit, isReadOnly, loadingHabit } = useTheHabit()
    const { habitId } = useParams<{ habitId: string }>();
    const { setTitle } = usePageTitle()
    const [ showHabitMenu, setShowHabitMenu ] = useState(false)

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

    
    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }
    return (
        <div className={`statsDiv ${isMobile ? "mobile" : ""}`}>
            {habitId && <HabitName habit={habit} showHabitMenu={showHabitMenu} setShowHabitMenu={setShowHabitMenu} isReadOnly={isReadOnly}/>}
            <div className="StatsDivMain" style={{top:habitId ? "6vh" : "0"}}>
                {habitId && 
                    <div className="StatsDivHabit">
                        <Timer/>
                        <DayComment id={habitId} isMy={!isReadOnly}/>
                    </div>
                }
                <div className="StatsDivStats">
                    <Calendar/>
                    <Diagrams/>
                </div>
            </div>
            {habitId && habit && (
                <div className={`habitMenu ${isMobile ? "mobile" : ""}`} style={{right: showHabitMenu ? "0" : "-25vw"}}>
                    <HabitInfo habit={habit} readOnly={isReadOnly}/>
                    <GoalsChats habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
                    <HabitSettings readOnly={isReadOnly}/>
                </div>
            )}
        </div>
    );
}

