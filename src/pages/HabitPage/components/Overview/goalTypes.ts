export type GoalMode = "manual" | "metric" | "milestones" | "combined" | "days" | "streak" | "daily_timer" | "daily_counter";
export type GoalStatus = "active" | "paused" | "completed" | "canceled" | "archived";
export interface GoalStage {
    id: number;
    goal_id: number;
    title: string;
    weight: number;
    position: number;
    completed_at: string | null;
}
export interface GoalLinkedItem {
    id: number;
    name: string;
}
export interface GoalEvent {
    id: number;
    action: string;
    details: Record<string, unknown> | null;
    created_at: string;
}
export interface Goal {
    id: number;
    name: string;
    description: string;
    due_date: string | null;
    progress_mode: GoalMode;
    status: GoalStatus;
    manual_progress: number;
    metric_start: number;
    metric_target: number;
    metric_current: number;
    metric_unit: string;
    metric_share: number;
    progress: number;
    target_days?: number;
    daily_minutes?: number;
    achieved_days?: number;
    today_progress?: number | null;
    today_current?: number | null;
    today_target?: number | null;
    auto_complete?: boolean;
    auto_completed?: boolean;
    reminder_days?: number | null;
    completed_at?: string | null;
    habit_ids?: number[];
    stages?: GoalStage[];
    habits?: GoalLinkedItem[];
    plans?: GoalLinkedItem[];
    events?: GoalEvent[];
}
