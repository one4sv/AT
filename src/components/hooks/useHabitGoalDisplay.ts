import { useEffect, useState } from "react";
import { useUser } from "./UserHook";

const eventName = "at-habit-goal-display";
const read = (key:string) => {
    try { return localStorage.getItem(key) || ""; }
    catch { return ""; }
};

export function useHabitGoalDisplay(habitId: number | undefined, enabled: boolean) {
    const {user}=useUser();
    const key=enabled && user.id && habitId!==undefined ? "at_goal_display_"+user.id+"_"+habitId : "";
    const [state,setState]=useState<{key:string;value:string}>(()=>({key,value:key?read(key):""}));
    useEffect(()=>{
        if(!key) return;
        const refresh=()=>setState({key,value:read(key)});
        const onStorage=(event:StorageEvent)=>{if(event.key===key) refresh();};
        refresh();
        window.addEventListener(eventName,refresh);
        window.addEventListener("storage",onStorage);
        return ()=>{
            window.removeEventListener(eventName,refresh);
            window.removeEventListener("storage",onStorage);
        };
    },[key]);
    const selected=key ? (state.key===key?state.value:read(key)) : "";
    const select=(value:string)=>{
        if(!key) return;
        try { localStorage.setItem(key,value || "none"); }
        catch { return; }
        setState({key,value:value || "none"});
        window.dispatchEvent(new Event(eventName));
    };
    return {selected,select};
}
