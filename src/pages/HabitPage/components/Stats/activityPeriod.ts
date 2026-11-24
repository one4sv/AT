import type { Habit } from "../../../../components/context/HabitsContext";
import type { Calendar } from "../../../../components/context/CalendarContext";

const DAY=86400000;
export const shiftDay=(day:string,n:number)=>new Date(Date.parse(day+"T00:00:00Z")+n*DAY).toISOString().slice(0,10);

export function activityPeriod(habits:Habit[],calendar:Calendar[],end:string,length:number) {
    const first=shiftDay(end,1-length);
    const facts=new Map<string,{done:boolean;planned:boolean}>();
    for(const row of calendar){
        if(row.date<first || row.date>end || (!row.isDone && !row.isPlanned))continue;
        const key=row.date+"/"+row.habitId,old=facts.get(key);
        facts.set(key,{done:!!(old?.done || row.isDone),planned:!!(old?.planned || row.isPlanned)});
    }
    let completed=0,opportunities=0,activeDays=0,eligibleDays=0;
    const days=Array.from({length},(_,i)=>{
        const date=shiftDay(first,i);
        const stamp=Date.parse(date+"T00:00:00Z"),weekday=new Date(stamp).getUTCDay();
        let done=0,due=0,eligible=false;
        for(const habit of habits){
            const start=habit.start_date?.slice(0,10),stop=habit.end_date?.slice(0,10);
            if(!start || date<start || (stop && date>stop) ||
                (habit.access?.completion_start_date && date<habit.access.completion_start_date))continue;
            eligible=true;
            const mark=facts.get(date+"/"+habit.id);
            const offset=(stamp-Date.parse(start+"T00:00:00Z"))/DAY;
            const cycle=habit.cycle_days_active+habit.cycle_days_rest;
            const scheduled=habit.periodicity==="everyday" ||
                (habit.periodicity==="weekly" && habit.chosen_days?.includes(weekday)) ||
                (habit.periodicity==="cycle" && cycle>0 && offset%cycle<habit.cycle_days_active) || mark?.planned;
            if(scheduled || mark?.done) due++;
            if(mark?.done) done++;
        }
        if(eligible)eligibleDays++;
        if(done)activeDays++;
        completed+=done;opportunities+=due;
        return {date,done,due,eligible};
    });
    return {days,completed,opportunities,activeDays,eligibleDays,missed:opportunities-completed,
        rate:opportunities?Math.round(completed/opportunities*100):null};
}

