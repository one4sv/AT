import { useEffect, useSyncExternalStore } from "react";
import { useUser } from "../hooks/UserHook";
import { useSettings } from "../hooks/SettingsHook";
import { resolveTimeZone, dateInAppZone } from "../ts/utils/dateToStr";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";

export const goalsChanged = () => window.dispatchEvent(new Event("at-goals-updated"));

type Result = {goals:Goal[];loading:boolean;error:boolean};
type Preview = Partial<Goal> | null;
type Store = {preview:(id:number,patch:Preview)=>(saved?:Goal | null)=>void;result:Result;subscribe:(listener:()=>void)=>()=>void;refresh:()=>void;dispose:()=>void};
const empty:Result={goals:[],loading:false,error:false};
const initial:Result={goals:[],loading:true,error:false};
const stores=new Map<string,Store>();
let activeKey="";
const noopSubscribe=()=>()=>{};
function storeFor(key:string,zone:string):Store {
    const old=stores.get(key);
    if(old) return old;
    let controller:AbortController | null=null;
    let pending=false;
    let timer:ReturnType<typeof setTimeout> | undefined;
    let tick:ReturnType<typeof setInterval> | undefined;
    let fetchedAt=0;
    let day=dateInAppZone(new Date());
    const listeners=new Set<()=>void>();
    let confirmed=initial;
    let version=0;
    const previews=new Map<symbol,{id:number;patch:Preview}>();
    const publish=()=>{
        let goals=confirmed.goals;
        for(const {id,patch} of previews.values()){
            goals=patch===null ? goals.filter(goal=>goal.id!==id) : goals.map(goal=>goal.id===id?{...goal,...patch}:goal);
        }
        store.result={...confirmed,goals};
        listeners.forEach(fn=>fn());
    };
    const onFocus=()=>{if(document.visibilityState==="visible") store.refresh();};
    const stop=()=>{
        window.removeEventListener("at-goals-updated",store.refresh);
        window.removeEventListener("focus",onFocus);
        document.removeEventListener("visibilitychange",onFocus);
        if(tick!==undefined){clearInterval(tick);tick=undefined;}
    };
    const store:Store={result:initial,preview:(id,patch)=>{
        const token=Symbol();
        previews.set(token,{id,patch});
        publish();
        return saved=>{
            previews.delete(token);
            if(saved!==undefined){
                version++;
                const goals=confirmed.goals.filter(goal=>goal.id!==id);
                confirmed={...confirmed,goals:saved===null ? goals : confirmed.goals.some(goal=>goal.id===id)
                    ? confirmed.goals.map(goal=>goal.id===id?saved:goal) : [saved,...goals]};
            }
            publish();
        };
    },subscribe:listener=>{
        listeners.add(listener);
        if(listeners.size===1){
            window.addEventListener("at-goals-updated",store.refresh);
            window.addEventListener("focus",onFocus);
            document.addEventListener("visibilitychange",onFocus);
            tick=setInterval(()=>{
                if(document.visibilityState!=="visible")return;
                const next=dateInAppZone(new Date());
                if(next!==day || store.result.goals.some(g=>g.status==="active" && g.progress_mode==="daily_timer")){
                    day=next;store.refresh();
                }
            },60000);
            if(!controller && (!fetchedAt || Date.now()-fetchedAt>60000 || store.result.error))store.refresh();
        }
        return ()=>{listeners.delete(listener);if(!listeners.size)stop();};
    },refresh:()=>{
        if(timer!==undefined) clearTimeout(timer);
        timer=setTimeout(()=>{
            timer=undefined;
            if(controller){pending=true;return;}
            controller=new AbortController();
            const signal=controller.signal;
            const requestVersion=version;
            void api.get<{success:boolean;goals:Goal[]}>("goal-workspace",{signal,params:{timezone:zone}}).then(({data})=>{
                if(!signal.aborted){
                    if(!data.success) throw new Error("Goals could not be loaded");
                    if(requestVersion!==version){pending=true;return;}
                    fetchedAt=Date.now();
                    confirmed={goals:data.goals || [],loading:false,error:false};
                }
            }).catch(()=>{
                if(!signal.aborted) confirmed={...confirmed,loading:false,error:true};
            }).finally(()=>{
                if(signal.aborted) return;
                controller=null;
                publish();
                if(pending){pending=false;if(listeners.size)store.refresh();}
            });
        },120);
    },dispose:()=>{
        stop();
        if(timer!==undefined) clearTimeout(timer);
        controller?.abort();
    }};
    stores.set(key,store);
    return store;
}
export function previewGoal(userId:string | null,id:number,patch:Preview){
    const entries=userId ? [...stores.entries()].filter(([key])=>key.startsWith(userId+"|")) : [];
    const finish=entries.map(([,store])=>store.preview(id,patch));
    return (goal?:Goal | null)=>{
        const saved=goal?.habits ? {...goal,habit_ids:goal.habits.map(h=>h.id)} : goal;
        finish.forEach(apply=>apply(saved));
    };
}
export function useGoalsWorkspace(enabled=true){
    const {user}=useUser();
    const {timeZone}=useSettings();
    const zone=resolveTimeZone(timeZone);
    const key=user.id ? user.id+"|"+zone : "";
    const store=enabled && key ? storeFor(key,zone) : null;
    useEffect(()=>{
        if(activeKey!==key){
            for(const [id,entry] of stores) if(id!==key){entry.dispose();stores.delete(id);}
            activeKey=key;
        }
    },[key]);
    return useSyncExternalStore(store?.subscribe || noopSubscribe,()=>store?.result || empty,()=>empty);
}
