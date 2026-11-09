import { Virtuoso } from "react-virtuoso";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "../../scss/CompJurnal.scss";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { CircleUserRound, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import { formatDateFromString } from "../../../../components/ts/utils/dateToStr";

interface ActivityEvent {
    id: string;
    type: "completion" | "joined" | "left" | "invited" | "declined" | "settings_changed" | "completion_removed";
    date?: string;
    created_at: string;
    user: { nick: string; username: string | null; avatar_url?: string | null } | null;
}

export default function CompJurnal() {
    const { t, i18n } = useTranslation("common");
    const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU";
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

    const describeEvent = (event: ActivityEvent) => {
        const date = event.date && /^\d{4}-\d{2}-\d{2}$/.test(event.date) ? formatDateFromString(event.date) : event.date;
        if (event.type === "completion_removed") return t("habitPageUi.journal.completionRemoved", { date: date || t("habitPageUi.journal.unspecifiedDate") });
        if (event.type === "completion") return t("habitPageUi.journal.completed", { date });
        return t(`habitPageUi.journal.${event.type}`);
    };

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
                <div className="settingSpan">{t("habitPageUi.journal.memberActions")}</div>
                {memberEventsError && <div className="settingHint">{t("habitPageUi.journal.loadFailed")}</div>}
                {!memberEventsError && memberEvents.length === 0 && <div className="settingHint">{t("habitPageUi.journal.empty")}</div>}
                {memberEvents.filter(event => !jurnalSearch.trim() || [event.user?.username, event.user?.nick, event.date].some(value => value?.toLowerCase().includes(jurnalSearch.trim().toLowerCase()))).slice(0, 30).map(event => <div className="CJrecord memberEvent" key={event.id}>
                    <div className="CJdates">
                        <div className="CJdate CJmember">
                            {event.user?.avatar_url ? <img src={event.user.avatar_url} className="CJavatar" alt="" /> : <CircleUserRound className="CJavatar" aria-hidden="true" />}
                            <span>{event.user?.username || event.user?.nick || t("habitPageUi.day.participant")}</span>
                        </div>
                        <div className="CJcreated">{new Date(event.created_at).toLocaleString(locale)}</div>
                    </div>
                    <div className="CJcomment">{describeEvent(event)}</div>
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
                            new Date(created_at).toLocaleDateString(locale, {
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
                                    <div className="CJcreated">{t("habitPageUi.journal.recorded", { date: created })}</div>
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
