import { useParams } from "react-router"
import "../../scss/Diagrams.scss"
import { useCalendar } from "../hooks/CalendarHook"
import { useTheHabit } from "../hooks/TheHabitHook"
import { useHabits } from "../hooks/HabitsHook"
import { getDayArrays } from "./utils/getDayArrs"

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

    if (id) {
        if (chosenDay) {
            // 4. Одна привычка + выбран день → пока заглушка
            return <div>Детали дня для одной привычки (пока заглушка)</div>
        } else {
            // 3. Одна привычка + день не выбран
            if (habit?.periodicity !== "weekly") {
                // const startDate = new Date(year, month, 1)
                const endDate = new Date(year, month + 1, 0)
                const daysInMonth = Array.from({ length: endDate.getDate() }, (_, i) =>
                    new Date(year, month, i + 1).toISOString().slice(0, 10)
                )

                let completed = 0
                daysInMonth.forEach(day => {
                    const hasCompletion = calendar.some(c => c.habitId === id && c.date === day)
                    if (hasCompletion) completed++
                })

                const procent = daysInMonth.length > 0 ? (completed / daysInMonth.length) * 100 : 0
                Diagram.push({ procent, label: "Выполнено", color: "comp" })
            } else {
                return <div>Пока ничего нет для weekly привычки</div>
            }
        }
    } else {
        if (chosenDay) {
            const { completedArr, skippedArr } = getDayArrays(chosenDay, calendar, habits, id)
            const cLength = completedArr.length
            const sLength = skippedArr.length
            const all = cLength + sLength

            if (all > 0) {
                Diagram.push({ procent: (cLength / all) * 100, label: "Выполненные", color: "comp" })
                Diagram.push({ procent: (sLength / all) * 100, label: "Пропущенные", color: "skip" })
            }
        } else {
            // 1. Все привычки + день не выбран → пока заглушка
            return <div>Здесь ещё не придумали для месячной диаграммы всех привычек</div>
        }
    }

    return (
        <div className="diagramsDiv">
            {Diagram.length > 0
                ? Diagram.map((p, i) => (
                    <div className={`diagramLabel`} key={i}>
                        <div className={`calendarDot ${p.color}`}></div>
                        {p.label}: {p.procent.toFixed(0)}%
                    </div>
                ))
                : <div>Здесь ещё не придумали</div>
            }
        </div>
    )
}
