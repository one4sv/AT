import type { Goal } from "../../HabitPage/components/Overview/goalTypes";
export type GoalSnapshot = {name:string; progress:number; due:string | null; stages:{title:string;done:boolean}[]};
function sanitize(raw: unknown): GoalSnapshot | null {
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Partial<GoalSnapshot>;
    if (typeof data.name !== "string" || !data.name.trim() || typeof data.progress !== "number" || !Number.isFinite(data.progress)) return null;
    return {name:data.name.trim().slice(0,120), progress:Math.round(Math.min(100,Math.max(0,data.progress))*100)/100,
        due:typeof data.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.due) ? data.due : null,
        stages:Array.isArray(data.stages)?data.stages.filter(stage=>stage && typeof stage.title==="string").slice(0,30).map(stage=>({title:stage.title.slice(0,120),done:stage.done===true})):[]};
}
export function goalSnapshotLink(goal: Goal, origin: string) {
    const snapshot = sanitize({name:goal.name,progress:Number(goal.progress),due:goal.due_date,stages:(goal.stages || goal.recent_stages || []).map(stage=>({title:stage.title,done:Boolean(stage.completed_at)}))});
    if(!snapshot)return null;
    const url=new URL("/habit",origin);
    url.searchParams.set("goalShare",JSON.stringify(snapshot));
    return url.href;
}
export function parseSharedGoalLink(href:string,origin:string) {
    try {
        const url=new URL(href);
        if(!["http:","https:"].includes(url.protocol)||url.username||url.password||(url.origin!==origin&&url.origin!=="https://achievetogether.vercel.app")||url.pathname!=="/habit"||url.searchParams.size!==1||url.hash)return null;
        const data=url.searchParams.get("goalShare");
        return data&&data.length<=12000?sanitize(JSON.parse(data)):null;
    }catch{return null;}
}
