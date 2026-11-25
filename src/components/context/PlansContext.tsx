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
    avatar_key?: string | null;
    kind: "personal" | "shared";
    completion_mode?: "personal" | "shared";
    join_mode?: "invite" | "request" | "open";
    visibility?: "inherit" | "nobody" | "contacts" | "all" | "link";
    share_token?: string;
    share?: string;
    status?: "upcoming" | "completed" | "canceled";
    membership_status?: "pending" | "accepted";
    is_owner?: boolean;
    can_complete?: boolean;
    can_comment?: boolean;
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
    pendingPlans: Record<number,Partial<OneOffPlan>>;
    writePlan: (id:number, patch:Partial<OneOffPlan>, send:()=>Promise<Partial<OneOffPlan>>) => Promise<void>;
    setCompleted: (plan: OneOffPlan, completed: boolean) => Promise<void>;
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
    const [pendingPlans,setPendingPlans] = useState<Record<number,Partial<OneOffPlan>>>({});
    const pendingWrites = useRef(new Set<string>());
    const writePlan = useCallback(async (id:number, patch:Partial<OneOffPlan>, send:()=>Promise<Partial<OneOffPlan>>) => {
        const requester = accountId.current;
        if (!requester) throw new Error("Not authenticated");
        const key = requester + ":" + id;
        if (pendingWrites.current.has(key)) throw new Error("Plan is being saved");
        pendingWrites.current.add(key);
        setPendingPlans(previous => ({...previous,[id]:patch}));
        try {
            const saved = await send();
            if (accountId.current !== requester) return;
            requestVersion.current++;
            setPlans(previous => previous.map(plan => plan.id === id ? {...plan,...saved} : plan));
            setLoadingPlans(false);
        } finally {
            pendingWrites.current.delete(key);
            if (accountId.current === requester) setPendingPlans(previous => {
                const next = {...previous};
                delete next[id];
                return next;
            });
        }
    }, []);
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
        await writePlan(id,{pinned},async () => {
            const response = await api.patch("plans/" + id + "/pin", { pinned });
            if (!response.data?.success) throw new Error("Could not pin plan");
            return {pinned:response.data.pinned};
        });
    }, [writePlan]);

    const setCompleted = useCallback(async (plan:OneOffPlan,completed:boolean) => {
        const planUser = accountId.current;
        const change = Number(completed)-Number(Boolean(plan.completed_for_me));
        const patch:Partial<OneOffPlan> = {completed_for_me:completed,completed_count:Math.max(0,(plan.completed_count ?? 0)+change)};
        if (plan.completion_mode === "shared") patch.status = completed ? "completed" : "upcoming";
        await writePlan(plan.id,patch,async () => {
            const response = await api.post("plans/" + plan.id + "/complete", {completed});
            if (!response.data?.success || !response.data.plan) throw new Error("Could not update completion");
            if (accountId.current === planUser) window.dispatchEvent(new CustomEvent("plan-updated",{detail:{id:plan.id,plan:response.data.plan}}));
            return response.data.plan;
        });
    }, [writePlan]);

    useEffect(() => {
        if (initialLoading) return;
        setPendingPlans({});
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

    useEffect(() => {
        if (initialLoading || !user.id) return;
        let lastRefresh = 0;
        const refreshOnResume = () => {
            if (document.visibilityState !== "visible" || Date.now() - lastRefresh < 1500) return;
            lastRefresh = Date.now();
            void refreshPlans().catch(() => {});
        };
        window.addEventListener("focus", refreshOnResume);
        document.addEventListener("visibilitychange", refreshOnResume);
        return () => {
            window.removeEventListener("focus", refreshOnResume);
            document.removeEventListener("visibilitychange", refreshOnResume);
        };
    }, [initialLoading, user.id, refreshPlans]);

    const visiblePlans = plans.map(plan => pendingPlans[plan.id] ? {...plan,...pendingPlans[plan.id]} : plan);
    return <PlansContext.Provider value={{ plans: visiblePlans, pendingPlans, loadingPlans, refreshPlans, upsertPlan, setPin, setCompleted, writePlan }}>{children}</PlansContext.Provider>;
};

export default PlansContext;
