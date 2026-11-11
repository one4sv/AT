import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../ts/api";
import { useUser } from "../hooks/UserHook";

export interface OneOffPlanMember {
    id: string;
    nick: string;
    username: string | null;
    avatar_url: string | null;
    completed: boolean;
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
    kind: "personal" | "shared";
    completion_mode?: "personal" | "shared";
    join_mode?: "invite" | "request" | "open";
    visibility?: "nobody" | "contacts" | "all";
    status?: "upcoming" | "completed" | "canceled";
    membership_status?: "pending" | "accepted";
    is_owner?: boolean;
    completed_for_me?: boolean;
    completed_count?: number;
    participants_count?: number;
    members?: OneOffPlanMember[];
}
interface PlansContextType {
    plans: OneOffPlan[];
    loadingPlans: boolean;
    refreshPlans: () => Promise<void>;
}
const PlansContext = createContext<PlansContextType | null>(null);

export const PlansProvider = ({ children }: { children: ReactNode }) => {
    const { user, initialLoading } = useUser();
    const accountId = useRef(user.id);
    accountId.current = user.id;
    const [plans, setPlans] = useState<OneOffPlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const refreshPlans = useCallback(async () => {
        const requester = accountId.current;
        if (!requester) {
            setPlans([]);
            return;
        }
        setLoadingPlans(true);
        try {
            const res = await api.get("plans");
            if (!res.data.success) throw new Error("Plans could not be loaded");
            if (accountId.current === requester) setPlans(res.data.plans || []);
        } finally {
            if (accountId.current === requester) setLoadingPlans(false);
        }
    }, []);

    useEffect(() => {
        if (initialLoading) return;
        setPlans([]);
        if (!user.id) {
            setLoadingPlans(false);
            return;
        }
        void refreshPlans().catch(() => {
            if (accountId.current === user.id) setPlans([]);
        });
    }, [user.id, initialLoading, refreshPlans]);

    return <PlansContext.Provider value={{ plans, loadingPlans, refreshPlans }}>{children}</PlansContext.Provider>;
};

export default PlansContext;
