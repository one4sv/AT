import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowSquareOutIcon, CheckCircleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../../components/hooks/UserHook";
import { useBlackout } from "../../../../../components/hooks/BlackoutHook";
import useHabitMembers from "../../HabitInfo/useHabitMembers";
import "../../../scss/DayComment.scss";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { api } from "../../../../../components/ts/api";
import { useWebSocket } from "../../../../../components/hooks/WebSocketHook";
import type { HabitUser } from "../../HabitInfo/useHabitMembers";

interface DayAction {
    id: number;
    user_id: string | null;
    created_at: string;
    user: HabitUser | null;
}

interface DayComment extends DayAction {
    comment: string;
}

interface DayCompletion extends DayAction {}

type FeedItem = (DayComment & { type: "comment" }) | (DayCompletion & { type: "completion" });

const formatEventDate = (date: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(parsed);
};

export default function SharedDayComments({ mobile = false, expanded = false }: { mobile?: boolean; expanded?: boolean }) {
    const { habit, dayComment } = useTheHabit();
    const { user } = useUser();
    const { data } = useHabitMembers(habit?.id);
    const { setBlackout } = useBlackout();
    const isShared = !!data?.member_count;
    const { chosenDay } = useCalendar();
    const { ws } = useWebSocket();
    const [ comments, setComments ] = useState<DayComment[]>([]);
    const [ completions, setCompletions ] = useState<DayCompletion[]>([]);
    const [ error, setError ] = useState("");
    const [ overflowed, setOverflowed ] = useState(false);
    const feedRef = useRef<HTMLDivElement | null>(null);
    const entriesRef = useRef<HTMLDivElement | null>(null);

    const load = useCallback(async (signal?: AbortSignal) => {
        if (!habit || !isShared) return;
        try {
            const res = await api.get(`habits/${habit.id}/day-comments`, { params: { date: chosenDay }, signal });
            if (!signal?.aborted) {
                setComments(res.data.comments || []);
                setCompletions(res.data.completions || []);
                setError("");
            }
        } catch {
            if (!signal?.aborted) setError("Не удалось загрузить историю активности");
        }
    }, [habit?.id, chosenDay, isShared]);

    useEffect(() => {
        const controller = new AbortController();
        setComments([]);
        setCompletions([]);
        setOverflowed(false);
        void load(controller.signal);
        const refresh = () => { void load(controller.signal); };
        window.addEventListener("habit-day-comment-updated", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            controller.abort();
            window.removeEventListener("habit-day-comment-updated", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, [load, dayComment]);

    useEffect(() => {
        if (!ws) return;
        const controller = new AbortController();
        const onMessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "HABIT_DAY_COMMENT_UPDATED" &&
                    message.habitId === habit?.id && message.date === chosenDay) {
                    void load(controller.signal);
                }
            } catch {
                // Other websocket events are unrelated to the current day.
            }
        };
        ws.addEventListener("message", onMessage);
        return () => { controller.abort(); ws.removeEventListener("message", onMessage); };
    }, [ws, habit?.id, chosenDay, load]);

    const feed: FeedItem[] = [
        ...comments.filter(item => item.user_id !== user.id).map(item => ({ ...item, type: "comment" as const })),
        ...completions.map(item => ({ ...item, type: "completion" as const }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    useEffect(() => {
        if (expanded || !isShared || !feed.length) return;
        const element = feedRef.current;
        if (!element) return;
        const measure = () => setOverflowed(element.scrollHeight > element.clientHeight + 2);
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        if (entriesRef.current) observer.observe(entriesRef.current);
        const frame = requestAnimationFrame(measure);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [expanded, isShared, mobile, chosenDay, feed.length]);

    if (!isShared || (!expanded && !feed.length && !error)) return null;

    const content = <div className="sharedDayComments" ref={feedRef} aria-label="Комментарии и отметки выполнения участников">
        <div className="dayActivityEntries" ref={entriesRef}>
            {error && <div role="alert">{error}</div>}
            {feed.map(item => <article
                className={`sharedDayComment ${item.type === "completion" ? "sharedDayCompletion" : ""}`}
                key={`${item.type}-${item.id}`}
            >
                <div className="commentInfo">
                    {item.user?.nick ? <Link className="commentUser" to={`/acc/${item.user.nick}`}>
                        <div className="commentAvatar">
                            {item.user.avatar_url ? <img src={item.user.avatar_url} alt="" /> : <UserCircleIcon />}
                        </div>
                        <span>{item.user.username || item.user.nick}</span>
                    </Link> : <div className="commentUser">
                        <div className="commentAvatar"><UserCircleIcon /></div>
                        <span>Участник</span>
                    </div>}
                    <span className="commentDate">{formatEventDate(item.created_at)}</span>
                    {item.type === "completion" && <CheckCircleIcon className="dayCompletionIcon" weight="fill" aria-label="Выполнено" />}
                </div>
                {item.type === "comment" && <div className="commentText">{item.comment}</div>}
            </article>)}
            {expanded && !feed.length && !error && <div className="habitSettingValue">За этот день действий пока нет</div>}
        </div>
    </div>;

    if (expanded) return content;
    const preview = <div className="dayActivityPreview">
        {content}
        {overflowed && <button
            type="button"
            className="dayActivityShowAll"
            onClick={() => setBlackout({ seted: true, module: "HabitDayActivityHistory" })}
        >
            <ArrowSquareOutIcon weight="bold" />
            Показать все
        </button>}
    </div>;
    return mobile ? <div className="dayCommentDiv mobileSharedDayComments"><div className="dayActivityTitle">Активность участников</div>{preview}</div> : preview;
}
