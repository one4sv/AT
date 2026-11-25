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
    owner_id?: string;
    shared_habit_id?: number | null;
    template_goal_id?: number | null;
    can_edit?: boolean;
    can_progress?: boolean;
    can_manage_definition?: boolean;
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
    plan_ids?: number[];
    recent_stages?: GoalStage[];
    recent_records?: GoalRecord[];
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

export function previewGoalProgress(goal:Goal):number {
    const clamp=(value:number)=>Math.min(100, Math.max(0,value));
    const {progress_mode:mode,metric_target:target,metric_start:start,metric_current:current}=goal;
    const metric=target===start ? 0 : clamp((current-start)/(target-start)*100);
    const stages=goal.stages || [];
    const completed=stages.filter(stage=>stage.completed_at);
    const weights=stages.reduce((sum,stage)=>sum+Number(stage.weight),0);
    const percentages=stagePercentages(stages);
    const milestones=stages.some(stage=>stage.completion_percent!=null)
        ? Math.max(0,...completed.map(stage=>percentages.get(stage.id) ?? 0))
        : weights ? completed.reduce((sum,stage)=>sum+Number(stage.weight),0)/weights*100 : 0;
    const progress=mode==="manual" ? goal.manual_progress : mode==="metric" ? metric :
        mode==="milestones" ? milestones : mode==="combined" ? metric*goal.metric_share+milestones*(1-goal.metric_share) : goal.progress;
    return Math.round(clamp(progress)*100)/100;
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

export interface GoalRecord {
    id:string;
    kind:"timer" | "counter" | "day" | "progress";
    date:string;
    seconds?:number;
    value?:number;
}

export const goalMatchesHabitScope=(goal:Goal,habitId:number,scope?:string)=>scope==="shared"?String(goal.shared_habit_id)===String(habitId):!goal.shared_habit_id;

// An unset device uses the first eligible goal; an explicit "none" stays hidden.
export function resolvePinnedGoal(goals:Goal[],selected:string) {
    if(selected==="none")return undefined;
    return goals.find(goal=>String(goal.id)===selected) ?? [...goals].sort((a,b)=>a.id-b.id)[0];
}
