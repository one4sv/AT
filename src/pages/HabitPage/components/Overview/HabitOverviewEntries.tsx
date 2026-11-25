import { activityAvatarUrl } from "../../../../components/ts/utils/activityImage";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, CircleIcon, PushPinIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useDone } from "../../../../components/hooks/DoneHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { describeEntrySubtitle, type DayEntry } from "../../../../components/ts/utils/dayTimeline";
import { useNote } from "../../../../components/hooks/NoteHook";
import SectionArt from "../../../../components/ts/SectionArt";
import ActivityIndicators from "../../../../components/ts/ActivityIndicators";
import { tags } from "../../../../components/ts/tags";
import useHabitDayProgress from "../../../../components/hooks/utils/useHabitDayProgress";

export function OverviewEntryTag({ entry }: { entry: DayEntry }) {
    const tag = tags.find(item => item.value === (entry.kind === "plan" ? entry.plan?.tag : entry.habit?.tag));
    if(entry.kind==="habit" && entry.habit?.avatar_key) return <img className="activityAvatar habitOverviewEntryTagIcon" alt="" loading="lazy" src={activityAvatarUrl(entry.habit.id,entry.habit.avatar_key)}/>;
    const Icon = tag?.icon;
    return Icon ? <Icon className="habitOverviewEntryTagIcon" size={32}/> :
        <span className={"calendarDot " + entry.state}/>;
}

export default function HabitOverviewEntries({ entries, view = "all", readOnly = false, day }: {
    entries: DayEntry[];
    view?: "all" | "activities" | "plans";
    readOnly?: boolean;
    day?: string;
}) {
    const { t } = useTranslation("common");
    const { chosenDay: calendarDay, calendar: activeCalendar, allCalendar } = useCalendar();
    const chosenDay = day || calendarDay;
    const calendar = day ? allCalendar : activeCalendar;
    const progress = useHabitDayProgress(chosenDay);
    const { markDone } = useDone();
    const { setCompleted } = usePlans();
    const { showNotification } = useNote();
    const { blackout, setBlackout } = useBlackout();
    const navigate = useNavigate();
    const [updating, setUpdating] = useState<string | null>(null);

    const openEntry = (entry: DayEntry) => {
        if (blackout.module === "HabitOverviewList") setBlackout({ seted: false });
        navigate(entry.kind === "plan" ? "/plan/" + entry.plan!.id +
            (entry.plan?.share ? "?share=" + encodeURIComponent(entry.plan.share) : "") : "/habit/" + entry.habit!.id);
    };

    const complete = async (entry: DayEntry) => {
        if (updating || entry.plan?.status === "canceled") return;
        if (entry.kind === "habit") {
            void markDone(entry.habit!.id, chosenDay);
            return;
        }
        if (entry.plan?.membership_status !== "accepted" ||
            (entry.plan?.completion_mode === "shared" && !entry.plan?.is_owner)) return;
        setUpdating(entry.key);
        try {
            await setCompleted(entry.plan!, !entry.completed);
        } catch {
            showNotification("error", t("plans.saveError"));
        } finally {
            setUpdating(null);
        }
    };

    if (!entries.length) return <div className="habitOverviewEmpty">
        <SectionArt theme="plans" mini/>
        <p>{t(view === "plans" ? "plans.emptyDay" : "plans.emptyTimeline")}</p>
    </div>;

    return <div className="habitOverviewTimeline">
        {entries.map(entry => <div className="habitOverviewEntry" key={entry.key}>
            <button className="habitOverviewEntryMain" type="button"
                onClick={() => openEntry(entry)}>
                <OverviewEntryTag entry={entry}/>
                <span className="habitOverviewEntryInfo">
                    <span className="habitOverviewEntryName">
                        <span className="activityName">{entry.name}</span>
                        <ActivityIndicators part="streak" habit={entry.habit} plan={entry.plan} calendar={calendar}/>
                        {entry.habit?.pinned && <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>}
                        <ActivityIndicators part="aside" habit={entry.habit}
                            progress={entry.habit ? progress[String(entry.habit.id)] : undefined}/>
                    </span>
                    <small>{describeEntrySubtitle(entry, t)}</small>
                </span>
            </button>
            {!readOnly && (entry.kind === "habit" || (entry.plan?.membership_status === "accepted" &&
                (entry.plan?.completion_mode !== "shared" || entry.plan?.is_owner) &&
                entry.plan?.status !== "canceled")) &&
                <button type="button"
                    className={"habitOverviewEntryDone" + (entry.completed ? " completed" : entry.state === "now" ? " now" : "")}
                    disabled={Boolean(updating)}
                    aria-label={t(entry.completed ? "plans.undoCompletion" : "plans.markCompleted")}
                    onClick={() => void complete(entry)}>
                    {entry.completed ? <CheckCircleIcon weight="fill" size={20}/> : <CircleIcon size={20}/>}
                </button>}
        </div>)}
    </div>;
}
