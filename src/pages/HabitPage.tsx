import { useEffect } from "react";
import { useParams } from "react-router";

import Calendar from "../components/ts/Calendar";
import RedHabit from "../components/ts/redHabit";

import "../scss/Stats.scss";
import Loader from "../components/ts/Loader";
// import Goals from "../components/ts/Goals";
import { useTheHabit } from "../components/hooks/TheHabitHook";
import { useCalendar } from "../components/hooks/CalendarHook";

export default function Habit() {
    const { fetchCalendarHabit, fetchCalendarUser } = useCalendar()
    const { calendarLoading } = useCalendar()
    const { loadHabit, habit, isReadOnly, isDone, loadingHabit } = useTheHabit()
    const { habitId } = useParams<{ habitId: string }>();

    // const [ habitTab, setHabitTab ] = useState("habit")
    
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
            {/* <Goals habit={habit} readOnly={isReadOnly} id={Number(habitId)}/> */}
            {/* <div className="habitMenu"></div> */}
            {habitId && habit ? (
                <RedHabit habit={habit} readOnly={isReadOnly} id={Number(habitId)} isDone={isDone}/>
            ) : ("")}
        </div>
    );
}
