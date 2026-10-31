import { Virtuoso } from "react-virtuoso";
import { useNavigate } from "react-router-dom";
import "../../scss/CompJurnal.scss";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import { formatDateFromString } from "../../../../components/ts/utils/dateToStr";

interface ActivityEvent {
    id: string;
    type: "completion" | "joined" | "left" | "invited" | "declined" | "settings_changed" | "completion_removed";
    date?: string;
    created_at: string;
    user: { nick: string; username: string | null } | null;
}

export default function CompJurnal() {
    const { calendar } = useCalendar()
    const { setDayComment, setIsDone, habit } = useTheHabit()
    const { setChosenDay, setSelectedYear, setSelectedMonth } = useCalendar();
    const navigate = useNavigate();

    const [ jurnalSearch, setJurnalSearch ] = useState("")
    const [ memberEvents, setMemberEvents ] = useState<ActivityEvent[]>([])
    const [ memberEventsError, setMemberEventsError ] = useState(false)

    useEffect(() => {
        if (!habit?.id) {
            setMemberEvents([]);
            return;
        }
        let active = true;
        api.get(`habits/${habit.id}/activity`).then(res => {
            if (active) {
                setMemberEvents(res.data.events || []);
                setMemberEventsError(false);
            }
        }).catch(() => {
            if (active) setMemberEventsError(true);
        });
        return () => { active = false; };
    }, [habit?.id])

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
            {habit && <div className="settingInnerWrapper">
                <div className="settingSpan">Действия участников</div>
                {memberEventsError && <div className="settingHint">Не удалось загрузить действия участников</div>}
                {!memberEventsError && memberEvents.length === 0 && <div className="settingHint">Пока нет действий участников</div>}
                {memberEvents.filter(event => !jurnalSearch.trim() || [event.user?.username, event.user?.nick, event.date].some(value => value?.toLowerCase().includes(jurnalSearch.trim().toLowerCase()))).slice(0, 30).map(event => <div className="CJrecord" key={event.id}>
                    <div className="CJdates">
                        <div className="CJdate">{event.user?.username || event.user?.nick || "Участник"}</div>
                        <div className="CJcreated">{new Date(event.created_at).toLocaleString("ru-RU")}</div>
                    </div>
                    <div className="CJcomment">{event.type === "joined" ? "Присоединился к активности" : event.type === "left" ? "Покинул активность" : event.type === "invited" ? "Получил приглашение" : event.type === "declined" ? "Отклонил приглашение" : event.type === "settings_changed" ? "Изменены настройки активности" : event.type === "completion_removed" ? `Отменил выполнение за ${event.date || "указанную дату"}` : `Выполнил активность за ${event.date}`}</div>
                </div>)}
            </div>}
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
                                    if (!habit) navigate(`/habit/${habitId}`);
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

                                <div className="CJhabit">{habitName}</div>
                                <div className="CJcomment">{comment}</div>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
}
