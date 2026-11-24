import { useEffect,useRef,useState } from "react";
import { useTranslation } from "react-i18next";
import { CameraIcon,XIcon } from "@phosphor-icons/react";
import { prepareActivityImage } from "./utils/activityImage";
import { useNote } from "../hooks/NoteHook";
import "../../scss/activityImages.scss";

export default function ActivityAvatarPicker({src,onChange,onBusy,disabled=false}:{src?:string;onChange:(file:File | null)=>Promise<void>|void;disabled?:boolean;onBusy?:(value:boolean)=>void}) {
    const {t}=useTranslation("common");
    const {showNotification}=useNote();
    const input=useRef<HTMLInputElement>(null);
    const [busy,setBusy]=useState(false);
    const active=useRef(true);
    useEffect(()=>{active.current=true;return ()=>{active.current=false;};},[]);
    const change=async(file:File | null)=>{
        setBusy(true);onBusy?.(true);
        try {
            const next=file?await prepareActivityImage(file,true):null;
            if(active.current) await onChange(next);
        } catch {showNotification("error",t("activityImages.avatarError"));}
        finally {if(active.current){setBusy(false);onBusy?.(false);}}
    };
    return <div className="activityAvatarPicker">
        {src && <img className="activityAvatar" src={src} alt=""/>}
        <input ref={input} type="file" accept="image/*" hidden onChange={e=>{
            const file=e.target.files?.[0];e.target.value="";if(file) void change(file);
        }}/>
        <button type="button" disabled={busy || disabled} onClick={()=>input.current?.click()}><CameraIcon size={21}/>{t(src?"activityImages.replace":"activityImages.avatar")}</button>
        {src && <button type="button" aria-label={t("activityImages.removeAvatar")} disabled={busy || disabled} onClick={()=>void change(null)}><XIcon size={20}/></button>}
    </div>;
}

