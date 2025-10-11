import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { CaretDoubleRight } from "@phosphor-icons/react";

import { useTheHabit } from "../components/hooks/TheHabitHook";
import { useCalendar } from "../components/hooks/CalendarHook";
import Calendar from "../components/ts/Calendar";
import RedHabit from "../components/ts/redHabit";
import Loader from "../components/ts/Loader";
import Goals from "../components/ts/Goals";
import ExtraHabitInfo from "../components/ts/ExtraHabitInfo";
import "../scss/Stats.scss";
import Diagrams from "../components/ts/Diagrams";


export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { calendarLoading } = useCalendar()
    const { loadHabit, habit, isReadOnly, loadingHabit } = useTheHabit()
    const { habitId } = useParams<{ habitId: string }>();
    const [ showHabitMenu, setShowHabitMenu ] = useState(false)

    useEffect(() => {
        if (habitId) {
            loadHabit(habitId)
            fetchCalendarHabit(habitId)
        } else fetchCalendarUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [habitId]);
    
    if (loadingHabit || calendarLoading) {
        return <Loader/>
    }
    return (
        <div className="statsDiv">
            <Calendar/>
            <Diagrams/>
            {habitId && habit ? (
                <div className="habitMenu" style={{right: showHabitMenu ? "0.5vw" : "-25vw"}}>
                    <div className="habitMenuShowButt" onClick={()=> setShowHabitMenu(!showHabitMenu)}>
                        <CaretDoubleRight style={{transform: `rotate(${showHabitMenu ? "0deg" : "180deg"})`}}/>
                    </div>
                    <RedHabit habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
                    <Goals habit={habit} readOnly={isReadOnly} id={Number(habitId)}/>
                    <ExtraHabitInfo />
                </div>
            ) : ("")}
        </div>
    );
}
