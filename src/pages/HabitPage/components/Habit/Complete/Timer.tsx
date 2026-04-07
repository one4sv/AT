import { useEffect, useState } from "react";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useHabitTimer } from "../../../../../components/hooks/utils/useHabitTimer";
import { calculateTimerElapsed, calculateUntilTimer } from "../../../../../components/ts/utils/TimerFuncs";
import { SVGclock } from "../../../utils/SVGclock";
import { FlagPennant, Pause, Play, Square } from "@phosphor-icons/react";
import "../../../scss/Timer.scss";

export default function Timer() {
    const { habit, habitTimer, todayDone, showTimer } = useTheHabit();
    const { chosenDay } = useCalendar();
    const [ untilDisplay, setUntilDisplay ] = useState("00:00:00");
    const [ timerDisplay, setTimerDisplay ] = useState("00:00:00");

    const { timerStart, timerPause, timerStop, timerCircle } = useHabitTimer();

    const todayStr = new Date().toISOString().slice(0, 10);
    const isHistorical = Boolean(chosenDay && chosenDay !== todayStr);

    const currentTimer = isHistorical ? showTimer : habitTimer;
    const canControl = !isHistorical;

    const isTimerActive = currentTimer !== null && canControl;
    const isPaused = canControl && currentTimer?.status === "paused";
    const isEnded = isHistorical || 
        (currentTimer ? currentTimer.status === "ended" || new Date(currentTimer.end_at).getTime() <= Date.now() : todayDone);

    useEffect(() => {
        if (!habit) return;

        const update = () => {
            setUntilDisplay(isHistorical ? "" : calculateUntilTimer(habit, isEnded));
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [habit, isHistorical, isEnded]);

    useEffect(() => {
        if (!currentTimer) {
            setTimerDisplay("00:00:00");
            return;
        }

        const update = () => {
            const display = calculateTimerElapsed(currentTimer, isHistorical);
            setTimerDisplay(display);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [currentTimer, isHistorical]);

    if (!habit) return null;

    const [hoursStr, minutesStr, secondsStr] = timerDisplay.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    
    return (
        <div className="completeMain">
            <SVGclock hours={hours} minutes={minutes} seconds={seconds} />
            <div className="timerNums">
                <div className="untilNums">
                    {untilDisplay}
                </div>
                <div className="timerLeft">
                    {timerDisplay}
                </div>
            </div>
            {canControl && (
                <div className="timerButts">
                    {isTimerActive && !isEnded && (
                        <div className="launchButtWrapper">
                            <div className="launchButt" onClick={() => {
                                if (isPaused) timerStop();
                                else timerCircle();
                            }}>
                                {isPaused ? <Square weight="fill"/> : <FlagPennant weight="fill"/>}
                            </div>
                        </div>
                    )}
                    <div className="launchButtWrapper">
                        <div className={`launchButt ${isEnded ? "disabled" : ""}`} onClick={() => {
                            if (isEnded) return;
                            if (!isTimerActive) timerStart();
                            else if (isPaused) timerStart();
                            else timerPause();
                        }}>
                            {isTimerActive && !isEnded
                                ? isPaused
                                    ? <Play weight="fill"/>
                                    : <Pause weight="fill"/>
                                : <Play weight="fill"/>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}