import { CalendarSync } from "lucide-react";
import { formatDateLabel, todayStrFunc } from "./dateToStr";
import { useCalendar } from "../../../components/hooks/CalendarHook";

export default function ChosenDayDate () {
    const { chosenDay, setChosenDay, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useCalendar()
    const date = new Date(chosenDay)
    const showReturn = chosenDay !== todayStrFunc() || selectedMonth !== date.getMonth() || selectedYear !== date.getFullYear()

    const returnCal = () => {
        setChosenDay(todayStrFunc())
        setSelectedMonth(date.getMonth())
        setSelectedYear(date.getFullYear())
    }
    return (
        <div className="chosenDayDate">
            {formatDateLabel(chosenDay)}
            {showReturn && (
                <div className="calendarReturn" onClick={() => returnCal()}>
                    <CalendarSync size={18}/>
                </div>
            )}
        </div>
    )
}