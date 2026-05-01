import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import "../../scss/calendar.scss";
import { ChevronDown } from "lucide-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import DayCell from "./DayCell";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const DAY_WEEK = [
    { value: 1, label: "пн" }, { value: 2, label: "вт" }, { value: 3, label: "ср" },
    { value: 4, label: "чт" }, { value: 5, label: "пт" }, { value: 6, label: "сб" }, { value: 0, label: "вс" }
];

type SlideData = {
    month: number;
    year: number;
    days: {
        prev: Array<{ day: number; month: number; year: number }>;
        this: Array<{ day: number; month: number; year: number }>;
        post: Array<{ day: number; month: number; year: number }>;
    };
};

const buildSlide = (monthNum: number, yearNum: number): SlideData => {
    const date = new Date(yearNum, monthNum, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();
    const prevDaysCount = firstDay === 0 ? 6 : firstDay - 1;
    const nextDaysCount = (7 - (new Date(yearNum, monthNum + 1, 0).getDay())) % 7;

    return {
        month: monthNum,
        year: yearNum,
        days: {
            prev: Array.from({ length: prevDaysCount }, (_, i) => {
                const d = new Date(yearNum, monthNum, -prevDaysCount + i + 1);
                return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
            }),
            this: Array.from({ length: daysInMonth }, (_, i) => ({
                day: i + 1, month: monthNum, year: yearNum
            })),
            post: Array.from({ length: nextDaysCount }, (_, i) => {
                const d = new Date(yearNum, monthNum + 1, i + 1);
                return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
            })
        }
    };
};

export default function Calendar() {
    const { calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useCalendar();
    const { habit: h } = useTheHabit();
    const { habits } = useHabits();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [showList, setShowList] = useState({ months: false, years: false });

    const monthsRef = useRef<HTMLDivElement>(null);
    const yearsRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const isNavigating = useRef(false);
    const scrollEndTimer = useRef<number | null>(null);

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

    useEffect(() => {
        const today = new Date();
        setSelectedMonth(today.getMonth());
        setSelectedYear(today.getFullYear());
    }, [setSelectedMonth, setSelectedYear]);

    const goToPrevMonth = useCallback(() => {
        if (isNavigating.current) return;
        isNavigating.current = true;

        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(y => y - 1);
        } else {
            setSelectedMonth(m => m - 1);
        }
    }, [selectedMonth, setSelectedMonth, setSelectedYear]);
    console.log(selectedMonth)
    const goToNextMonth = useCallback(() => {
        if (isNavigating.current) return;
        isNavigating.current = true;

        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(y => y + 1);
        } else {
            setSelectedMonth(m => m + 1);
        }
    }, [selectedMonth, setSelectedMonth, setSelectedYear]);

    const handleScroll = useCallback(() => {
        if (!sliderRef.current || isNavigating.current) return;

        const slider = sliderRef.current;
        const width = slider.offsetWidth;
        const scrollLeft = slider.scrollLeft;
        const center = width;

        if (scrollEndTimer.current) {
            clearTimeout(scrollEndTimer.current);
        }

        if (scrollLeft < width * 0.5) {
            goToPrevMonth();
            return;
        }
        if (scrollLeft > width * 1.5) {
            goToNextMonth();
            return;
        }

        scrollEndTimer.current = setTimeout(() => {
            if (!sliderRef.current || isNavigating.current) return;
            
            const current = sliderRef.current.scrollLeft;
            if (Math.abs(current - center) > 10) {
                sliderRef.current.removeEventListener('scroll', handleScroll);
                isNavigating.current = true;
                
                sliderRef.current.scrollTo({
                    left: center,
                    behavior: "smooth"
                });
                
                setTimeout(() => {
                    isNavigating.current = false;
                    sliderRef.current?.addEventListener('scroll', handleScroll, { passive: true });
                }, 300);
            }
        }, 150);
    }, [goToPrevMonth, goToNextMonth]);

    useEffect(() => {
        if (!sliderRef.current) return;

        const slider = sliderRef.current;
        
        slider.removeEventListener('scroll', handleScroll);
        isNavigating.current = true;

        slider.scrollTo({
            left: slider.offsetWidth,
            behavior: "auto"
        });

        requestAnimationFrame(() => {
            isNavigating.current = false;
            slider.addEventListener('scroll', handleScroll, { passive: true });
        });

    }, [selectedMonth, selectedYear, handleScroll]);

    useEffect(() => {
        return () => {
            if (scrollEndTimer.current) {
                clearTimeout(scrollEndTimer.current);
            }
        };
    }, []);

    const renderSlide = (slide: SlideData | null, key: string) => {
        if (!slide) return null;
        const allDays = [...slide.days.prev, ...slide.days.this, ...slide.days.post];

        return (
            <div key={key} className="calendarSlide">
                <div className="calendarDays">
                    {allDays.map((cell, idx) => {
                        let type: "prev" | "this" | "post" = "this";
                        if (idx < slide.days.prev.length) type = "prev";
                        else if (idx >= slide.days.prev.length + slide.days.this.length) type = "post";

                        return (
                            <DayCell
                                key={`${cell.year}-${cell.month}-${cell.day}`}
                                habit={h}
                                habits={habits}
                                day={cell.day}
                                month={cell.month}
                                year={cell.year}
                                type={type}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

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
                        {renderSlide(slidesData.prev, "prev")}
                        {renderSlide(slidesData.current, "current")}
                        {renderSlide(slidesData.next, "next")}
                    </div>
                </div>
            </div>
        </div>
    );
}