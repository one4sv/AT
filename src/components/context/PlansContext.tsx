import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../ts/api";
import { useUser } from "../hooks/UserHook";

export interface OneOffPlanMember {
    id: string;
    nick: string;
    username: string | null;
    avatar_url: string | null;
    completed: boolean;
    status?: "pending" | "accepted";
    is_owner?: boolean;
}
export interface OneOffPlan {
    id: number;
    owner_id?: string;
    name: string;
    description?: string;
    plan_date: string;
    start_time?: string | null;
    end_time?: string | null;
    timezone?: string;
    place?: string;
    tag?: string | null;
    kind: "personal" | "shared";
    completion_mode?: "personal" | "shared";
    join_mode?: "invite" | "request" | "open";
    visibility?: "nobody" | "contacts" | "all";
    status?: "upcoming" | "completed" | "canceled";
    membership_status?: "pending" | "accepted";
    is_owner?: boolean;
    completed_for_me?: boolean;
    pinned?: boolean;
    completed_count?: number;
    participants_count?: number;
    members?: OneOffPlanMember[];
}
interface PlansContextType {
    plans: OneOffPlan[];
    loadingPlans: boolean;
    refreshPlans: () => Promise<void>;
    upsertPlan: (plan: OneOffPlan) => void;
    setPin: (id: number, pinned: boolean) => Promise<void>;
}
const PlansContext = createContext<PlansContextType | null>(null);

export const PlansProvider = ({ children }: { children: ReactNode }) => {
    const { user, initialLoading } = useUser();
    const accountId = useRef(user.id);
    accountId.current = user.id;
    const requestVersion = useRef(0);
    const [plans, setPlans] = useState<OneOffPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const refreshPlans = useCallback(async () => {
        const requester = accountId.current;
        const version = ++requestVersion.current;
        if (!requester) {
            setPlans([]);
            return;
        }
        setLoadingPlans(true);
        try {
            const res = await api.get("plans");
            if (!res.data.success) throw new Error("Plans could not be loaded");
            if (accountId.current === requester && requestVersion.current === version) setPlans(res.data.plans || []);
        } finally {
            if (accountId.current === requester && requestVersion.current === version) setLoadingPlans(false);
        }
    }, []);

    const upsertPlan = useCallback((plan: OneOffPlan) => {
        requestVersion.current++;
        setPlans(previous => [plan, ...previous.filter(item => item.id !== plan.id)]);
        setLoadingPlans(false);
    }, []);

    const setPin = useCallback(async (id: number, pinned: boolean) => {
        const requester = accountId.current;
        if (!requester) throw new Error("Not authenticated");
        const response = await api.patch("plans/" + id + "/pin", { pinned });
        if (!response.data?.success) throw new Error("Could not pin plan");
        if (accountId.current !== requester) return;
        requestVersion.current++;
        setPlans(previous => previous.map(plan => plan.id === id ? { ...plan, pinned: response.data.pinned } : plan));
        setLoadingPlans(false);
    }, []);

    useEffect(() => {
        if (initialLoading) return;
        requestVersion.current++;
        setPlans([]);
        if (!user.id) {
            setLoadingPlans(false);
            return;
        }
        void refreshPlans().catch(() => {
            if (accountId.current === user.id) setPlans([]);
        });
    }, [user.id, initialLoading, refreshPlans]);

    return <PlansContext.Provider value={{ plans, loadingPlans, refreshPlans, upsertPlan, setPin }}>{children}</PlansContext.Provider>;
};

export default PlansContext;
