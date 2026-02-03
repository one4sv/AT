import { Virtuoso } from "react-virtuoso";
import { useNavigate, useParams } from "react-router-dom";
import "../../scss/CompJurnal.scss"
import type { Calendar } from "../../../../../components/context/CalendarContext";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";

interface CompJurnalProps {
    isMy: boolean;
    calendar: Calendar[];
}

export default function CompJurnal({ calendar }: CompJurnalProps) {
    const { setDayComment, setIsDone, doable, habit } = useTheHabit()
    const { setChosenDay, setSelectedYear, setSelectedMonth } = useCalendar();

    const { habitId: id } = useParams<{ habitId?: string }>();
    const navigate = useNavigate();

    const formatDate = (date: string) => {
        const [y, m, d] = date.split("-");
        return `${d}.${m}.${y}`;
    };

    const sortedCalendar = [...calendar]
        .filter(c => c.isDone)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const jurnalHeight = () => {
        if (id && habit) {
            if (habit?.is_archived) return "withArchivedHabit"
            if (doable) return "withHabitnDone"
            else return "withHabit"
        }
    }

    return (
        <div className={`compJurnalDiv ${jurnalHeight() || ""}`} >
            <div className="compJurnalMain">
                <Virtuoso
                    data={sortedCalendar}
                    style={{ height: "100%", scrollbarWidth: "thin" }}
                    followOutput="auto"
                    initialTopMostItemIndex={sortedCalendar.length - 1}
                    itemContent={(_, day) => {
                        const { date, comment, habitName, habitId, created_at } = day;
                        const created =
                            created_at &&
                            new Date(created_at).toLocaleDateString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            });

                        return (
                            <div
                                className="CJrecord"
                                key={`${date}-${habitId}`}
                                onClick={() => {
                                    if (!id) navigate(`/habit/${habitId}`);
                                    setSelectedYear(new Date(date).getFullYear());
                                    setSelectedMonth(new Date(date).getMonth());
                                    setTimeout(() => setChosenDay(date), 1);
                                    setDayComment(comment || "")
                                    setIsDone(true)
                                }}
                            >
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
                        );
                    }}
                />
            </div>
        </div>
    );
}
