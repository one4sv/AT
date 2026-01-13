import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CaretDoubleRight } from "@phosphor-icons/react";

import { useTheHabit } from "../../components/hooks/TheHabitHook";
import { useCalendar } from "../../components/hooks/CalendarHook";
import Calendar from "./components/Calendar/Calendar";
import Loader from "../../components/ts/Loader";
import Goals from "./components/HabitInfo/Goals";
import ExtraHabitInfo from "./components/HabitInfo/ExtraHabitInfo";
import "./scss/habitInfo.scss";
import "./scss/redHabit.scss";
import Diagrams from "./components/Calendar/Diagrams";
import HabitInfo from "./components/HabitInfo/HabitInfo";
import { isMobile } from "react-device-detect";


export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { calendarLoading } = useCalendar()
    const { loadHabitWLoading, habit, isReadOnly, loadingHabit } = useTheHabit()
    const { habitId } = useParams<{ habitId: string }>();
    const [ showHabitMenu, setShowHabitMenu ] = useState(true)

    useEffect(() => {
        if (habitId) {
            loadHabitWLoading(habitId)
            fetchCalendarHabit(habitId)
        } else fetchCalendarUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);
    
    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }
    return (
        <div className={`statsDiv ${isMobile ? "mobile" : ""}`}>
            <Calendar/>
            <Diagrams/>
            {habitId && habit ? (
                <div className={`habitMenu ${isMobile ? "mobile" : ""}`} style={{right: showHabitMenu ? "0.5vw" : "-25vw"}}>
                    <div className="habitMenuShowButt" onClick={()=> setShowHabitMenu(!showHabitMenu)}>
                        <CaretDoubleRight style={{transform: `rotate(${showHabitMenu ? "0deg" : "180deg"})`}}/>
                    </div>
                    <HabitInfo habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
                    <Goals habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
                    <ExtraHabitInfo habit={habit} readOnly={isReadOnly}/>
                </div>
            ) : ("")}
        </div>
    );
}
