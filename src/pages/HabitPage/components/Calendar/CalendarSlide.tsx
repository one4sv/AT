import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import type { SlideData } from "../../utils/buildSlide";
import DayCell from "./DayCell";

export function CalendarSlide({slide} : {slide:SlideData}) {
    const { habits } = useHabits()
    const { habit: h } = useTheHabit();
    const allDays = [...slide.days.prev, ...slide.days.this, ...slide.days.post];
    if (!slide) return null;

    return (
        <div className="calendarSlide">
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
    )
}