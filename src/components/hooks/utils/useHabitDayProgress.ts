import { useEffect, useState } from "react";
import { useUser } from "../UserHook";
import { api } from "../../ts/api";
import type { HabitDayProgressMap } from "../../ts/ActivityIndicators";

export default function useHabitDayProgress(date: string) {
    const { user } = useUser();
    const [progress, setProgress] = useState<HabitDayProgressMap>({});
    useEffect(() => {
        if (!user.id || !date) {
            setProgress({});
            return;
        }
        const controller = new AbortController();
        const load = () => {
            void api.get("habits/day-progress", { params: { date }, signal: controller.signal }).then(response => {
                if (!controller.signal.aborted && response.data?.success) {
                    setProgress(response.data.progress || {});
                }
            }).catch(error => {
                if (!controller.signal.aborted) {
                    console.error("Unable to load habit participant progress", error);
                    setProgress({});
                }
            });
        };
        setProgress({});
        load();
        window.addEventListener("habit-progress-updated", load);
        window.addEventListener("habit-members-updated", load);
        window.addEventListener("focus", load);
        return () => {
            controller.abort();
            window.removeEventListener("habit-progress-updated", load);
            window.removeEventListener("habit-members-updated", load);
            window.removeEventListener("focus", load);
        };
    }, [date, user.id]);
    return progress;
}
