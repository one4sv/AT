import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import "../../scss/calendar.scss";
import { ChevronDown } from "lucide-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { buildSlide } from "../../utils/buildSlide";
import { CalendarSlide } from "./CalendarSlide";
import { todayStrFunc } from "../../../../components/ts/utils/dateToStr";

const DAY_WEEK = [1, 2, 3, 4, 5, 6, 0];

export default function Calendar() {
    const { i18n } = useTranslation("common");
    const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU";
    const months = useMemo(() => Array.from({ length: 12 }, (_, month) => {
        const name = new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, month, 1));
        return name[0].toUpperCase() + name.slice(1);
    }), [locale]);
    const monthShort = useMemo(() => Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2024, month, 1))
    ), [locale]);
    const { calendarRef, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, chosenDay } = useCalendar();
    const { habit: h } = useTheHabit();
    const { habits } = useHabits();
    const { plans } = usePlans();
    const { habitId: id } = useParams<{ habitId: string }>();

    const [showList, setShowList] = useState({ months: false, years: false });

    const monthsRef = useRef<HTMLDivElement>(null);
    const yearsRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const isAnimatingRef = useRef(false);

    const yearsList = useMemo(() => {
        const set = new Set<number>();
        const now = new Date(todayStrFunc() + "T12:00:00");
        if (!id) {
            for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 3; y++) set.add(y);
            plans.forEach(plan => set.add(Number(plan.plan_date.slice(0, 4))));
        }
        if (!habits) return Array.from(set).sort((a, b) => a - b);

        if (id && h) {
            const start = Number(h.start_date.slice(0, 4));
            for (let y = start; y <= now.getFullYear(); y++) set.add(y);
        } else {
            habits.forEach(habit => {
                const sd = Number(habit.start_date.slice(0, 4));
                set.add(sd);
                if (habit.end_date) set.add(Number(habit.end_date.slice(0, 4)));
                for (let y = sd; y <= now.getFullYear(); y++) set.add(y);
            });
        }

        return Array.from(set).sort((a, b) => a - b);
    }, [habits, h, id, plans]);

    useEffect(() => {
        if (chosenDay === todayStrFunc()) {
            const date = new Date(chosenDay + "T12:00:00");
            setSelectedMonth(date.getMonth());
            setSelectedYear(date.getFullYear());
        }
    }, [chosenDay, setSelectedMonth, setSelectedYear]);

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
        const today = new Date(todayStrFunc() + "T12:00:00");
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

    // Сбрасываем прокрутку до отрисовки нового месяца, без промежуточного кадра.
    useLayoutEffect(() => {
        const el = sliderRef.current;
        if (!el) return;

        isAnimatingRef.current = true;
        const previousSnap = el.style.scrollSnapType;
        const previousBehavior = el.style.scrollBehavior;
        el.style.scrollSnapType = "none";
        el.style.scrollBehavior = "auto";
        el.scrollLeft = el.clientWidth;
        let lastWidth = el.clientWidth;
        const resizeObserver = new ResizeObserver(() => {
            const width = el.clientWidth;
            if (!width || width === lastWidth) return;
            if (lastWidth && !isAnimatingRef.current) {
                el.scrollLeft = el.scrollLeft / lastWidth * width;
            }
            lastWidth = width;
        });
        resizeObserver.observe(el);

        const frame = requestAnimationFrame(() => {
            el.style.scrollSnapType = previousSnap;
            el.style.scrollBehavior = previousBehavior;
        });
        const release = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isAnimatingRef.current = false;
            });
        });

        return () => {
            cancelAnimationFrame(frame);
            cancelAnimationFrame(release);
            resizeObserver.disconnect();
            el.style.scrollSnapType = previousSnap;
            el.style.scrollBehavior = previousBehavior;
        };
    }, [selectedMonth, selectedYear]);

    // Обработка свайпа + кнопок
    useEffect(() => {
        const el = sliderRef.current;
        if (!el) return;

        let timeout: number;

        const handleScrollEnd = () => {
            if (isAnimatingRef.current) return;

            const width = el.clientWidth;
            if (width === 0) return;

            const index = Math.round(el.scrollLeft / width);

            if (index === 0) {
                isAnimatingRef.current = true;
                goToPrevMonth();
            } else if (index === 2) {
                isAnimatingRef.current = true;
                goToNextMonth();
            }
        };

        // fallback для браузеров без scrollend
        const handleScroll = () => {
            if (isAnimatingRef.current) return;
            clearTimeout(timeout);
            timeout = window.setTimeout(handleScrollEnd, 80);
        };

        el.addEventListener("scrollend", handleScrollEnd);
        el.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            clearTimeout(timeout);
            el.removeEventListener("scrollend", handleScrollEnd);
            el.removeEventListener("scroll", handleScroll);
        };
    }, [goToPrevMonth, goToNextMonth]);

    const slideTo = useCallback((direction: "prev" | "next") => {
        const el = sliderRef.current;
        if (!el || isAnimatingRef.current) return;

        const width = el.clientWidth;
        el.scrollTo({
            left: direction === "next" ? width * 2 : 0,
            behavior: "smooth"
        });
    }, []);

    if (!slidesData) return null;

    return (
        <div className={`calendarDiv ${isMobile ? "mobile" : ""}`}>
            <div className="calendarMain" ref={calendarRef}>
                <div className="DateChanger">
                    <div className="setMonthButt left" onClick={() => slideTo("prev")}>
                        <CaretLeft />
                    </div>

                    <div className="CalendarDateChanger" ref={monthsRef}>
                        <div
                            className="selectedDate"
                            onClick={() => setShowList({ months: !showList.months, years: false })}
                        >
                            {months[selectedMonth]}
                            <ChevronDown
                                style={{
                                    transform: `rotate(${showList.months ? "180deg" : "0deg"})`,
                                    transition: "transform 0.2s"
                                }}
                            />
                        </div>

                        <div className={`monthsList ${showList.months ? "active" : ""}`}>
                            {months.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`monthListElem ${idx === selectedMonth ? "active" : ""}`}
                                    onClick={() => setSelectedMonth(idx)}
                                >
                                    {monthShort[idx]}
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
                            <ChevronDown
                                style={{
                                    transform: `rotate(${showList.years ? "180deg" : "0deg"})`,
                                    transition: "transform 0.2s"
                                }}
                            />
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

                    <div className="setMonthButt right" onClick={() => slideTo("next")}>
                        <CaretRight />
                    </div>
                </div>

                <div className="weekPattern">
                    {DAY_WEEK.map((day, idx) => (
                        <div className="weekDays" key={day}>
                            {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 1 + idx)).replace(".", "")}
                        </div>
                    ))}
                </div>

                <div
                    ref={sliderRef}
                    className="calendarSlider"
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
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