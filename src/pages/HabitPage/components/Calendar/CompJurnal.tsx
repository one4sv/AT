import { useNavigate, useParams } from "react-router-dom";
import DayComment from "./DayComment";
import "../../scss/CompJurnal.scss"
import type { Calendar } from "../../../../components/context/CalendarContext";
import { useCalendar } from "../../../../components/hooks/CalendarHook";

interface CompJurnalProps {
    isMy:boolean;
    calendar:Calendar[]
}
export default function CompJurnal({isMy, calendar}:CompJurnalProps) {
    const { habitId:id } = useParams<{habitId?: string}>()
    const navigate = useNavigate()
    const { setChosenDay, setSelectedYear, setSelectedMonth } = useCalendar()
    const formatDate = (date:string) => {
        const [y, m, d] = date.split("-")
        return `${d}.${m}.${y}`
    }
    const sortedCalendar = [...calendar]
        .filter(c => c.isDone)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className={`compJurnalDiv`}>
            {id && <DayComment id={id} isMy={isMy} />}
            <div className="compJurnalMain">
                {sortedCalendar.map((day) => {
                    const { date, comment, habitName, habitId, created_at } = day
                    const created = new Date(created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
                    return (
                        <div className="CJrecord" key={`${date}-${habitId}`} onClick={() => {
                            if (!id) navigate(`/habit/${habitId}`)
                            setSelectedYear(new Date(date).getFullYear())
                            setSelectedMonth(new Date(date).getMonth())
                            setTimeout(() => setChosenDay(date), 100)
                        }}>
                            <div className="CJdates">
                                <div className="CJdate">
                                    <div className="calendarDot comp"></div>
                                    {formatDate(date)}
                                </div>
                                <div className="CJcreated">отм. {created}</div>
                            </div>
                            {!id && <div className="CJhabit">{habitName}</div>}
                            <div className="CJcomment">{comment}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}