import { useEffect, useSyncExternalStore } from "react";
import { useUser } from "../hooks/UserHook";
import { useSettings } from "../hooks/SettingsHook";
import { resolveTimeZone } from "../ts/utils/dateToStr";
import { api } from "../ts/api";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";

export const goalsChanged = () => window.dispatchEvent(new Event("at-goals-updated"));

type Result = {goals:Goal[];loading:boolean;error:boolean};
type Store = {result:Result;listeners:Set<()=>void>;refresh:()=>void;dispose:()=>void};
const empty:Result={goals:[],loading:false,error:false};
const initial:Result={goals:[],loading:true,error:false};
const stores=new Map<string,Store>();
let activeKey="";
function storeFor(key:string,zone:string):Store {
    const old=stores.get(key);
    if(old) return old;
    let controller:AbortController | null=null;
    let pending=false;
    let timer:ReturnType<typeof setTimeout> | undefined;
    const store:Store={result:initial,listeners:new Set(),refresh:()=>{
        if(timer!==undefined) clearTimeout(timer);
        timer=setTimeout(()=>{
            timer=undefined;
            if(controller){pending=true;return;}
            controller=new AbortController();
            const signal=controller.signal;
            void api.get<{success:boolean;goals:Goal[]}>("goal-workspace",{signal,params:{timezone:zone}}).then(({data})=>{
                if(!signal.aborted){
                    if(!data.success) throw new Error("Goals could not be loaded");
                    store.result={goals:data.goals || [],loading:false,error:false};
                }
            }).catch(()=>{
                if(!signal.aborted) store.result={...store.result,loading:false,error:true};
            }).finally(()=>{
                if(signal.aborted) return;
                controller=null;
                store.listeners.forEach(fn=>fn());
                if(pending){pending=false;store.refresh();}
            });
        },120);
    },dispose:()=>{
        if(timer!==undefined) clearTimeout(timer);
        controller?.abort();
    }};
    stores.set(key,store);
    return store;
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
        if(!store) return;
        if(store.result.loading) store.refresh();
    },[key,store]);
    useEffect(()=>{
        if(!store) return;
        const refresh=()=>store.refresh();
        const onFocus=()=>{if(document.visibilityState==="visible") refresh();};
        window.addEventListener("at-goals-updated",refresh);
        window.addEventListener("focus",refresh);
        document.addEventListener("visibilitychange",onFocus);
        const tick=setInterval(()=>{
            if(document.visibilityState==="visible" && store.result.goals.some(g=>g.status==="active" && g.progress_mode==="daily_timer")) refresh();
        },60000);
        return ()=>{
            window.removeEventListener("at-goals-updated",refresh);
            window.removeEventListener("focus",refresh);
            document.removeEventListener("visibilitychange",onFocus);
            clearInterval(tick);
        };
    },[store]);
    return useSyncExternalStore(
        listener=>{store?.listeners.add(listener);return ()=>{store?.listeners.delete(listener);};},
        ()=>store?.result || empty,
        ()=>empty
    );
}
