import { useEffect, useState, useRef } from "react"
import { useCalendar } from "../hooks/CalendarHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import "../../scss/calendar.scss"
import { ChevronDown } from "lucide-react"
import { useHabits } from "../hooks/HabitsHook"
import type { Calendar } from "../context/CalendarContext"
import DayCell from "./utils/DayCell"
import Streak from "./utils/Streak";
import ChosenDay from "./utils/ChosenDay";
import { useDone } from "../../components/hooks/DoneHook";
import { useParams } from "react-router-dom";
import DayComment from "./utils/DayComment";
import DoneButton from "./utils/DoneButt";

export default function Calendar() {
    const { calendar, calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useCalendar();
    const { habit, isDone, dayComment } = useTheHabit();
    const { habits } = useHabits()
    const { markDone } = useDone()
    const { habitId:id } = useParams<{habitId : string}>()

    const [ years, setYears ] = useState<number[] | null>([])
    const [ thisMonth, setThisMonth ] = useState<number[]>([])
    const [ prevMonth, setPrevMonth ] = useState<number[]>([])
    const [ postMonth, setPostMonth ] = useState<number[]>([])
    const [ showList, setShowList ] = useState({
        months:false,
        years:false
    })
    const monthsRef = useRef<HTMLDivElement>(null)
    const yearsRef = useRef<HTMLDivElement>(null)

    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ]
    const dayWeek = [
        { value: 1, label: "пн" },
        { value: 2, label: "вт" },
        { value: 3, label: "ср" },
        { value: 4, label: "чт" },
        { value: 5, label: "пт" },
        { value: 6, label: "сб" },
        { value: 0, label: "вс" },
    ];

    useEffect(() => {
        setSelectedMonth(month)
        setSelectedYear(year)
    },[month, year])

    useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (!showList.months && !showList.years) return;

        const clickedOutsideMonths = monthsRef.current && !monthsRef.current.contains(e.target as Node);
        const clickedOutsideYears = yearsRef.current && !yearsRef.current.contains(e.target as Node);

        if (clickedOutsideMonths && clickedOutsideYears) {
        setShowList({ months: false, years: false });
        }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
    }, [showList]);

    useEffect(() => {
        if (!habits || !habit) return
        const yearsSet = new Set<number>()
        if (id && habit) {
            for (let y = 0; y <= today.getFullYear() - new Date(habit.start_date).getFullYear(); y++) {
                yearsSet.add(today.getFullYear() - y)
            }
        } else {
            habits.forEach(h => {
                const sd = new Date(h.start_date).getFullYear()
                yearsSet.add(sd)
                if (h.end_date ) {
                    const ed = new Date(h.end_date).getFullYear()
                    yearsSet.add(ed)
                }
                for (let y = 0; y <= today.getFullYear() - new Date(habit.start_date).getFullYear(); y++) {
                    yearsSet.add(today.getFullYear() - y)
                }
            })
        }

        const yearsArray = Array.from(yearsSet).sort((a, b) => a - b);
        setYears(yearsArray)
    },[habits])

    useEffect(() => {
        if (!selectedMonth || !selectedYear) return
        const endDate = new Date(selectedYear, selectedMonth+1, 0).getDate()
        const preMonth = Array.from({ length: endDate }, (_, i) => 1 + i);
        setThisMonth(preMonth)
        const startDay = new Date(selectedYear, selectedMonth, 1).getDay()
        const prevMonth:number[] = []
        if ( startDay === 0) {
            for (let i = -5; i <= 0 ; i++) {
                prevMonth.push(new Date(selectedYear, selectedMonth, i).getDate())
            }
        } else {
            for (let i = 2 - startDay; i <= 0; i++) {
                prevMonth.push(new Date(selectedYear, selectedMonth, i).getDate())
            }
        }
        setPrevMonth(prevMonth)

        const endDay = new Date(selectedYear, selectedMonth+1, 0).getDay()
        const postMonth:number[] = []
        if (endDay !== 0) {
            for (let i = 1; i <= 7-endDay; i++) {
                postMonth.push(new Date(selectedYear, selectedMonth+1, i).getDate())
            }
        }
        setPostMonth(postMonth)
    }, [selectedMonth, selectedYear])

    const renderCells = (days: number[], type: "prev" | "this" | "post") => {
        return days.map((day, idx) => {
            let cellMonth = selectedMonth;
            let cellYear = selectedYear;

            if (type === "prev") {
                cellMonth = selectedMonth - 1;
                if (cellMonth < 0) {
                    cellMonth = 11;
                    cellYear = selectedYear - 1;
                }
            } else if (type === "post") {
                cellMonth = selectedMonth + 1;
                if (cellMonth > 11) {
                    cellMonth = 0;
                    cellYear = selectedYear + 1;
                }
            }
            return (
                <DayCell
                    // calendar={calendar}
                    habit={habit}
                    habits={habits}
                    key={idx}
                    day={day}
                    month={cellMonth}
                    year={cellYear}
                    type={type}
                />
            );
        });
    };

    return (
        <div className="calendarDiv">
            <div className="calendarMain" ref={calendarRef}>
                <div className="DateChanger">
                    <div className="CalendarDateChanger" ref={monthsRef}>
                        <div className="selectedDate" onClick={() => setShowList({months:!showList.months, years:false})}>
                            {months[selectedMonth]}
                            <ChevronDown style={{ transform: `rotate(${showList.months ? "180deg" : "0deg"})`, transition: "transform 0.2s" }}/>
                        </div>
                        <div className={`monthsList ${showList.months ? "active" : ""}`} >
                            {months.map((month, idx) => (
                                <div className={`monthListElem ${idx === selectedMonth ? "active" : ""}`} key={idx} onClick={() => setSelectedMonth(idx)}>{month.slice(0,3)}.</div>
                            ))}
                        </div>
                    </div>
                    <div className="CalendarDateChanger" ref={yearsRef}>
                        <div className="selectedDate" onClick={() => setShowList({months:false, years:!showList.years})}>
                            {selectedYear}
                            <ChevronDown style={{ transform: `rotate(${showList.years ? "180deg" : "0deg"})`, transition: "transform 0.2s" }}/>
                        </div>
                        <div className={`yearsList ${showList.years ? "active" : ""}`} >
                            {years?.map((year, idx) => (
                                <div className={`yearListElem ${year === selectedYear ? "active" : ""}`} key={idx} onClick={() => setSelectedYear(year)}>{year}</div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="calendarDates">
                    <div className="weekPattern">
                        {dayWeek.map((day, idx) => (
                            <div className="weekDays" key={idx}>{day.label}</div>
                        ))}
                    </div>
                    <div className="calendarDays">
                    {renderCells(prevMonth, "prev")}
                    {renderCells(thisMonth, "this")}
                    {renderCells(postMonth, "post")}
                    </div>
                </div>
            </div>
            
            {id && habit ? <Streak habit={habit} calendar={calendar}/> : ""}
            <ChosenDay/>

            {id && habits?.find(h => h.id === Number(id)) && (
                <DoneButton isDone={isDone} habitId={Number(habit?.id)} markDone={markDone} />
            )}
            {id && isDone && (
                <DayComment
                    id={id}
                    dayComment={dayComment}
                />
            )}

        </div>
    )
}