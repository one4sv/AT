import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, CircleIcon, PushPinIcon } from "@phosphor-icons/react";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { useDone } from "../../../../components/hooks/DoneHook";
import { usePlans } from "../../../../components/hooks/PlansHook";
import { useBlackout } from "../../../../components/hooks/BlackoutHook";
import { describeDayTime, type DayEntry } from "../../../../components/ts/utils/dayTimeline";
import { api } from "../../../../components/ts/api";
import SectionArt from "../../../../components/ts/SectionArt";
import ActivityIndicators from "../../../../components/ts/ActivityIndicators";
import { tags } from "../../../../components/ts/tags";
import useHabitDayProgress from "../../../../components/hooks/utils/useHabitDayProgress";

function OverviewEntryTag({ entry }: { entry: DayEntry }) {
    const tag = tags.find(item => item.value === (entry.kind === "plan" ? entry.plan?.tag : entry.habit?.tag));
    const Icon = tag?.icon;
    return Icon ? <Icon className="habitOverviewEntryTagIcon" size={20}/> :
        <span className={"calendarDot " + entry.state}/>;
}

export default function HabitOverviewEntries({ entries, view = "all" }: {
    entries: DayEntry[];
    view?: "all" | "activities" | "plans";
}) {
    const { t } = useTranslation("common");
    const { chosenDay, calendar } = useCalendar();
    const progress = useHabitDayProgress(chosenDay);
    const { markDone } = useDone();
    const { refreshPlans } = usePlans();
    const { blackout, setBlackout } = useBlackout();
    const navigate = useNavigate();
    const [updating, setUpdating] = useState<string | null>(null);

    const openEntry = (entry: DayEntry) => {
        if (blackout.module === "HabitOverviewList") setBlackout({ seted: false });
        navigate(entry.kind === "plan" ? "/plan/" + entry.plan!.id : "/habit/" + entry.habit!.id);
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
            const response = await api.post("plans/" + entry.plan!.id + "/complete", {
                completed: !entry.completed
            });
            if (response.data?.success) await refreshPlans();
        } catch (error) {
            console.error("Failed to complete plan", error);
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
                        <ActivityIndicators part="streak" habit={entry.habit} calendar={calendar}/>
                        {entry.habit?.pinned && <PushPinIcon className="pinnedHabitSign" weight="fill" size={14}/>}
                        <ActivityIndicators part="aside" habit={entry.habit} plan={entry.plan}
                            progress={entry.habit ? progress[String(entry.habit.id)] : undefined}/>
                    </span>
                    <small>{describeDayTime(entry, t)}</small>
                </span>
            </button>
            {(entry.kind === "habit" || (entry.plan?.membership_status === "accepted" &&
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
