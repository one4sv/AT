import { createContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import type { HabitSettings } from "./TheHabitContext";
import { useUser } from "../hooks/UserHook";
import { api } from "../ts/api";
export type HabitPermission = "owner" | "members" | "roles";
export interface HabitAccess {
    is_owner: boolean;
    is_member: boolean;
    can_view: boolean;
    can_complete: boolean;
    can_comment: boolean;
    can_edit_blocks: boolean;
    can_edit_info: boolean;
    can_invite: boolean;
    completion_start_date?: string | null;
}
export interface Habit {
    avatar_key?: string | null;
    access?: HabitAccess;
    complete_permission?: HabitPermission;
    comment_permission?: HabitPermission;
    edit_blocks_permission?: HabitPermission;
    edit_info_permission?: HabitPermission;
    invite_permission?: HabitPermission;
    id: number;
    name: string;
    desc: string | "";
    start_date: string;
    end_date: string | "";
    ongoing: boolean;
    periodicity: "everyday" | "weekly" | "sometimes" | "cycle";
    chosen_days: number[] | null;
    start_time: string | "";
    end_time: string | "";
    created_at: Date;
    tag: string | "";
    pinned: boolean;
    done?: boolean;
    user_id: string;
    habits_settings: HabitSettings;
    cycle_days_active: number;
    cycle_days_rest: number;
    chat_id: number | null;
    chat_participation_mode?: "required" | "optional";
    goal_scope?: "personal" | "shared";
    goal_completion_mode?: "personal" | "shared";
    metric_progress_mode?: "personal" | "shared";
    completion_mode?: "personal" | "shared";
    schedule_blocks_mode?: "personal" | "shared";
    members_can_edit_blocks?: boolean;
    members_can_edit_info?: boolean;
    members_can_invite?: boolean;
}
interface HabitResponse {
    success: boolean;
    habitsArr?: Habit[];
    error?: string;
    cookie?: boolean;
}
type QuickFields = Partial<Pick<Habit,"pinned" | "ongoing">> & {end_date?:string | null};
export interface HabitContextType {
    pendingHabit: (id:number) => QuickFields | undefined;
    saveQuickFields: (id:number,fields:QuickFields,onSaved:()=>Promise<void>) => Promise<void>;
    habits: Habit[] | null;
    loadingHabits: boolean;
    refetchHabits: () => Promise<void>;
    refetchHabitsWLoading: () => Promise<void>;
    newOrderHabits: string[] | undefined;
}
const HabitsContext = createContext<HabitContextType | null>(null);
export const HabitsProvider = ({
    children
}: {
    children: ReactNode;
}) => {
    const { showNotification } = useNote();
    const {
        user,
        initialLoading
    } = useUser();
    const [confirmedHabits, setHabits] = useState<Habit[] | null>(null);
    const [loadingHabits, setLoadingHabits] = useState(true);
    const [newOrderHabits, setNewOrderHabits] = useState<string[] | undefined>();
    const account = useRef(user.id);
    account.current = user.id;
    const pendingKeys = useRef(new Set<string>());
    const [pending,setPending] = useState<Record<string,QuickFields>>({});
    const pendingHabit = (id:number) => pending[user.id + ":" + id];
    const habits = useMemo(() => confirmedHabits?.map(habit => {
        const patch = pendingHabit(habit.id);
        return patch ? {...habit,...patch,end_date:"end_date" in patch ? patch.end_date ?? "" : habit.end_date} : habit;
    }) ?? null, [confirmedHabits,pending,user.id]);
    const saveQuickFields = async (id:number,fields:QuickFields,onSaved:()=>Promise<void>) => {
        const requester = user.id;
        const key = requester + ":" + id;
        if (!requester || pendingKeys.current.has(key)) return;
        pendingKeys.current.add(key);
        setPending(previous => ({...previous,[key]:fields}));
        try {
            const {data} = await api.post("updatehabit",{habit_id:id,table:"habits",...fields});
            if (!data.success) throw new Error("Activity update failed");
            if (requester !== account.current) return;
            await onSaved();
        } finally {
            pendingKeys.current.delete(key);
            setPending(previous => {
                const next = {...previous};
                delete next[key];
                return next;
            });
        }
    };
    const refetchHabits = useCallback(
        async () => {
            try {
                const res = await api.get<HabitResponse>(`habits`);
                if (res.data.success && res.data.habitsArr) {
                    setHabits(res.data.habitsArr);
                } else {
                    setHabits(null);
                }
            } catch (err) {
                setHabits(null);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status !== 401 && err.response?.status !== 403) {
                        showNotification("error", err.response?.data?.error || "Ошибка запроса");
                    }
                }
            } finally {
                setLoadingHabits(false);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [user]
    );
    const refetchHabitsWLoading = async () => {
        setLoadingHabits(true);
        await refetchHabits();
    };

    useEffect(
        () => {
            if (initialLoading) {
                setHabits(null);
                return;
            }
            if (!user.nick) {
                setHabits(null);
                setLoadingHabits(false);
                return;
            }
            refetchHabits();
        },
        [initialLoading, user.nick, refetchHabits]
    );

    useEffect(
        () => {
            const weekOrder: string[] = [];
            weekOrder.push("today");
            weekOrder.push("tomorrow");
            for (let i = 2;i <= 6;i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                weekOrder.push(`${yyyy}-${mm}-${dd}`);
            }
            let newOrder = ["everyday", ...weekOrder, "sometimes"];
            if (habits?.find(h => h.pinned)) newOrder = ["pinned", ...newOrder];
            setNewOrderHabits(newOrder);
        },
        [habits]
    );

    return (
        <HabitsContext.Provider
            value={{
                habits, pendingHabit, saveQuickFields,
                loadingHabits,
                refetchHabits,
                newOrderHabits,
                refetchHabitsWLoading
            }}
        >
            {children}
        </HabitsContext.Provider>
    );
};
export default HabitsContext;
