import { useEffect, useState } from "react";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";

export const goalsChanged = () => window.dispatchEvent(new Event("at-goals-updated"));

export function useGoalsWorkspace(enabled = true) {
    const { user } = useUser();
    const [result, setResult] = useState<{owner: string; goals: Goal[]; error: boolean} | null>(null);
    const owner = enabled ? user.id : null;
    useEffect(() => {
        if (!owner) return;
        const controller = new AbortController();
        let version = 0;
        const refresh = () => {
            const request = ++version;
            void api.get<{success:boolean;goals:Goal[]}>("goal-workspace", {signal: controller.signal}).then(({data}) => {
                if (controller.signal.aborted || request !== version) return;
                if (!data.success) throw new Error("Goals could not be loaded");
                setResult({owner, goals:data.goals || [], error:false});
            }).catch(() => {
                if (controller.signal.aborted || request !== version) return;
                setResult(previous => ({owner, goals:previous?.owner === owner ? previous.goals : [], error:true}));
            });
        };
        refresh();
        window.addEventListener("at-goals-updated", refresh);
        return () => { controller.abort(); window.removeEventListener("at-goals-updated", refresh); };
    }, [owner]);
    const current = owner && result?.owner === owner ? result : null;
    return {goals:current?.goals || [], loading:!!owner && !current, error:current?.error || false};
}
