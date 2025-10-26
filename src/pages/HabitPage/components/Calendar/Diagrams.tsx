import { useParams } from "react-router"
import "../../scss/Diagrams.scss"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { useTheHabit } from "../../../../components/hooks/TheHabitHook"
import { useHabits } from "../../../../components/hooks/HabitsHook"
import { getDayArrays } from "../../../../components/ts/utils/getDayArrs";

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
            // 1. привычка + выбран день
            console.log("привычка + выбран день")
        } else {
            // 2. привычка every day+ день не выбран
            if (habit?.periodicity !== "weekly") {
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
                console.log("привычка weekly + выбран день")
            }
        }
    } else {
            // 3. нет привычки + выбран день
        if (chosenDay) {
            const { completedArr, skippedArr } = getDayArrays(chosenDay, calendar, habits, id, habit)
            const cLength = completedArr.length
            const sLength = skippedArr.length
            const all = cLength + sLength

            if (all > 0) {
                Diagram.push({ procent: (cLength / all) * 100, label: "Выполненные", color: "comp" })
                Diagram.push({ procent: (sLength / all) * 100, label: "Пропущенные", color: "skip" })
            }
            // 4. нет привычки + нет дня
        } else {
            console.log("нет привычки + нет дня")
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
