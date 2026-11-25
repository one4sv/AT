import {useEffect,useRef,useState} from "react";
import {useTranslation} from "react-i18next";
import {CheckCircleIcon,CircleIcon,ChatCircleIcon,CaretLeftIcon,CaretRightIcon} from "@phosphor-icons/react";
import {useContextMenu} from "../../../hooks/ContextMenuHook";
import {useCalendar} from "../../../hooks/CalendarHook";
import {useHabits} from "../../../hooks/HabitsHook";
import {useTheHabit} from "../../../hooks/TheHabitHook";
import {usePlans} from "../../../hooks/PlansHook";
import {useDone} from "../../../hooks/DoneHook";
import {useUser} from "../../../hooks/UserHook";
import {useBlackout} from "../../../hooks/BlackoutHook";
import {dateToCalendarFormat,todayStrFunc,formatDateFromString} from "../../utils/dateToStr";
import {getDayArrays} from "../../utils/getDayArrs";
import {buildSlide} from "../../../../pages/HabitPage/utils/buildSlide";
import SelectList from "../../SelectList";
import {DaySummary} from "../../../../pages/HabitPage/components/Calendar/HoverDay";

export default function CalendarDayMenu({mobile}:{mobile:boolean}){
    const {t,i18n}=useTranslation("common");
    const {menu,closeMenu}=useContextMenu();
    const {calendar,setChosenDay,setSelectedMonth,setSelectedYear}=useCalendar();
    const {habits}=useHabits(),{habit}=useTheHabit(),{plans}=usePlans(),{user}=useUser();
    const {markDone}=useDone(),{setBlackout}=useBlackout();
    const [date,setDate]=useState(menu.options.id);
    const [month,setMonth]=useState(()=>new Date(date+"T12:00:00"));
    const edge=useRef(0);
    const [direction,setDirection]=useState(0);
    const shiftMonth=(step:number)=>{setDirection(step);setMonth(old=>new Date(old.getFullYear(),old.getMonth()+step,1,12));};
    useEffect(()=>{
        if(!mobile)return;
        let interval:number|undefined;
        const stop=()=>{edge.current=0;if(interval!==undefined)clearInterval(interval);interval=undefined;};
        const move=(e:Event)=>{
            const {x,y}=(e as CustomEvent<{x:number;y:number}>).detail;
            const target=document.elementFromPoint(x,y)?.closest<HTMLElement>("[data-calendar-preview-day]");
            if(target?.dataset.calendarPreviewDay)setDate(target.dataset.calendarPreviewDay);
            const direction=x<32?-1:x>window.innerWidth-32?1:0;
            if(direction===edge.current)return;
            stop();edge.current=direction;
            if(direction){
                const shift=()=>shiftMonth(direction);
                shift();interval=window.setInterval(shift,650);
            }
        };
        window.addEventListener("calendar-context-move",move);window.addEventListener("calendar-context-end",stop);
        return ()=>{stop();window.removeEventListener("calendar-context-move",move);window.removeEventListener("calendar-context-end",stop);};
    },[mobile]);
    const id=menu.options.habitId;
    const current=habit?.id===Number(id)?habit:habits?.find(h=>String(h.id)===id);
    const items=id?(current?[current]:[]):habits || [];
    const [selectedId,setSelectedId]=useState(id || "");
    const selected=items.find(h=>String(h.id)===selectedId);
    const chosen=selected || (id?current:undefined);
    const counts=getDayArrays(date,calendar,habits,id,current);
    const comment=calendar.find(c=>c.date===date && String(c.habitId)===String(chosen?.id))?.comment || "";
    const done=calendar.some(c=>c.date===date && String(c.habitId)===String(chosen?.id) && c.isDone);
    const inRange=Boolean(chosen?.ongoing && date>=chosen.start_date && (!chosen.end_date || date<=chosen.end_date) && (!chosen.access?.completion_start_date || date>=chosen.access.completion_start_date));
    const own=Boolean(chosen && chosen.user_id===user.id);
    const canComplete=inRange && date<=todayStrFunc() && Boolean(chosen?.access?.can_complete ?? own);
    const canComment=inRange && Boolean(chosen?.access?.can_comment ?? own);
    const selectDay=()=>{const d=new Date(date+"T12:00:00");setSelectedMonth(d.getMonth());setSelectedYear(d.getFullYear());setChosenDay(date);};
    const slide=buildSlide(month.getMonth(),month.getFullYear());
    const summary=<div className="calendarContextSummary"><strong>{formatDateFromString(date)}</strong><DaySummary key={date+":"+id} date={date} habitId={id} completed={counts.completedArr.length} missed={counts.skippedArr.length} planned={counts.willArr.length+counts.plannedArr.length+(!id?plans.filter(p=>p.plan_date===date && p.membership_status!=="pending").length:0)} ongoing={counts.nowArr.length} comment={comment}/></div>;
    const days=[...slide.days.prev,...slide.days.this,...slide.days.post];
    return <>
        {mobile && <div className="calendarContextCalendar" onClick={e=>e.stopPropagation()}>
            <div className="calendarContextHeader"><button type="button" aria-label={t("calendarDay.previousMonth")} onClick={()=>shiftMonth(-1)}><CaretLeftIcon/></button><strong>{new Intl.DateTimeFormat(i18n.resolvedLanguage,{month:"long",year:"numeric"}).format(month)}</strong><button type="button" aria-label={t("calendarDay.nextMonth")} onClick={()=>shiftMonth(1)}><CaretRightIcon/></button></div>
            <div key={month.toISOString()} className={"calendarDays "+(direction>0?"contextMonthNext":direction<0?"contextMonthPrev":"")}>
                {Array.from({length:7},(_,i)=><small key={i}>{new Intl.DateTimeFormat(i18n.resolvedLanguage,{weekday:"short",timeZone:"UTC"}).format(new Date(Date.UTC(2024,0,i+1)))}</small>)}
                {days.map(d=>{
                    const day=dateToCalendarFormat(new Date(d.year,d.month,d.day,12));
                    const c=getDayArrays(day,calendar,habits,id,current);
                    return <button type="button" key={day} data-calendar-preview-day={day} className={"calDay "+(d.month!==month.getMonth()?"prevDays ":"")+(day===date?"chosenDayCal":"")} onClick={e=>{e.stopPropagation();setDate(day);}}>{d.day}<span className="calendarDots">{c.completedArr.length>0 && <span className="calendarDot comp"/>}{c.skippedArr.length>0 && <span className="calendarDot skip"/>}{(c.willArr.length>0 || c.plannedArr.length>0) && <span className="calendarDot will"/>}{c.nowArr.length>0 && <span className="calendarDot now"/>}</span></button>;
                })}
                {Array.from({length:42-days.length},(_,i)=><span key={"blank-"+i} aria-hidden="true"/>)}
            </div>
            {summary}
        </div>}
        {!mobile && summary}
        <div className="calendarContextActions">
        {!id && <div className="calendarContextPick" onClick={e=>e.stopPropagation()}><SelectList className="calendarContextActivity" placeholder={t("calendarDay.chooseActivity")} selected={selectedId} onChange={setSelectedId} arr={items.filter(h=>h.ongoing).map(h=>({value:String(h.id),label:h.name}))}/></div>}
        {canComplete && <div className="ContextMenuButt" onClick={()=>{closeMenu();selectDay();markDone(chosen!.id,date);}}>{done?<CheckCircleIcon/>:<CircleIcon/>}{t(done?"calendarDay.undo":"calendarDay.mark")}</div>}
        {canComment && <div className="ContextMenuButt" onClick={()=>{closeMenu();selectDay();setBlackout({seted:true,module:"CalendarDayComment",options:{habitId:String(chosen!.id),id:date,name:comment?"edit":"add"}});}}><ChatCircleIcon/>{t(comment?"calendarDay.editComment":"calendarDay.addComment")}</div>}
        {!canComplete && !canComment && <div className="ContextMenuButt" onClick={()=>{selectDay();closeMenu();}}>{t("calendarDay.openDay")}</div>}
        </div>
    </>;
}
