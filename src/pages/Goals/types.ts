export type GoalProgressMode = "manual" | "metric" | "milestones" | "combined";
export type GoalStatus = "draft" | "active" | "paused" | "completed" | "canceled" | "archived";

export interface GoalMilestone {
    id: number;
    goal_id: number;
    title: string;
    weight: number;
    position: number;
    completed_at: string | null;
}
export interface GoalLink {
    id: number;
    name: string;
    plan_date?: string;
}
export interface GoalEvent {
    id: number;
    action: string;
    created_at: string;
}
export interface Goal {
    id: number;
    owner_id: string;
    name: string;
    description: string;
    due_date: string | null;
    status: GoalStatus;
    progress_mode: GoalProgressMode;
    manual_progress: number;
    metric_start: number;
    metric_target: number;
    metric_current: number;
    metric_unit: string;
    metric_share: number;
    progress: number;
    milestones?: GoalMilestone[];
    habits?: GoalLink[];
    plans?: GoalLink[];
    events?: GoalEvent[];
}
