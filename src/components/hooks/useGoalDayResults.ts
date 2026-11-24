import { useEffect, useState } from "react";
import { useUser } from "./UserHook";
import { useSettings } from "./SettingsHook";
import { api } from "../ts/api";
import { resolveTimeZone } from "../ts/utils/dateToStr";
import type { Goal } from "../../pages/HabitPage/components/Overview/goalTypes";

export default function useGoalDayResults(day:string,goals:Goal[],enabled=true) {
    const {user}=useUser();
    const {timeZone}=useSettings();
    const zone=resolveTimeZone(timeZone);
    const key=enabled && user.id?user.id+"|"+day+"|"+zone:"";
    const [result,setResult]=useState<{key:string;ids:string[];error:boolean}>({key:"",ids:[],error:false});
    useEffect(()=>{
        if(!key)return;
        const controller=new AbortController();
        const load=()=>void api.get<{success:boolean;completed_ids:string[]}>("goal-workspace/day/"+day,{signal:controller.signal,params:{timezone:zone}}).then(({data})=>{
            if(!controller.signal.aborted && data.success)setResult({key,ids:data.completed_ids,error:false});
        }).catch(()=>{if(!controller.signal.aborted)setResult({key,ids:[],error:true});});
        load();
        return ()=>controller.abort();
    },[key,goals]);
    return {ids:result.key===key?result.ids:[],loading:Boolean(key && result.key!==key),error:result.key===key && result.error};
}
