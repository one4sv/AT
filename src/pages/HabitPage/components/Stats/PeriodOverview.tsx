import { useMemo,useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useHabits } from "../../../../components/hooks/HabitsHook";
import { useTheHabit } from "../../../../components/hooks/TheHabitHook";
import { useCalendar } from "../../../../components/hooks/CalendarHook";
import { todayStrFunc } from "../../../../components/ts/utils/dateToStr";
import { activityPeriod,shiftDay } from "./activityPeriod";
import "../../scss/activityPeriod.scss";

export default function PeriodOverview(){
    const {t,i18n}=useTranslation("common");
    const {habitId}=useParams(),{habits}=useHabits(),{habit}=useTheHabit();
    const {calendar,calendarLoading,setChosenDay}=useCalendar();
    const [length,setLength]=useState(7),[focus,setFocus]=useState("");
    const end=shiftDay(todayStrFunc(),-1);
    const [now,previous]=useMemo(()=>{
        const items=habitId ? (String(habit?.id)===habitId && habit?[habit]:[]) : habits || [];
        return [activityPeriod(items,calendar,end,length),activityPeriod(items,calendar,shiftDay(end,-length),length)];
    },[habitId,habit,habits,calendar,end,length]);
    const format=new Intl.DateTimeFormat(i18n.resolvedLanguage,{day:"numeric",month:"short",timeZone:"UTC"});
    const label=(date:string)=>format.format(new Date(date+"T00:00:00Z"));
    const selected=now.days.find(day=>day.date===focus);
    const delta=now.rate!==null && previous.rate!==null && now.eligibleDays===length && previous.eligibleDays===length ? now.rate-previous.rate : null;
    const offset=(new Date(now.days[0].date+"T00:00:00Z").getUTCDay()+6)%7;
    return <section className="activityPeriod">
        <div className="activityPeriodHead"><h3>{t("activityStats.title")}</h3><div className="activityPeriodRanges">
            {[7,30,90].map(n=><button type="button" key={n} aria-pressed={n===length} onClick={()=>{setLength(n);setFocus("");}}>{t("activityStats.days",{n})}</button>)}
        </div></div>
        <span>{label(now.days[0].date)} – {label(end)}</span>
        {calendarLoading ? <p role="status">{t("statsUi.loading")}</p> : !now.eligibleDays ? <p>{t("activityStats.empty")}</p> : <>
            <div className="activityPeriodMetrics">
                <div><strong>{now.rate===null?"—":now.rate+"%"}</strong><span>{t("activityStats.rate")}</span></div>
                <div><strong>{now.completed}/{now.opportunities}</strong><span>{t("activityStats.done")}</span></div>
                <div><strong>{now.activeDays}</strong><span>{t("activityStats.active")}</span></div>
                <div><strong>{now.missed}</strong><span>{t("activityStats.missed")}</span></div>
            </div>
            <small>{delta===null?t("activityStats.noComparison"):t("activityStats.delta",{n:(delta>0?"+":"")+delta,days:length})}</small>
            <div className="activityHeat">
                {Array.from({length:7},(_,i)=><small key={i}>{new Intl.DateTimeFormat(i18n.resolvedLanguage,{weekday:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2024,0,i+1)))}</small>)}
                {now.days.map((day,i)=><button key={day.date} type="button" disabled={!day.eligible} aria-pressed={day.date===focus}
                    className={!day.due?"rest":!day.done?"missed":day.due===day.done?"full":"partial"}
                    style={!i?{gridColumnStart:offset+1}:undefined} aria-label={label(day.date)+" · "+day.done+"/"+day.due}
                    onClick={()=>setFocus(day.date)}>{Number(day.date.slice(-2))}</button>)}
            </div>
            <small>{t("activityStats.legend")}</small>
            {selected && <div className="activityPeriodSelection"><span>{label(selected.date)} · {selected.due?selected.done+"/"+selected.due:t("activityStats.rest")}</span>
                <button type="button" onClick={()=>{setChosenDay(selected.date);document.querySelector(".calendarDiv, .habitDayComment, .habitOverviewLayout")?.scrollIntoView({block:"center"});}}>{t("activityStats.openDay")}</button></div>}
        </>}
    </section>;
}

