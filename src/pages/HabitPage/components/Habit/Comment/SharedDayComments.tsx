import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircleIcon } from "@phosphor-icons/react";
import { useUser } from "../../../../../components/hooks/UserHook";
import formatCreated from "../../../../Acc/utils/formatCreated";
import useHabitMembers from "../../HabitInfo/useHabitMembers";
import "../../../scss/DayComment.scss";
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { api } from "../../../../../components/ts/api";
import { useWebSocket } from "../../../../../components/hooks/WebSocketHook";
import type { HabitUser } from "../../HabitInfo/useHabitMembers";

interface DayComment {
    id: number;
    user_id: string;
    comment: string;
    created_at: string;
    user: HabitUser | null;
}

export default function SharedDayComments({ mobile = false }: { mobile?: boolean }) {
    const { habit, dayComment } = useTheHabit();
    const { user } = useUser();
    const { data } = useHabitMembers(habit?.id);
    const isShared = !!data?.member_count;
    const { chosenDay } = useCalendar();
    const { ws } = useWebSocket();
    const [ comments, setComments ] = useState<DayComment[]>([]);
    const [ error, setError ] = useState("");
    const load = useCallback(async (signal?: AbortSignal) => {
        if (!habit || !isShared) return;
        try {
            const res = await api.get(`habits/${habit.id}/day-comments`, { params: { date: chosenDay }, signal });
            if (!signal?.aborted) {
                setComments(res.data.comments || []);
                setError("");
            }
        } catch {
            if (!signal?.aborted) setError("Не удалось загрузить комментарии");
        }
    }, [habit?.id, chosenDay, isShared]);
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
    const othersComments = comments.filter(comment => comment.user_id !== user.id);
    if (!isShared || (!othersComments.length && !error)) return null;

    const content = <div className="sharedDayComments comments" aria-label="Комментарии участников">
        {error && <div role="alert">{error}</div>}
        {othersComments.map(comment => <article className="comment sharedDayComment" key={comment.id}>
            <div className="commentInfo">
                <Link className="commentUser" to={`/acc/${comment.user?.nick || comment.user_id}`}>
                    <div className="commentAvatar">
                        {comment.user?.avatar_url ? <img src={comment.user.avatar_url} alt="" /> : <UserCircleIcon />}
                    </div>
                    <span>{comment.user?.username || comment.user?.nick || "Участник"}</span>
                </Link>
            </div>
            <div className="commentText">{comment.comment}</div>
            <div className="commentReactions">
                <span className="commentDate">{formatCreated(comment.created_at)}</span>
            </div>
        </article>)}
    </div>;
    return mobile ? <div className="dayCommentDiv mobileSharedDayComments">{content}</div> : content;
}
