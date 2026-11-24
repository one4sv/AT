import { useEffect, useState } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";

export const goalsChanged = () => window.dispatchEvent(new Event("at-goals-updated"));

export function useGoalsWorkspace() {
    const { user } = useUser();
    const [goals,setGoals] = useState<Goal[]>([]);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState(false);
    useEffect(() => {
        let active = true;
        const refresh = () => {
            if (!user.id) {
                setGoals([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            void api.get<{success:boolean;goals:Goal[]}>("goal-workspace").then(({data}) => {
                if (!active) return;
                setGoals(data.goals || []);
                setError(false);
            }).catch(() => { if (active) setError(true); })
              .finally(() => { if (active) setLoading(false); });
        };
        refresh();
        window.addEventListener("at-goals-updated",refresh);
        return () => { active = false; window.removeEventListener("at-goals-updated",refresh); };
    },[user.id]);
    return {goals,loading,error};
}
