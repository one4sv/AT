import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useBlackout} from "../hooks/BlackoutHook";
import {useNote} from "../hooks/NoteHook";
import {api} from "../ts/api";
import "./scss/addPlan.scss";
import "../../pages/HabitPage/scss/HabitSettings.scss";

type ExportData=Record<string,unknown>;
function csvCell(value:unknown){
    let text=typeof value==="string"?value:JSON.stringify(value ?? "");
    if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
}
export function activityCSV(data:ExportData){
    const rows:unknown[][]=[["section","date","id","data"]];
    for(const [section,value] of Object.entries(data)){
        for(const item of Array.isArray(value)?value:[value]){
            const row=item && typeof item==="object"?item as ExportData:{};
            rows.push([section,row.date ?? row.completed_at ?? row.started_at ?? row.created_at ?? "",row.id ?? "",item]);
        }
    }
    return "\uFEFF"+rows.map(row=>row.map(csvCell).join(";")).join("\r\n");
}
export default function HabitExport(){
    const {t}=useTranslation("common"),{blackout}=useBlackout(),{showNotification}=useNote();
    const [format,setFormat]=useState<"json"|"csv">("json"),[busy,setBusy]=useState(false);
    const id=blackout.options?.habitId;
    const download=async()=>{
        if(!id || busy)return;
        setBusy(true);
        try{
            const {data}=await api.get<{success:boolean;export:ExportData}>("habits/"+id+"/export");
            if(!data.success || !data.export)throw new Error("Export failed");
            const contents=format==="json"?JSON.stringify(data.export,null,2):activityCSV(data.export);
            const url=URL.createObjectURL(new Blob([contents],{type:format==="json"?"application/json":"text/csv;charset=utf-8"}));
            const a=document.createElement("a");a.href=url;a.download="AT-activity-"+id+"-"+new Date().toISOString().slice(0,10)+"."+format;
            document.body.appendChild(a);a.click();a.remove();
            setTimeout(()=>URL.revokeObjectURL(url),60000);
        }catch{showNotification("error",t("habitExport.error"));}finally{setBusy(false);}
    };
    return <div className="addHabitDiv addPlanDiv habitExportModal">
        <h2>{t("habitExport.title")}</h2>
        <span>{t("habitExport.format")}</span>
        <div className="habitExportFormats">
            {(["json","csv"] as const).map(value=><button key={value} type="button" className={format===value?"active":""} aria-pressed={format===value} disabled={busy} onClick={()=>setFormat(value)}>{t("habitExport."+value)}</button>)}
        </div>
        <small>{t("habitExport.privacy")}</small>
        <button type="button" className="addHabitSave" disabled={busy || !id} onClick={()=>void download()}>{t(busy?"habitExport.loading":"habitExport.download")}</button>
    </div>;
}
