import {useEffect,useState} from "react";
import {useTranslation} from "react-i18next";
import {useBlackout} from "../hooks/BlackoutHook";
import {useActivityCommentPhotos} from "../ts/ActivityCommentPhotos";
import TA from "../ts/TA";
import {formatDateFromString} from "../ts/utils/dateToStr";
import "./scss/goalWorkspace.scss";
export default function CalendarDayComment(){
    const {t}=useTranslation("common"),{blackout,setBlackout}=useBlackout();
    const id=blackout.options?.habitId || "",date=blackout.options?.id || "";
    const photos=useActivityCommentPhotos(id,date,!!id && !!date,!!id && !!date);
    const [text,setText]=useState("");
    useEffect(()=>{setText(photos.savedText || "");},[photos.savedText,id,date]);
    return <div className="addHabitDiv addPlanDiv goalWorkspaceModal calendarCommentModal">
        <h2>{t("calendarDay.editComment")} · {formatDateFromString(date)}</h2>
        <TA className="addHabitInput" value={text} maxLength={200} readOnly={!photos.ready || photos.busy} onChange={e=>setText(e.target.value)}/>
        {photos.previews}{photos.controls}
        <button className="addHabitSave" type="button" disabled={!photos.ready || photos.busy || (!photos.dirty && text===photos.savedText)} onClick={()=>void photos.save(text)}>{t("calendarDay.save")}</button>
        <button className="goalWorkspaceQuiet" type="button" onClick={()=>setBlackout({seted:false})}>{t("calendarDay.close")}</button>
    </div>;
}
