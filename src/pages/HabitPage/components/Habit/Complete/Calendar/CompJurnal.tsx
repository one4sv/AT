import { Virtuoso } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import "../../../../scss/CompJurnal.scss";
import { useCalendar } from "../../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../../components/hooks/TheHabitHook";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { formatDateFromString } from "../../../../utils/dateToStr";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { HabitSlideProps } from "../../../../HabitPage";

export default function CompJurnal({setShown, id}:HabitSlideProps) {
    const { calendar } = useCalendar()
    const { setDayComment, setIsDone, } = useTheHabit()
    const { setChosenDay, setSelectedYear, setSelectedMonth } = useCalendar();
    const navigate = useNavigate();

    const [ jurnalSearch, setJurnalSearch ] = useState("")

    const sortedCalendar = [...calendar]
        .filter(c => jurnalSearch.trim().length > 0 ? (c.comment?.includes(jurnalSearch) || formatDateFromString(c.date).includes(jurnalSearch)) && c.isDone : c.isDone)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <div className="habitInnerSlide">
            <div className="compJurnalsearch">
                <input type="text" onChange={(e) => setJurnalSearch(e.target.value)} value={jurnalSearch}/>
                {jurnalSearch.trim().length > 0
                    ? (
                        <X className="deleteSearchText" onClick={() => setJurnalSearch("")}/>
                    ) : (
                        <Search/>
                    )}
            </div>
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
                                        {formatDateFromString(date)}
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
            <div className="habitSlideBack" onClick={() => setShown(false)}>
                <CaretLeftIcon /> Назад
            </div>
        </div>
    );
}
