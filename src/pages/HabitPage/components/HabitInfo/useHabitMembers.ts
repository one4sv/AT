import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../components/ts/api";
import type { HabitAccess } from "../../../../components/context/HabitsContext";

export interface HabitUser {
    id: string;
    nick: string;
    username: string | null;
    avatar_url: string | null;
}
export interface HabitMembership {
    user_id: string;
    status: "pending" | "accepted" | "declined";
    user: HabitUser | null;
}
export interface HabitMembersData {
    owner: HabitUser;
    owner_id: string;
    members: HabitMembership[];
    member_count: number;
    chat: { id: number; name: string; avatar_url: string | null } | null;
    my_role: string | null;
    access: HabitAccess;
}

export default function useHabitMembers(habitId?: number) {
    const [ data, setData ] = useState<HabitMembersData | null>(null);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState("");
    const load = useCallback(async (signal?: AbortSignal) => {
        if (!habitId) return;
        try {
            const res = await api.get(`habits/${habitId}/members`, { signal });
            if (!res.data.success) throw new Error();
            if (!signal?.aborted) {
                setData(res.data);
                setError("");
            }
        } catch {
            if (!signal?.aborted) setError("Не удалось загрузить участников");
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [habitId]);
    useEffect(() => {
        const controller = new AbortController();
        setData(null);
        setLoading(true);
        void load(controller.signal);
        const reload = () => { void load(controller.signal); };
        window.addEventListener("habit-members-updated", reload);
        window.addEventListener("focus", reload);
        return () => {
            controller.abort();
            window.removeEventListener("habit-members-updated", reload);
            window.removeEventListener("focus", reload);
        };
    }, [load]);
    return { data, loading, error, reload: load };
}
