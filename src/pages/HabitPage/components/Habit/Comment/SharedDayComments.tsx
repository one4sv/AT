import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircleIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { api } from "../../../../../components/ts/api";
import { useWebSocket } from "../../../../../components/hooks/WebSocketHook";
import type { HabitUser } from "../../HabitInfo/useHabitMembers";

interface DayComment {
    id: number;
    user_id: string;
    comment: string;
    user: HabitUser | null;
}

export default function SharedDayComments() {
    const { habit, dayComment } = useTheHabit();
    const { chosenDay } = useCalendar();
    const { ws } = useWebSocket();
    const [ comments, setComments ] = useState<DayComment[]>([]);
    const [ error, setError ] = useState("");
    const load = useCallback(async (signal?: AbortSignal) => {
        if (!habit) return;
        try {
            const res = await api.get(`habits/${habit.id}/day-comments`, { params: { date: chosenDay }, signal });
            if (!signal?.aborted) {
                setComments(res.data.comments || []);
                setError("");
            }
        } catch {
            if (!signal?.aborted) setError("Не удалось загрузить комментарии");
        }
    }, [habit?.id, chosenDay]);
    useEffect(() => {
        const controller = new AbortController();
        setComments([]);
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
                if (message.type === "HABIT_DAY_COMMENT_UPDATED" && message.habitId === habit?.id && message.date === chosenDay) void load(controller.signal);
            } catch {
                // Other websocket messages do not affect this day's comments.
            }
        };
        ws.addEventListener("message", onMessage);
        return () => { controller.abort(); ws.removeEventListener("message", onMessage); };
    }, [ws, habit?.id, chosenDay, load]);
    return <div className="sharedDayComments" aria-label="Комментарии участников">
        {error && <div role="alert">{error}</div>}
        {comments.map(comment => <div className="sharedDayComment" key={comment.id}>
            <Link className="sharedDayCommentUser" to={`/acc/${comment.user?.nick || comment.user_id}`}>
                {comment.user?.avatar_url ? <img src={comment.user.avatar_url} alt="" /> : <UserCircleIcon />}
                <span>{comment.user?.username || comment.user?.nick || "Участник"}</span>
            </Link>
            <div className="sharedDayCommentText">{comment.comment}</div>
        </div>)}
        {!comments.length && !error && <div className="habitSettingValue">За этот день пока нет комментариев</div>}
    </div>;
}
