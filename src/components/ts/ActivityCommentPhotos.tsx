import { useEffect,useRef,useState } from "react";
import {useMatch} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaperclipIcon,XIcon } from "@phosphor-icons/react";
import { api } from "./api";
import { commentPhotoUrl,prepareActivityImage } from "./utils/activityImage";
import { useBlackout } from "../hooks/BlackoutHook";
import { useNote } from "../hooks/NoteHook";
import { useCalendar } from "../hooks/CalendarHook";
import { useUser } from "../hooks/UserHook";
import "../../scss/activityImages.scss";

export function ActivityPhoto({url}:{url:string}) {
    const {t}=useTranslation("common"),{setBlackout}=useBlackout();
    return <button type="button" className="activityPhoto" aria-label={t("activityImages.view")}
        onClick={()=>setBlackout({seted:true,module:"ImgPrev",img:url})}><img loading="lazy" src={url} alt={t("activityImages.photo")}/></button>;
}
function LocalPhoto({file}:{file:File}) {
    const [url,setUrl]=useState("");
    useEffect(()=>{const src=URL.createObjectURL(file);setUrl(src);return ()=>URL.revokeObjectURL(src);},[file]);
    return url?<img src={url} alt=""/>:null;
}
type Snapshot={photos:string[];text:string};
export function useActivityCommentPhotos(id:string,date:string,enabled:boolean,editable:boolean) {
    const {t}=useTranslation("common"),{showNotification}=useNote();
    const {fetchCalendarHabit,fetchCalendarUser,fetchAllCalendar}=useCalendar();
    const routeHabitId=useMatch("/habit/:habitId")?.params.habitId;
    const {user}=useUser();
    const path="habits/"+id+"/comment-photos/"+date;
    const scope=user.id+":"+path;
    const active=useRef(scope);
    active.current=scope;
    useEffect(()=>{active.current=scope;return ()=>{active.current="";};},[scope]);
    const input=useRef<HTMLInputElement>(null);
    const [savedScope,setSavedScope]=useState("");
    const [saved,setSaved]=useState<Snapshot|null>(null);
    const [kept,setKept]=useState<string[]>([]);
    const [added,setAdded]=useState<File[]>([]);
    const [busy,setBusy]=useState(false);
    const [attempt,retry]=useState(0);
    const [error,setError]=useState(false);
    useEffect(()=>{
        const controller=new AbortController();
        setSaved(null);setKept([]);setAdded([]);setError(false);setBusy(false);
        if(enabled) void api.get<Snapshot>(path,{signal:controller.signal}).then(({data})=>{
            if(!controller.signal.aborted){setSavedScope(scope);setSaved(data);setKept(data.photos);}
        }).catch(()=>{if(!controller.signal.aborted)setError(true);});
        return ()=>controller.abort();
    },[scope,path,enabled,attempt]);
    const dirty=!!added.length || kept.length!==saved?.photos.length;
    const attach=async(files:File[])=>{
        if(!files.length) return;
        if(added.length+kept.length+files.length>4){showNotification("error",t("activityImages.limit"));return;}
        setBusy(true);
        try{const photos=await Promise.all(files.map(file=>prepareActivityImage(file)));
            if(active.current===scope)setAdded(old=>[...old,...photos]);
        }catch{showNotification("error",t("activityImages.invalid"));}
        finally{if(active.current===scope)setBusy(false);}
    };
    const save=async(text:string)=>{
        if(busy || !saved || savedScope!==scope || !editable)return;
        setBusy(true);
        const body=new FormData();
        body.set("text",text);body.set("expected",JSON.stringify(saved.photos));body.set("keep",JSON.stringify(kept));
        added.forEach(file=>body.append("photos",file));
        try{
            const {data}=await api.post(path,body);
            if(!data.success)throw new Error("save");
            if(active.current!==scope)return;
            setSaved({photos:data.photos,text});setKept(data.photos);setAdded([]);
            fetchCalendarHabit(id);
            window.dispatchEvent(new Event("habit-day-comment-updated"));
        }catch(e){
            if(active.current!==scope)return;
            if((e as {response?:{status:number}}).response?.status===409){
                try{
                    const {data}=await api.get<Snapshot>(path);
                    if(active.current!==scope)return;
                    const removed=saved.photos.filter(k=>!kept.includes(k));
                    setSaved(data);setKept(data.photos.filter(k=>!removed.includes(k)));
                }catch{setError(true);}
            }
            showNotification("error",t("activityImages.saveError"));
        }finally{if(active.current===scope)setBusy(false);}
    };
    const controls=editable && <div className="activityPhotoTools">
        <input type="file" accept="image/*" multiple hidden ref={input} onChange={e=>{
            const files=Array.from(e.target.files || []);e.target.value="";void attach(files);
        }}/>
        <button type="button" className="attachActivityPhoto" aria-label={t("activityImages.attach")} title={t("activityImages.attach")}
            disabled={!saved || busy || kept.length+added.length>=4} onClick={()=>input.current?.click()}><PaperclipIcon size={22}/></button>
        {error && <button type="button" onClick={()=>retry(n=>n+1)}>{t("activityImages.retry")}</button>}
    </div>;
    const previews=savedScope===scope && (kept.length>0 || added.length>0) && <div className="activityPhotoStrip">
        {kept.map(k=><span key={k}><ActivityPhoto url={commentPhotoUrl(id,date,k)}/>
            {editable && <button className="removeActivityPhoto" type="button" aria-label={t("activityImages.remove")} disabled={busy} onClick={()=>setKept(old=>old.filter(item=>item!==k))}><XIcon size={14}/></button>}</span>)}
        {added.map((file,i)=><span key={i}><LocalPhoto file={file}/>
            {editable && <button className="removeActivityPhoto" type="button" aria-label={t("activityImages.remove")} disabled={busy} onClick={()=>setAdded(old=>old.filter((_,j)=>i!==j))}><XIcon size={14}/></button>}</span>)}
    </div>;
    return {controls,previews,save,dirty,busy,ready:!!saved && savedScope===scope,savedText:savedScope===scope?saved?.text:undefined};
}

