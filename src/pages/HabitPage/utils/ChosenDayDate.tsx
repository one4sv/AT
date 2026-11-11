import { CalendarSync } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateLabel, todayStrFunc } from "../../../components/ts/utils/dateToStr";
import { useCalendar } from "../../../components/hooks/CalendarHook";
import "../scss/ChosenDay.scss";

export default function ChosenDayDate () {
    useTranslation("common");
    const { chosenDay, setChosenDay, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useCalendar()
    const date = new Date(chosenDay)
    const showReturn = chosenDay !== todayStrFunc() || selectedMonth !== date.getMonth() || selectedYear !== date.getFullYear()

    const returnCal = () => {
        const today = new Date()
        setChosenDay(todayStrFunc())
        setSelectedMonth(today.getMonth())
        setSelectedYear(today.getFullYear())
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
