import { useParams } from "react-router"
import "../../scss/Diagrams.scss"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../components/hooks/HabitsHook"
import { getDayArrays } from "../../../../components/ts/utils/getDayArrs";
import formatComp from "../../utils/formatComp"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

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
                let daysInMonth = Array.from({ length: endDate.getDate() }, (_, i) =>
                    new Date(year, month, i + 1).toISOString().slice(0, 10)
                )

                const today = new Date();
                let totalExpected = 0;
                let totalDone = 0;
                let totalSkipped = 0;
                let totalPlanned = 0;

                if (habit.periodicity === "weekly") {
                    const startWeekday = new Date(habit.start_date).getDay();
                    daysInMonth = daysInMonth.filter(day => new Date(day).getDay() === startWeekday);
                }

                totalExpected = daysInMonth.length;

                daysInMonth.forEach(day => {
                    const d = new Date(day);
                    const completion = calendar.find(c => c.habitId === id && c.date === day);
                    const isDone = completion && (completion.isDone === undefined || completion.isDone === true);

                    if (isDone) {
                        totalDone++;
                    } else if (d > today) {
                        totalPlanned++;
                    } else {
                        totalSkipped++;
                    }
                });

                const completedProcent = totalExpected > 0 ? (totalDone / totalExpected) * 100 : 0;
                const skippedProcent = totalExpected > 0 ? (totalSkipped / totalExpected) * 100 : 0;
                const plannedProcent = totalExpected > 0 ? (totalPlanned / totalExpected) * 100 : 0;

                if (completedProcent > 0) Diagram.push({ procent: completedProcent, label: "Выполнено", color: "comp" });
                if (skippedProcent > 0) Diagram.push({ procent: skippedProcent, label: "Пропущено", color: "skip" });
                if (plannedProcent > 0) Diagram.push({ procent: plannedProcent, label: "В планах", color: "will" });
            }
        }
    } else {
        if (chosenDay) {
            // 3. нет привычки + выбран день
            const { completedArr, skippedArr } = getDayArrays(chosenDay, calendar, habits, id, habit)
            const cLength = completedArr.length
            const sLength = skippedArr.length
            const all = cLength + sLength

            if (all > 0) {
                const dayDate = new Date(chosenDay);
                const today = new Date();
                const isFuture = dayDate > today;

                const compProcent = (cLength / all) * 100;

                if (isFuture) {
                    const planProcent = (sLength / all) * 100;
                    if (compProcent > 0) Diagram.push({ procent: compProcent, label: "Выполненные", color: "comp" });
                    if (planProcent > 0) Diagram.push({ procent: planProcent, label: "В планах", color: "will" });
                } else {
                    const skipProcent = (sLength / all) * 100;
                    if (compProcent > 0) Diagram.push({ procent: compProcent, label: "Выполненные", color: "comp" });
                    if (skipProcent > 0) Diagram.push({ procent: skipProcent, label: "Пропущенные", color: "skip" });
                }
            }
        } else {
            // 4. нет привычки + нет дня
            let totalExpected = 0
            let totalDone = 0
            let totalPlanned = 0
            let totalSkipped = 0
            if (!habits) return null;
            const today = new Date()
            const monthEnd = new Date(year, month + 1, 0);
            const maxDate = new Date(Math.max(...habits.map(h => h.end_date ? new Date(h.end_date).getTime() : monthEnd.getTime())));

            for (const habit of habits) {
                const start = new Date(habit.start_date);
                const end = habit.end_date ? new Date(habit.end_date) : maxDate;

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().slice(0, 10);

                    if (habit.periodicity === "weekly") {
                        const startWeekday = new Date(habit.start_date).getDay();
                        if (d.getDay() !== startWeekday) continue;
                    }

                    totalExpected++;

                    const completion = calendar.find(c => Number(c.habitId) === habit.id && c.date === dateStr);
                    const isDone = completion && (completion.isDone === undefined || completion.isDone === true);

                    if (isDone) {
                        totalDone++;
                    } else if (d > today) {
                        totalPlanned++;
                    } else {
                        totalSkipped++;
                    }
                }
            }

            const completedProcent = totalExpected > 0 ? (totalDone / totalExpected) * 100 : 0;
            const skippedProcent = totalExpected > 0 ? (totalSkipped / totalExpected) * 100 : 0;
            const plannedProcent = totalExpected > 0 ? (totalPlanned / totalExpected) * 100 : 0;

            if (completedProcent > 0) Diagram.push({ procent: completedProcent, label: "Общее выполнение", color: "comp" });
            if (skippedProcent > 0) Diagram.push({ procent: skippedProcent, label: "Пропущено", color: "skip" });
            if (plannedProcent > 0) Diagram.push({ procent: plannedProcent, label: "В планах", color: "will" });
        }
    }

    const colors: Record<string, string> = {
        comp: "#129e12",
        skip: "#646464",
        will: "#dddddd"
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
        <div className="diagramsDiv">
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