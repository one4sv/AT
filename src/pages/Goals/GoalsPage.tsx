import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, TargetIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useBlackout } from "../../components/hooks/BlackoutHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import { useUser } from "../../components/hooks/UserHook";
import { api } from "../../components/ts/api";
import type { Goal, GoalStatus } from "./types";
import "./scss/GoalsPage.scss";

export default function GoalsPage() {
    const { t } = useTranslation("common");
    const { user } = useUser();
    const { setTitle } = usePageTitle();
    const { setBlackout } = useBlackout();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState<GoalStatus | "all">("all");

    useEffect(() => { setTitle(t("goals.title")); }, [setTitle, t]);
    useEffect(() => {
        if (!user.id) {
            setGoals([]);
            setLoading(false);
            return;
        }
        let mounted = true;
        const load = () => {
            if (mounted) setLoading(true);
            void api.get<{success:boolean; goals:Goal[]}>("goals").then(({data}) => {
                if (!mounted) return;
                setGoals(data.goals || []);
                setError(false);
            }).catch(() => {
                if (mounted) setError(true);
            }).finally(() => {
                if (mounted) setLoading(false);
            });
        };
        load();
        window.addEventListener("goals-updated", load);
        return () => { mounted = false; window.removeEventListener("goals-updated", load); };
    }, [user.id]);

    const visible = goals.filter(goal => filter === "all" || goal.status === filter);
    return <div className="goalsPage">
        <div className="goalsHeading">
            <h1>{t("goals.title")}</h1>
            <button type="button" className="planPrimaryButton" onClick={() =>
                setBlackout({ seted:true, module:"AddGoal" })}><PlusIcon/>{t("goals.create")}</button>
        </div>
        <div className="goalsFilters">
            {(["all", "active", "completed", "archived"] as const).map(status =>
                <button type="button" key={status} className={"goalQuietButton " + (filter === status ? "selected" : "")}
                    onClick={() => setFilter(status)}>{t("goals.status." + status)}</button>)}
        </div>
        {!user.id ? <p>{t("goals.signIn")}</p> :
            loading ? <p>{t("goals.loading")}</p> :
            error ? <p>{t("goals.loadError")}</p> :
            !visible.length ? <div className="goalEmpty"><TargetIcon size={32}/>{t("goals.empty")}</div> :
            <div className="goalsList">{visible.map(goal => <Link to={"/goal/" + goal.id} key={goal.id} className="goalCard">
                <div className="goalCardHead">
                    <span>{goal.name}</span>
                    <small>{t("goals.status." + goal.status)}</small>
                </div>
                <div className="goalProgressTrack"><div style={{width:goal.progress + "%"}}/></div>
                <div className="goalCardFoot"><span>{goal.due_date || t("goals.noDueDate")}</span><span>{goal.progress}%</span></div>
            </Link>)}</div>}
    </div>;
}
