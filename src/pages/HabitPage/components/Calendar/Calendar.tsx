import { useCallback, useEffect, useMemo, useRef, useState} from "react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import "../../scss/calendar.scss";
import { ChevronDown } from "lucide-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { buildSlide } from "../../utils/buildSlide";
import { CalendarSlide } from "./CalendarSlide";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const DAY_WEEK = [
    { value: 1, label: "пн" }, { value: 2, label: "вт" }, { value: 3, label: "ср" },
    { value: 4, label: "чт" }, { value: 5, label: "пт" }, { value: 6, label: "сб" }, { value: 0, label: "вс" }
];

export default function Calendar() {
    const { calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useCalendar();
    const { habit: h } = useTheHabit();
    const { habits } = useHabits();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [showList, setShowList] = useState({ months: false, years: false });

    const isNavigating = useRef(false);
    const monthsRef = useRef<HTMLDivElement>(null);
    const yearsRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const yearsList = useMemo(() => {
        if (!habits) return [];
        const set = new Set<number>();
        const now = new Date();
        if (id && h) {
            const start = new Date(h.start_date).getFullYear();
            for (let y = start; y <= now.getFullYear(); y++) set.add(y);
        } else {
            habits.forEach(habit => {
                const sd = new Date(habit.start_date).getFullYear();
                set.add(sd);
                if (habit.end_date) set.add(new Date(habit.end_date).getFullYear());
                for (let y = sd; y <= now.getFullYear(); y++) set.add(y);
            });
        }
        return Array.from(set).sort((a, b) => a - b);
    }, [habits, h, id]);

    const slidesData = useMemo(() => {
        if (selectedMonth === null || selectedYear === null) return null;
        return {
            prev: buildSlide(selectedMonth === 0 ? 11 : selectedMonth - 1, selectedMonth === 0 ? selectedYear - 1 : selectedYear),
            current: buildSlide(selectedMonth, selectedYear),
            next: buildSlide(selectedMonth === 11 ? 0 : selectedMonth + 1, selectedMonth === 11 ? selectedYear + 1 : selectedYear)
        };
    }, [selectedMonth, selectedYear]);

    console.log(selectedMonth, isNavigating.current)

    useEffect(() => {
        if (!sliderRef.current) return;

        sliderRef.current.scrollLeft = sliderRef.current.clientWidth;
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        const today = new Date();
        setSelectedMonth(today.getMonth());
        setSelectedYear(today.getFullYear());
    }, [setSelectedMonth, setSelectedYear]);

    const goToPrevMonth = useCallback(() => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(y => y - 1);
        } else {
            setSelectedMonth(m => m - 1);
        }
    }, [selectedMonth, setSelectedMonth, setSelectedYear]);
    
    const goToNextMonth = useCallback(() => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(y => y + 1);
        } else {
            setSelectedMonth(m => m + 1);
        }
    }, [selectedMonth, setSelectedMonth, setSelectedYear]);

    if (!slidesData) return null;

    return (
        <div className={`calendarDiv ${isMobile ? "mobile" : ""}`}>
            <div className="calendarMain" ref={calendarRef}>
                <div className="DateChanger">
                    <div className="setMonthButt left" onClick={goToPrevMonth}><CaretLeft /></div>
                    <div className="CalendarDateChanger" ref={monthsRef}>
                        <div className="selectedDate fixedWidth" 
                             onClick={() => setShowList({ months: !showList.months, years: false })}>
                            {MONTHS[selectedMonth]}
                            <ChevronDown style={{ transform: `rotate(${showList.months ? "180deg" : "0deg"})`, transition: "transform 0.2s" }} />
                        </div>
                        <div className={`monthsList ${showList.months ? "active" : ""}`}>
                            {MONTHS.map((monthName, idx) => (
                                <div key={idx} className={`monthListElem ${idx === selectedMonth ? "active" : ""}`} 
                                     onClick={() => setSelectedMonth(idx)}>
                                    {monthName.slice(0, 3)}.
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="CalendarDateChanger" ref={yearsRef}>
                        <div className="selectedDate" 
                             onClick={() => setShowList({ months: false, years: !showList.years })}>
                            {selectedYear}
                            <ChevronDown style={{ transform: `rotate(${showList.years ? "180deg" : "0deg"})`, transition: "transform 0.2s" }} />
                        </div>
                        <div className={`yearsList ${showList.years ? "active" : ""}`}>
                            {yearsList.map((yearNum) => (
                                <div key={yearNum} className={`yearListElem ${yearNum === selectedYear ? "active" : ""}`} 
                                     onClick={() => setSelectedYear(yearNum)}>
                                    {yearNum}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="setMonthButt right" onClick={goToNextMonth}><CaretRight /></div>
                </div>

                <div className="weekPattern">
                    {DAY_WEEK.map((day) => (
                        <div className="weekDays" key={day.value}>{day.label}</div>
                    ))}
                </div>

                <div ref={sliderRef} className="calendarSlider">
                    <div className="calendarSlidesWrapper">
                        <CalendarSlide slide={slidesData.prev} key={"prev"}/>
                        <CalendarSlide slide={slidesData.current} key={"current"}/>
                        <CalendarSlide slide={slidesData.next} key={"next"}/>
                    </div>
                </div>
            </div>
        </div>
    );
}