import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import "../../scss/calendar.scss";
import { ChevronDown } from "lucide-react";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import type { Calendar } from "../../../../components/context/CalendarContext";
import DayCell from "./DayCell";
import { useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { todayStrFunc } from "../../utils/dateToStr";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const DAY_WEEK = [
    { value: 1, label: "пн" },
    { value: 2, label: "вт" },
    { value: 3, label: "ср" },
    { value: 4, label: "чт" },
    { value: 5, label: "пт" },
    { value: 6, label: "сб" },
    { value: 0, label: "вс" },
];

export default function Calendar() {
    const { calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, setChosenDay } = useCalendar();
    const { habit: h } = useTheHabit();
    const { habits } = useHabits();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [showList, setShowList] = useState({ months: false, years: false });
    const monthsRef = useRef<HTMLDivElement>(null);
    const yearsRef = useRef<HTMLDivElement>(null);

    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    // === Вычисление доступных годов ===
    const years = useMemo(() => {
        if (!habits) return [];
        const yearsSet = new Set<number>();
        const now = new Date();

        if (id && h) {
            const startYear = new Date(h.start_date).getFullYear();
            for (let y = startYear; y <= now.getFullYear(); y++) yearsSet.add(y);
        } else {
            habits.forEach((habit) => {
                const sd = new Date(habit.start_date).getFullYear();
                yearsSet.add(sd);
                if (habit.end_date) yearsSet.add(new Date(habit.end_date).getFullYear());
                for (let y = sd; y <= now.getFullYear(); y++) yearsSet.add(y);
            });
        }
        return Array.from(yearsSet).sort((a, b) => a - b);
    }, [habits, h, id]);

    const { thisMonth, prevMonth, postMonth } = useMemo(() => {
        if (selectedMonth === null || selectedYear === null) {
            return { thisMonth: [], prevMonth: [], postMonth: [] };
        }

        const endDate = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const thisMonthArr = Array.from({ length: endDate }, (_, i) => 1 + i);

        const startDay = new Date(selectedYear, selectedMonth, 1).getDay();
        const prevMonthArr: number[] = [];
        const startOffset = startDay === 0 ? -5 : 2 - startDay;
        for (let i = startOffset; i <= 0; i++) {
            prevMonthArr.push(new Date(selectedYear, selectedMonth, i).getDate());
        }

        const endDay = new Date(selectedYear, selectedMonth + 1, 0).getDay();
        const postMonthArr: number[] = [];
        if (endDay !== 0) {
            for (let i = 1; i <= 7 - endDay; i++) {
                postMonthArr.push(new Date(selectedYear, selectedMonth + 1, i).getDate());
            }
        }

        return { thisMonth: thisMonthArr, prevMonth: prevMonthArr, postMonth: postMonthArr };
    }, [selectedMonth, selectedYear]);

    // === Эффекты ===
    useEffect(() => {
        if (id && h) {
            setChosenDay(todayStrFunc());
        }
    }, [id, h, setChosenDay]);

    useEffect(() => {
        setSelectedMonth(month);
        setSelectedYear(year);
    }, [month, year, setSelectedMonth, setSelectedYear]);

    // === Обработчик клика вне списка (с useCallback для ESLint) ===
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (!showList.months && !showList.years) return;

        const outsideMonths = monthsRef.current && !monthsRef.current.contains(e.target as Node);
        const outsideYears = yearsRef.current && !yearsRef.current.contains(e.target as Node);

        if (outsideMonths && outsideYears) {
            setShowList({ months: false, years: false });
        }
    }, [showList]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    // === Рендер ячеек ===
    const renderCells = (days: number[], type: "prev" | "this" | "post") => {
        return days.map((day) => {
        let cellMonth = selectedMonth;
        let cellYear = selectedYear;

        if (type === "prev") {
            cellMonth = selectedMonth - 1;
            if (cellMonth < 0) {
                cellMonth = 11;
                cellYear--;
            }
        } else if (type === "post") {
            cellMonth = selectedMonth + 1;
            if (cellMonth > 11) {
                cellMonth = 0;
                cellYear++;
            }
        }

        return (
            <DayCell
                key={`${type}-${day}-${cellMonth}-${cellYear}`}
                habit={h}
                habits={habits}
                day={day}
                month={cellMonth}
                year={cellYear}
                type={type}
            />
        );
        });
    };

    return (
        <div className={`calendarDiv ${isMobile ? "mobile" : ""}`}>
            <div className="calendarMain" ref={calendarRef}>
                <div className="DateChanger">
                    {/* Кнопка "назад" */}
                    <div
                        className="setMonthButt left"
                        onClick={() => {
                        if (selectedMonth === 0) {
                            setSelectedMonth(11);
                            setSelectedYear((prev) => prev - 1);
                        } else {
                            setSelectedMonth((prev) => prev - 1);
                        }
                        }}
                    >
                        <CaretLeft />
                    </div>

                    {/* Выбор месяца */}
                    <div className="CalendarDateChanger" ref={monthsRef}>
                        <div
                            className="selectedDate fixedWidth"
                            onClick={() => setShowList({ months: !showList.months, years: false })}
                        >
                            {MONTHS[selectedMonth]}
                            <ChevronDown
                                style={{
                                transform: `rotate(${showList.months ? "180deg" : "0deg"})`,
                                transition: "transform 0.2s",
                                }}
                            />
                        </div>
                        <div className={`monthsList ${showList.months ? "active" : ""}`}>
                            {MONTHS.map((monthName: string, idx: number) => (
                                <div
                                className={`monthListElem ${idx === selectedMonth ? "active" : ""}`}
                                key={idx}
                                onClick={() => setSelectedMonth(idx)}
                                >
                                {monthName.slice(0, 3)}.
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Выбор года */}
                    <div className="CalendarDateChanger" ref={yearsRef}>
                        <div className="selectedDate" onClick={() => setShowList({ months: false, years: !showList.years })}>
                            {selectedYear}
                            <ChevronDown
                                style={{
                                transform: `rotate(${showList.years ? "180deg" : "0deg"})`,
                                transition: "transform 0.2s",
                                }}
                            />
                        </div>
                        <div className={`yearsList ${showList.years ? "active" : ""}`}>
                        {years?.map((yearNum: number, idx: number) => (
                            <div
                            className={`yearListElem ${yearNum === selectedYear ? "active" : ""}`}
                            key={idx}
                            onClick={() => setSelectedYear(yearNum)}
                            >
                                {yearNum}
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Кнопка "вперёд" */}
                    <div className="setMonthButt right"
                        onClick={() => {
                        if (selectedMonth === 11) {
                            setSelectedMonth(0);
                            setSelectedYear((prev) => prev + 1);
                        } else {
                            setSelectedMonth((prev) => prev + 1);
                        }
                        }}
                    >
                        <CaretRight />
                    </div>
                </div>
                <div className="calendarDates">
                    <div className="weekPattern">
                        {DAY_WEEK.map((day) => (
                        <div className="weekDays" key={day.value}>
                            {day.label}
                        </div>
                        ))}
                    </div>
                    <div className="calendarDays">
                        {renderCells(prevMonth, "prev")}
                        {renderCells(thisMonth, "this")}
                        {renderCells(postMonth, "post")}
                    </div>
                </div>
            </div>
        </div>
    );
}