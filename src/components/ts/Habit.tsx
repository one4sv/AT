import type { Habit } from "../context/HabitsContext";
import type { habitTimer } from "../context/TheHabitContext";
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
import { useWebSocket } from "../hooks/WebSocketHook";
import { Link } from "react-router-dom";

export default function HabitDiv({
    habit,
    id,
    isMyAcc,
}: {
    habit: Habit;
    id?: number;
    isMyAcc?: boolean;
}) {
    const { openMenu } = useContextMenu();
    const { setShowSideMenu } = useSideMenu();
    const { findHabit, parseTimer } = useTheHabit();
    const { schedules } = useSchedule();
    const { weekStart } = useSettings();
    const { ws } = useWebSocket();

    const [timerStatus, setTimerStatus] = useState<string>("");
    const [timerLoading, setTimerLoading] = useState<boolean>(true);

    const hasLoadedRef = useRef(false);
    const tickIntervalRef = useRef<number | null>(null);

    const updateTimerDisplay = useCallback((timer: habitTimer) => {
        const elapsed = calculateTimerElapsed(timer, false);
        if (timer.status === "running") {
            setTimerStatus(`Выполняется: ${elapsed}`);
        } else if (timer.status === "paused") {
            setTimerStatus(`На паузе: ${elapsed}`);
        } else {
            setTimerStatus("");
        }
    }, []);

    const startLocalTick = useCallback((timer: habitTimer) => {
        if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        if (timer.status !== "running") return;

        tickIntervalRef.current = setInterval(() => {
            updateTimerDisplay(timer);
        }, 1000);
    }, [updateTimerDisplay]);

    const loadInitialTimer = useCallback(async () => {
        if (!habit.id || hasLoadedRef.current) return;
        setTimerLoading(true);
        try {
            const res = await findHabit(String(habit.id));
            if (res?.success && res.timer && res.settings?.metric_type === "timer") {
                updateTimerDisplay(res.timer);
                startLocalTick(res.timer);
            } else {
                setTimerStatus("");
            }
        } catch (e) {
            console.error("Ошибка начальной загрузки таймера:", e);
        } finally {
            setTimerLoading(false);
            hasLoadedRef.current = true;
        }
    }, [habit.id, findHabit, updateTimerDisplay, startLocalTick]);

    useEffect(() => {
        if (!ws || !habit.id) return;

        const handleTimer = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "TIMER_UPDATE" && data.habitId === habit.id) {
                    const parsed = parseTimer(data.timer);
                    if (parsed) {
                        updateTimerDisplay(parsed);
                        startLocalTick(parsed);
                    }

                }
            } catch (e) {
                console.error("Ошибка TIMER_UPDATE:", e);
            }
        };

        ws.addEventListener("message", handleTimer);
        return () => ws.removeEventListener("message", handleTimer);
    }, [ws, habit.id, parseTimer, updateTimerDisplay, startLocalTick]);

    useEffect(() => {
        loadInitialTimer();
        return () => {
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        };
    }, [loadInitialTimer]);

    const ruPeriodicity = (habit: Habit): string => {
        if (!habit.ongoing) return "в архиве";
        const { periodicity: per, chosen_days } = habit;
        const habitIdKey = String(habit.id);
        const habitBlocks = schedules[habitIdKey] || [];

        const todayNum = new Date().getDay();
        let targetDayNum = todayNum;
        let dayLabel = "Сегодня";
        let nearestDiff = 7;

        if (per === "weekly" && chosen_days?.length) {
            for (const day of chosen_days) {
                const diff = (day - todayNum + 7) % 7;
                if (diff < nearestDiff) nearestDiff = diff;
            }

            targetDayNum = (todayNum + nearestDiff) % 7;

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + nearestDiff);

            const targetIsOdd = isOddWeek(weekStart, targetDate);
            const isInDateRange = habit.end_date ? new Date(habit.end_date) > new Date() : true;

            if (nearestDiff === 0 && isInDateRange) dayLabel = "Сегодня";
            else if (nearestDiff === 1 && isInDateRange) dayLabel = "Завтра";
            else if (isInDateRange) {
                dayLabel = targetDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
            } else {
                dayLabel = "";
            }

            const targetBlocks = habitBlocks.filter(block =>
                !block.isSeparator &&
                block.day_of_week === targetDayNum &&
                block.start_time?.trim() &&
                (block.isSeparator === !targetIsOdd)
            );

            let timePart = "";

            if (targetBlocks.length > 0) {
                const timeToMinutes = (t: string) => {
                    if (!t.trim()) return 9999;
                    const cleaned = t.trim().replace(".", ":");
                    const [h = "0", m = "0"] = cleaned.split(":");
                    return Number(h) * 60 + Number(m);
                };

                let minMin = 24 * 60;
                let maxMin = 0;

                targetBlocks.forEach(b => {
                    const s = timeToMinutes(b.start_time!);
                    const e = b.end_time ? timeToMinutes(b.end_time) : 24 * 60;
                    if (s < minMin) minMin = s;
                    if (e > maxMin) maxMin = e;
                });

                const earliest = formatScheduleTime(minMin);
                const latest = formatScheduleTime(maxMin);

                if (earliest && latest && earliest !== latest) {
                    timePart = ` с ${earliest} до ${latest}`;
                } else if (earliest) {
                    timePart = ` в ${earliest}`;
                } else if (latest) {
                    timePart = ` до ${latest}`;
                }
            }

            if (!timePart) timePart = formatHabitTime(habit);

            return `${dayLabel}${timePart}`.trim();
        }

        const timePart = formatHabitTime(habit);

        if (per === "everyday") return `Каждый день${timePart}`;
        if (per === "sometimes") return `Иногда${timePart}`;

        return timePart.trim() || "";
    };

    if (isMyAcc === undefined) isMyAcc = true;
    const periodicityText = ruPeriodicity(habit);

    return (
        <Link
            className={`habit themeHabit-default ${id === habit.id && !isMobile ? "active" : ""}`}
            onClick={() => {
                setShowSideMenu(false);
            }}
            to={`/habit/${habit.id}`}
            onContextMenu={(e) => {
                e.preventDefault();
                openMenu(
                    e.clientX,
                    e.clientY,
                    "habit",
                    { id: String(habit.id), name: habit.name, isMy: isMyAcc },
                    habit
                );
            }}
        >
            {habit.tag && <div className="habitIcon">{habitIcon(habit)}</div>}

            <div className="habitInfo">
                <div className="habitName">
                    {habit.name}
                    {habit.pinned && isMyAcc && (
                        <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>
                    )}
                </div>
                <div className="habitPer">
                    {habit.ongoing && (
                        timerLoading
                            ? "Загрузка..."
                            : timerStatus || periodicityText
                    )}
                    {habit.done && <CheckCircle className="habitHLStatus" weight="fill" />}
                </div>
            </div>
        </Link>
    );
}