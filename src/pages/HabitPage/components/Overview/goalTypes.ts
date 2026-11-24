export type GoalMode = "manual" | "metric" | "milestones" | "combined" | "days" | "streak" | "daily_timer" | "daily_counter" | "total_timer";
export type GoalStatus = "active" | "paused" | "completed" | "canceled" | "archived";
export interface GoalStage {
    id: number;
    goal_id: number;
    title: string;
    weight: number;
    completion_percent?: number | null;
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
    achieved_minutes?: number;
    today_progress?: number | null;
    today_current?: number | null;
    today_target?: number | null;
    repeat_frequency?: GoalRepeat;
    repeat_period_start?: string | null;
    repeat_next_at?: string | null;
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

export const goalHabitMetric = (mode:GoalMode) => mode==="daily_timer" || mode==="total_timer" ? "timer" : mode==="daily_counter" ? "counter" : null;
export const goalMetricCompatible = (mode:GoalMode,metricType:string | undefined) => !goalHabitMetric(mode) || goalHabitMetric(mode)===metricType;

export function stagePercentages(stages:GoalStage[]) {
    const total=stages.reduce((sum,stage)=>sum+Number(stage.weight),0);
    let cumulative=0;
    const result=new Map<number,number>();
    for(const stage of [...stages].sort((a,b)=>a.position-b.position || a.id-b.id)) {
        cumulative+=Number(stage.weight);
        result.set(stage.id,stage.completion_percent==null ? (total?Math.round(cumulative/total*10000)/100:0) : Number(stage.completion_percent));
    }
    return result;
}

// /habits returns both the joined relation (array) and the normalized settings object.
export function goalHabitMetricType(habit?: {settings?:{metric_type?:string} | null;habits_settings?:{metric_type?:string} | {metric_type?:string}[] | null}) {
    const relation=habit?.habits_settings;
    return habit?.settings?.metric_type ?? (Array.isArray(relation)?relation[0]?.metric_type:relation?.metric_type);
}

export type GoalRepeat = "none" | "daily" | "weekly" | "monthly";
export interface GoalPeriod {
    id:number;
    frequency:GoalRepeat;
    period_start:string;
    period_end:string;
    progress:number;
    completed:boolean;
    closed_at:string;
}
export const goalIsCurrent=(goal:Goal)=>goal.status==="active" || goal.status==="paused" || (goal.status==="completed" && Boolean(goal.repeat_next_at));
