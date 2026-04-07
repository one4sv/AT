import type { Habit } from "../context/HabitsContext";
import type { habitTimer } from "../context/TheHabitContext"; // ← добавили импорт типа
import { useNavigate } from "react-router";
import { CheckCircle, PushPinIcon } from "@phosphor-icons/react";
import { habitIcon } from "./habitIcon";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { formatHabitTime, formatScheduleTime } from "./utils/formatHabitTime";
import { useSchedule } from "../hooks/ScheduleHook";
import { isOddWeek } from "../../pages/HabitPage/utils/isOddWeek";
import { useSettings } from "../hooks/SettingsHook";
import { isMobile } from "react-device-detect";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useTheHabit } from "../hooks/TheHabitHook";
import { calculateTimerElapsed } from "./utils/TimerFuncs";
import { useState, useEffect, useCallback, useRef } from "react";

export default function HabitDiv({
    habit,
    id,
    isMyAcc,
    is_archived
}: {
    habit: Habit;
    id?: number;
    isMyAcc?: boolean;
    is_archived?: boolean;
}) {
    const { openMenu } = useContextMenu();
    const { setShowSideMenu } = useSideMenu();
    const { findHabit } = useTheHabit();
    const navigate = useNavigate();
    const { schedules } = useSchedule();
    const { weekStart } = useSettings();

    const [timerStatus, setTimerStatus] = useState<string>("");
    const [timerLoading, setTimerLoading] = useState<boolean>(false);
    const [currentTimer, setCurrentTimer] = useState<habitTimer | null>(null);

    const hasLoadedRef = useRef(false);

    const updateTimerDisplay = useCallback((timer: habitTimer) => {
        const elapsed = calculateTimerElapsed(timer, false).slice(0, 5)
        if (timer.status === "running") {
            setTimerStatus(`Выполняется: ${elapsed}`);
        } else if (timer.status === "paused") {
            setTimerStatus(`На паузе: ${elapsed}`);
        } else {
            setTimerStatus("");
        }
    }, []);

    const loadTimerStatus = useCallback(async () => {
        if (!habit.id || hasLoadedRef.current) return;

        try {
            setTimerLoading(true);
            const res = await findHabit(String(habit.id));

            if (!res?.success || !res.timer) {
                setTimerStatus("");
                setCurrentTimer(null);
                return;
            }

            const { timer, settings } = res;

            if (settings?.metric_type === "timer" && timer) {
                setCurrentTimer(timer);
                updateTimerDisplay(timer);
            } else {
                setTimerStatus("");
                setCurrentTimer(null);
            }
        } catch (e) {
            console.error("Ошибка загрузки таймера в HabitDiv:", e);
            setTimerStatus("");
            setCurrentTimer(null);
        } finally {
            setTimerLoading(false);
            hasLoadedRef.current = true;
        }
    }, [habit.id, findHabit, updateTimerDisplay]);

    const refreshTimer = useCallback(async () => {
        if (!habit.id || !currentTimer) return;

        try {
            const res = await findHabit(String(habit.id));
            if (res?.success && res.timer) {
                setCurrentTimer(res.timer);
                updateTimerDisplay(res.timer);
            }
        } catch (e) {
            console.error(e);
        }
    }, [habit.id, currentTimer, findHabit, updateTimerDisplay]);

    useEffect(() => {
        loadTimerStatus();
    }, [loadTimerStatus]);

    useEffect(() => {
        if (!currentTimer) return;

        const interval = setInterval(refreshTimer, 1000);
        return () => clearInterval(interval);
    }, [currentTimer, refreshTimer]);

    const ruPeriodicity = (habit: Habit): string => {
        if (habit.is_archived) return "в архиве"
        const { periodicity: per, chosen_days } = habit
        const habitIdKey = String(habit.id)
        const habitBlocks = schedules[habitIdKey] || []

        const todayNum = new Date().getDay()
        let targetDayNum = todayNum
        let dayLabel = "Сегодня"
        let nearestDiff = 7

        if (per === "weekly" && chosen_days?.length) {
            for (const day of chosen_days) {
                const diff = (day - todayNum + 7) % 7
                if (diff < nearestDiff) nearestDiff = diff
            }

            targetDayNum = (todayNum + nearestDiff) % 7

            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + nearestDiff)

            const targetIsOdd = isOddWeek(weekStart, targetDate)
            const isInDateRange = habit.end_date ? new Date(habit.end_date) > new Date() : true

            if (nearestDiff === 0 && isInDateRange) dayLabel = "Сегодня"
            else if (nearestDiff === 1 && isInDateRange) dayLabel = "Завтра"
            else if (isInDateRange) {
                dayLabel = targetDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
            } else {
                dayLabel = ""
            }

            const targetBlocks = habitBlocks.filter(block =>
                !block.isSeparator &&
                block.day_of_week === targetDayNum &&
                block.start_time?.trim() &&
                (block.isSeparator === !targetIsOdd)
            )

            let timePart = ""

            if (targetBlocks.length > 0) {
                const timeToMinutes = (t: string) => {
                    if (!t.trim()) return 9999
                    const cleaned = t.trim().replace(".", ":")
                    const [h = "0", m = "0"] = cleaned.split(":")
                    return Number(h) * 60 + Number(m)
                }

                let minMin = 24 * 60
                let maxMin = 0

                targetBlocks.forEach(b => {
                    const s = timeToMinutes(b.start_time!)
                    const e = b.end_time ? timeToMinutes(b.end_time) : 24 * 60
                    if (s < minMin) minMin = s
                    if (e > maxMin) maxMin = e
                })

                const earliest = formatScheduleTime(minMin)
                const latest = formatScheduleTime(maxMin)

                if (earliest && latest && earliest !== latest) {
                    timePart = ` с ${earliest} до ${latest}`
                } else if (earliest) {
                    timePart = ` в ${earliest}`
                } else if (latest) {
                    timePart = ` до ${latest}`
                }
            }

            if (!timePart) timePart = formatHabitTime(habit)

            return `${dayLabel}${timePart}`.trim()
        }

        const timePart = formatHabitTime(habit)

        if (per === "everyday") return `Каждый день${timePart}`
        if (per === "sometimes") return `Иногда${timePart}`

        return timePart.trim() || ""
    }

    if (isMyAcc === undefined) isMyAcc = true
    const periodicityText = ruPeriodicity(habit)

    return (
        <div
            className={`habit themeHabit-default ${id === habit.id && !isMobile ? "active" : ""}`}
            onClick={() => {
                navigate(`/habit/${habit.id}`)
                setShowSideMenu(false)
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                openMenu(
                    e.clientX,
                    e.clientY,
                    "habit",
                    { id: String(habit.id), name: habit.name, isMy: isMyAcc },
                    habit
                )
            }}
        >
            {habit.tag && <div className="habitIcon">{habitIcon(habit)}</div>}

            <div className="habitInfo">
                <div className="habitName">{habit.name}</div>
                <div className="habitPer">
                    {!is_archived && (
                        timerLoading 
                            ? "Загрузка..." 
                            : timerStatus || periodicityText
                    )}
                    {habit.done && <CheckCircle className="habitHLStatus" weight="fill" />}
                </div>
                {habit.pinned && isMyAcc && (
                    <PushPinIcon className="pinnedHabitSign" weight="fill" />
                )}
            </div>
        </div>
    )
}