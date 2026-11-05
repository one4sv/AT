import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
interface DayTaskCompletion extends DayAction { name: string; }

type FeedItem = (DayComment & { type: "comment" }) | (DayCompletion & { type: "completion" }) | (DayTaskCompletion & { type: "task" });

const formatEventDate = (date: string, locale: string) => {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(parsed);
};

export default function SharedDayComments({ mobile = false, expanded = false }: { mobile?: boolean; expanded?: boolean }) {
    const { t, i18n } = useTranslation("common");
    const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-GB" : "ru-RU";
    const { habit, dayComment } = useTheHabit();
    const { user } = useUser();
    const { data } = useHabitMembers(habit?.id);
    const { setBlackout } = useBlackout();
    const isShared = !!data?.member_count;
    const { chosenDay } = useCalendar();
    const { ws } = useWebSocket();
    const [ comments, setComments ] = useState<DayComment[]>([]);
    const [ completions, setCompletions ] = useState<DayCompletion[]>([]);
    const [ taskCompletions, setTaskCompletions ] = useState<DayTaskCompletion[]>([]);
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
                setTaskCompletions(res.data.taskCompletions || []);
                setError("");
            }
        } catch {
            if (!signal?.aborted) setError(t("habitPageUi.day.historyFailed"));
        }
    }, [habit?.id, chosenDay, isShared, t]);

    useEffect(() => {
        const controller = new AbortController();
        setComments([]);
        setCompletions([]);
        setTaskCompletions([]);
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
        ...completions.map(item => ({ ...item, type: "completion" as const })),
        ...taskCompletions.map(item => ({ ...item, type: "task" as const }))
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

    const content = <div className="sharedDayComments" ref={feedRef} aria-label={t("habitPageUi.day.participantActionsLabel")}>
        <div className="dayActivityEntries" ref={entriesRef}>
            {error && <div role="alert">{error}</div>}
            {feed.map(item => <article
                className={`sharedDayComment ${item.type !== "comment" ? "sharedDayCompletion" : ""}`}
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
                        <span>{t("habitPageUi.day.participant")}</span>
                    </div>}
                    <span className="commentDate">{formatEventDate(item.created_at, locale)}</span>
                    {item.type !== "comment" && <CheckCircleIcon className="dayCompletionIcon" weight="fill" aria-label={t("habitUi.done")} />}
                </div>
                {item.type === "comment" && <div className="commentText">{item.comment}</div>}
                {item.type === "task" && <div className="commentText sharedTaskEventName">{t("habitPageUi.day.completedTask", { name: item.name })}</div>}
            </article>)}
            {expanded && !feed.length && !error && <div className="habitSettingValue">{t("habitPageUi.day.noActions")}</div>}
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
            {t("habitPageUi.day.showAll")}
        </button>}
    </div>;
    return mobile ? <div className="dayCommentDiv mobileSharedDayComments"><div className="statsTitle">{t("habitPageUi.day.participantActivity")}</div>{preview}</div> : preview;
}
