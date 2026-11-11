import { createContext, useState, useEffect, useCallback } from "react";
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
export interface HabitContextType {
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
    const [habits, setHabits] = useState<Habit[] | null>(null);
    const [loadingHabits, setLoadingHabits] = useState(true);
    const [newOrderHabits, setNewOrderHabits] = useState<string[] | undefined>();
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
                habits,
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
