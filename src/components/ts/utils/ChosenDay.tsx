import { useEffect, useMemo, useRef, useState } from "react";
import { useCalendar } from "../../hooks/CalendarHook";
import { useNavigate, useParams } from "react-router-dom";
import "../../../scss/ChosenDay.scss"
import type { Calendar } from "../../context/CalendarContext";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { useDone } from "../../hooks/DoneHook";
import { useHabits } from "../../hooks/HabitsHook";
import { getDayArrays } from "./getDayArrs";

export default function ChosenDay() {
    const { chosenDay: day, setChosenDay, calendarRef, calendar } = useCalendar()
    const { markDone } = useDone()
    const { habits } = useHabits()
    const { habitId:id } = useParams<{ habitId: string }>();
    const navigate = useNavigate()
    const ChosenDayRef = useRef<HTMLDivElement | null>(null)
    const [ mouseOver, setMouseOver ] = useState("")
    
    const [ y, m, d ] = day.split("-")
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { completedArr, skippedArr, willArr } = useMemo(
        () => getDayArrays(day, calendar, habits, id),
        [day, calendar, habits, id]
    )

    useEffect(() => {
        const handleClickOutside = (e:MouseEvent) => {
            if (
                ChosenDayRef.current && 
                !ChosenDayRef.current.contains(e.target as Node) &&
                calendarRef.current &&
                !calendarRef.current.contains(e.target as Node)
            ) setChosenDay("")
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [calendarRef, setChosenDay])

    const doneButt = (cn:string, id:string) => {
        if (cn === "comp" && day === todayStr) {
            if (mouseOver === id) return <CheckCircle weight="fill"/>
            else return <CheckCircle weight="fill" color="#11c011"/>
        } else if (cn === "skip" && day === todayStr) {
            if (mouseOver === id) return <CheckCircle/>
            else return <Circle/>
        } else return
    }

    const getHabitTime = (id: string) => {
        const habit = habits?.find(
            h => h.id === Number(id) && ((h.start_time && h.start_time !== null) || (h.end_time && h.end_time !== null))
        );

        const st = habit?.start_time;
        const et = habit?.end_time;

        if (st && et && st !== null) {
            return ` с ${st} по ${et}`;
        }
        if (st || et) {
            return st ? `в ${st}` : `до ${et}`
        }
        return "";
    };

    const mappingHabits = (arr:Calendar[], cn:string) => {
        if (arr.length === 0) return null
        return (
            <div className={`cd${cn}Div`}>
                {arr.map((c)=> (
                    <div className="cdHabitStr" key={c.habitId}>
                        <div className="cdHabitInfo" onClick={() => navigate(`/habit/${c.habitId}`)}>
                            <div className="cdHabitName">
                                <div className={`calendarDot ${cn}`}/><span className="cdHabitText">{c.habitName}</span>
                            </div>
                            { day > todayStr ? (
                                <div className="sdHabitTime">
                                    {getHabitTime(c.habitId)}
                                </div>
                            ) : ""}
                            
                        </div>
                        <div className="cdHabitDoneButt" onMouseOver={() => setMouseOver(c.habitId)} onMouseLeave={() => setMouseOver("")} onClick={() => markDone(Number(c.habitId))}>
                            {doneButt(cn, c.habitId)}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (id || day === "") return null;
    return (
        <div className={`chosenDayDiv ${day === "" ? "" : "active"}`} ref={ChosenDayRef}>
            <div className="chosenDayDate">
                {`${d}.${m}.${y}`}
            </div>
            {mappingHabits(completedArr, "comp")}
            {mappingHabits(skippedArr, "skip")}
            {mappingHabits(willArr, "will")}
        </div>
    )
}