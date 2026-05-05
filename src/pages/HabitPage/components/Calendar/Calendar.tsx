import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { todayStrFunc } from "../../utils/dateToStr";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const DAY_WEEK = [
    { value: 1, label: "пн" }, { value: 2, label: "вт" }, { value: 3, label: "ср" },
    { value: 4, label: "чт" }, { value: 5, label: "пт" }, { value: 6, label: "сб" }, { value: 0, label: "вс" }
];

export default function Calendar() {
    const { calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, chosenDay } = useCalendar();
    const { habit: h } = useTheHabit();
    const { habits } = useHabits();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [showList, setShowList] = useState({ months: false, years: false });

    const monthsRef = useRef<HTMLDivElement>(null);
    const yearsRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const isAnimatingRef = useRef(false);

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
    useEffect(() => {
        if (chosenDay === todayStrFunc()) {
            const date = new Date(chosenDay)
            setSelectedMonth(date.getMonth())
            setSelectedYear(date.getFullYear())
        }
    }, [chosenDay, setSelectedMonth, setSelectedYear])
    const slidesData = useMemo(() => {
        if (selectedMonth === null || selectedYear === null) return null;

        return {
            prev: buildSlide(
                selectedMonth === 0 ? 11 : selectedMonth - 1,
                selectedMonth === 0 ? selectedYear - 1 : selectedYear
            ),
            current: buildSlide(selectedMonth, selectedYear),
            next: buildSlide(
                selectedMonth === 11 ? 0 : selectedMonth + 1,
                selectedMonth === 11 ? selectedYear + 1 : selectedYear
            )
        };
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;

            const clickedOutsideMonths =
                monthsRef.current && !monthsRef.current.contains(target);

            const clickedOutsideYears =
                yearsRef.current && !yearsRef.current.contains(target);

            if (showList.months && clickedOutsideMonths) {
                setShowList(prev => ({ ...prev, months: false }));
            }

            if (showList.years && clickedOutsideYears) {
                setShowList(prev => ({ ...prev, years: false }));
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showList.months, showList.years]);

    useEffect(() => {
        const el = sliderRef.current;
        if (!el) return;

        requestAnimationFrame(() => {
            el.scrollTo({ left: el.clientWidth, behavior: "auto" });
        });
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        const today = new Date();
        setSelectedMonth(today.getMonth());
        setSelectedYear(today.getFullYear());
    }, [setSelectedMonth, setSelectedYear]);

    const slideTo = (direction: "prev" | "next") => {
        const el = sliderRef.current;
        if (!el) return;

        const width = el.clientWidth;

        el.scrollTo({
            left: direction === "next" ? width * 2 : 0,
            behavior: "smooth"
        });
    };

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

    useEffect(() => {
        const el = sliderRef.current;
        if (!el) return;

        let timeout: number;

        const handleScroll = () => {
            if (isAnimatingRef.current) return;

            clearTimeout(timeout);

            timeout = window.setTimeout(() => {
                const width = el.clientWidth;
                const index = Math.round(el.scrollLeft / width);

                if (index === 0) {
                    isAnimatingRef.current = true;
                    goToPrevMonth();
                }

                if (index === 2) {
                    isAnimatingRef.current = true;
                    goToNextMonth();
                }
            }, 80);
        };

        el.addEventListener("scroll", handleScroll);

        return () => {
            el.removeEventListener("scroll", handleScroll);
        };
    }, [goToPrevMonth, goToNextMonth]);

    // сбрасываем флаг после смены
    useEffect(() => {
        isAnimatingRef.current = false;
    }, [selectedMonth, selectedYear]);

    if (!slidesData) return null;

    return (
        <div className={`calendarDiv ${isMobile ? "mobile" : ""}`}>
            <div className="calendarMain" ref={calendarRef}>

                <div className="DateChanger">
                    <div className="setMonthButt left" onClick={() => slideTo('prev')}>
                        <CaretLeft />
                    </div>

                    <div className="CalendarDateChanger" ref={monthsRef}>
                        <div
                            className="selectedDate"
                            onClick={() => setShowList({ months: !showList.months, years: false })}
                        >
                            {MONTHS[selectedMonth]}
                            <ChevronDown style={{
                                transform: `rotate(${showList.months ? "180deg" : "0deg"})`,
                                transition: "transform 0.2s"
                            }} />
                        </div>

                        <div className={`monthsList ${showList.months ? "active" : ""}`}>
                            {MONTHS.map((monthName, idx) => (
                                <div
                                    key={idx}
                                    className={`monthListElem ${idx === selectedMonth ? "active" : ""}`}
                                    onClick={() => setSelectedMonth(idx)}
                                >
                                    {monthName.slice(0, 3)}.
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="CalendarDateChanger" ref={yearsRef}>
                        <div
                            className="selectedDate"
                            onClick={() => setShowList({ months: false, years: !showList.years })}
                        >
                            {selectedYear}
                            <ChevronDown style={{
                                transform: `rotate(${showList.years ? "180deg" : "0deg"})`,
                                transition: "transform 0.2s"
                            }} />
                        </div>

                        <div className={`yearsList ${showList.years ? "active" : ""}`}>
                            {yearsList.map((yearNum) => (
                                <div
                                    key={yearNum}
                                    className={`yearListElem ${yearNum === selectedYear ? "active" : ""}`}
                                    onClick={() => setSelectedYear(yearNum)}
                                >
                                    {yearNum}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="setMonthButt right" onClick={() => slideTo('next')}>
                        <CaretRight />
                    </div>
                </div>

                <div className="weekPattern">
                    {DAY_WEEK.map((day) => (
                        <div className="weekDays" key={day.value}>{day.label}</div>
                    ))}
                </div>

                <div ref={sliderRef} className="calendarSlider">
                    <div className="calendarSlidesWrapper">
                        <CalendarSlide slide={slidesData.prev} />
                        <CalendarSlide slide={slidesData.current} />
                        <CalendarSlide slide={slidesData.next} />
                    </div>
                </div>

            </div>
        </div>
    );
}