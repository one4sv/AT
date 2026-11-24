export type GoalMode = "manual" | "metric" | "milestones" | "combined" | "days" | "streak" | "daily_timer";
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
    tracking_habit_id?: number | null;
    tracking_days?: number;
    tracking_minutes?: number;
    tracking_start?: string | null;
    tracking_timezone?: string;
    tracked_days?: number;
    stages?: GoalStage[];
    habits?: GoalLinkedItem[];
    plans?: GoalLinkedItem[];
    events?: GoalEvent[];
}
