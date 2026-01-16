import { useParams } from "react-router"
import "../../scss/Diagrams.scss"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../components/hooks/HabitsHook"
import { getDayArrays } from "../../../../components/ts/utils/getDayArrs";
import formatComp from "../../utils/formatComp"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { isMobile } from "react-device-detect"

ChartJS.register(ArcElement, Tooltip, Legend);

export interface DiagramType {
    procent:number;
    days?:number;
    label:string;
    color:string;
}

export default function Diagrams() {
    const { habitId:id } = useParams<{habitId:string}>()
    const { chosenDay, calendar, selectedMonth : month, selectedYear : year } = useCalendar()
    const { habit } = useTheHabit()
    const { habits } = useHabits()
    const Diagram: DiagramType[] = []
    let Info: string | undefined = undefined
    
    if (id) {
        if (chosenDay) {
            // 1. привычка + выбран день
            const found = calendar.find(c => c.habitId === id && c.date === chosenDay)
            Info = formatComp(found?.created_at) || "Не выполнено"
        } else {
            // 2. привычка + день не выбран
            if (habit) {
                const endDate = new Date(year, month + 1, 0)
                const daysInMonth = Array.from({ length: endDate.getDate() }, (_, i) =>
                    new Date(year, month, i + 1).toISOString().slice(0, 10)
                )

                const today = new Date();
                const totalMonth = daysInMonth.length;
                let totalDone = 0;
                let totalSkipped = 0;
                let totalPlanned = 0;
                let totalNothing = 0;

                // Определяем дату старта для привычки
                const pointDay = habit.start_date < daysInMonth[0]
                    ? daysInMonth[0]
                    : habit.start_date;

                const beforePointDays = daysInMonth.filter(day => day < pointDay);
                let activeDays = daysInMonth.filter(day => day >= pointDay);

                // 🔹 Дни до начала привычки — "Свободно"
                totalNothing += beforePointDays.length;

                // 🔹 Если привычка weekly — берём только выбранные дни
                if (habit.periodicity === "weekly" && Array.isArray(habit.chosen_days) && habit.chosen_days.length > 0) {
                    const activeChosen = activeDays.filter(day => {
                        const weekday = new Date(day).getDay();
                        return habit.chosen_days!.includes(weekday);
                    });
                    const inactiveDays = activeDays.filter(day => !activeChosen.includes(day));
                    totalNothing += inactiveDays.length;
                    activeDays = activeChosen;
                }

                // 🔹 Подсчёт по активным дням
                activeDays.forEach(day => {
                    const d = new Date(day);
                    const completion = calendar.find(c => c.habitId === id && c.date === day);
                    const isDone = completion && (completion.isDone === undefined || completion.isDone === true);

                    if (isDone) totalDone++;
                    else if (d > today) totalPlanned++;
                    else totalSkipped++;
                });

                // 🔹 Расчёт процентов
                const completedProcent = (totalDone / totalMonth) * 100;
                const skippedProcent = (totalSkipped / totalMonth) * 100;
                const plannedProcent = (totalPlanned / totalMonth) * 100;
                const nothingProcent = (totalNothing / totalMonth) * 100;

                if (completedProcent > 0) Diagram.push({ procent: completedProcent, label: "Выполнено", color: "comp" });
                if (skippedProcent > 0) Diagram.push({ procent: skippedProcent, label: "Пропущено", color: "skip" });
                if (plannedProcent > 0) Diagram.push({ procent: plannedProcent, label: "В планах", color: "will" });
                if (nothingProcent > 0) Diagram.push({ procent: nothingProcent, label: "Свободно", color: "nothing" });
            }
        }
    } else {
        if (chosenDay) {
            // 3. нет привычки + выбран день
            const { completedArr, skippedArr, willArr } = getDayArrays(chosenDay, calendar, habits, id, habit);
            const cLength = completedArr.length;
            const sLength = skippedArr.length;
            const wLength = willArr.length;
            const all = cLength + sLength + wLength;

            if (all > 0) {
                const compProcent = (cLength / all) * 100;
                const skipProcent = (sLength / all) * 100;
                const willProcent = (wLength / all) * 100;
                if (willProcent > 0) Diagram.push({ procent: willProcent, label: "В планах", color: "will" });
                if (compProcent > 0) Diagram.push({ procent: compProcent, label: "Выполненные", color: "comp" });
                if (skipProcent > 0) Diagram.push({ procent: skipProcent, label: "Пропущенные", color: "skip" });
            } else Diagram.push({ procent: 100, label: "Свободно", color: "nothing" });
        } else {
            // 4. нет привычки + нет дня
            if (!habits) return null;

            const today = new Date();
            let totalDone = 0;
            let totalSkipped = 0;
            let totalPlanned = 0;

            // 🔹 Берём все дни месяца
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);
            const allDaysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) =>
                new Date(year, month, i + 1).toISOString().slice(0, 10)
            );

            // 🔹 Отфильтровываем отметки только за нужный месяц
            const monthCalendar = calendar.filter(c => {
                const d = new Date(c.date);
                return d >= startOfMonth && d <= endOfMonth;
            });

            // 🔹 Сеты для активных дней и подсчёт habit-days
            const activeHabitDays = new Map<string, number>(); // день => кол-во активных привычек в день
            habits.forEach(habit => {
                const start = new Date(habit.start_date);
                const end = habit.end_date ? new Date(habit.end_date) : endOfMonth;
                const maxStartTime = Math.max(start.getTime(), startOfMonth.getTime());
                const dStart = new Date(maxStartTime);
                for (let d = dStart; d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().slice(0, 10);
                    if (d > endOfMonth) break;

                    // проверяем периодичность
                    if (habit.periodicity === "weekly" && Array.isArray(habit.chosen_days)) {
                        const weekday = d.getDay();
                        if (!habit.chosen_days.includes(weekday)) continue;
                    }

                    // Увеличиваем счётчик активных привычек в день
                    activeHabitDays.set(dateStr, (activeHabitDays.get(dateStr) || 0) + 1);

                    // ищем отметку для этой привычки в этот день
                    const completion = monthCalendar.find(c => Number(c.habitId) === habit.id && c.date === dateStr);
                    const isFuture = d > today;

                    if (completion) {
                        if (completion.isDone === undefined || completion.isDone === true) {
                            totalDone++;
                        } else if (isFuture) {
                            totalPlanned++;
                        } else {
                            totalSkipped++;
                        }
                    } else {
                        if (isFuture) {
                            totalPlanned++;
                        } else {
                            totalSkipped++;
                        }
                    }
                }
            });

            // 🔹 totalNothing — дни без активных привычек
            const totalNothing = allDaysInMonth.filter(day => !activeHabitDays.has(day)).length;

            // 🔹 Расчёт абсолютных процентов с суммой 100%
            const totalDays = allDaysInMonth.length;
            const activeDays = activeHabitDays.size;
            const activeFraction = totalDays > 0 ? activeDays / totalDays : 0;
            const totalActiveHabitDays = totalDone + totalSkipped + totalPlanned;
            const completedProcent = totalActiveHabitDays > 0 ? (totalDone / totalActiveHabitDays) * activeFraction * 100 : 0;
            const skippedProcent = totalActiveHabitDays > 0 ? (totalSkipped / totalActiveHabitDays) * activeFraction * 100 : 0;
            const plannedProcent = totalActiveHabitDays > 0 ? (totalPlanned / totalActiveHabitDays) * activeFraction * 100 : 0;
            const nothingProcent = totalDays > 0 ? totalNothing / totalDays * 100 : 0;

            if (completedProcent > 0) Diagram.push({ procent: completedProcent, label: "Выполнено", color: "comp" });
            if (skippedProcent > 0) Diagram.push({ procent: skippedProcent, label: "Пропущено", color: "skip" });
            if (plannedProcent > 0) Diagram.push({ procent: plannedProcent, label: "В планах", color: "will" });
            if (nothingProcent > 0) Diagram.push({ procent: nothingProcent, label: "Свободно", color: "nothing" });
        }
    }

    const colors: Record<string, string> = {
        comp: "#129e12",
        skip: "#646464",
        will: "#dddddd",
        nothing: "#111111"
    };
    const data = {
        labels: Diagram.map((d) => d.label),
        datasets: [
        {
            data: Diagram.map((d) => d.procent),
            backgroundColor: Diagram.map((d) => colors[d.color] || "#ccc"),
            borderWidth: 0,
        },
        ],
    };
    const options = {
        cutout: "80%",
        plugins: {
            legend: {
                display: false,
            },
        },
    };

    return (
        <div className={`diagramsDiv ${isMobile ? "mobile" : ""}`}>
            {Diagram.length > 0
                ? (
                    <>
                        <div className="diagram">
                            <Doughnut data={data} options={options} />
                        </div>
                        <div className="diagramLegend">
                            {Diagram.map((d, i) => (
                                <div className="legendStr" key={i}>
                                    <div className={`calendarDot ${d.color}`}></div>
                                    {d.label}: {d.procent.toFixed(0)}%
                                </div>
                            ))}
                        </div>
                    </>
                )
                : Info
                    ? (
                        <div>{Info}</div>
                    )
                    : (
                        <div>Здесь ничего нет</div>
                    )
            }
        </div>
    )
}