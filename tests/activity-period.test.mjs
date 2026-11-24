import test from "node:test";
import assert from "node:assert/strict";
import {activityPeriod,shiftDay} from "../src/pages/HabitPage/components/Stats/activityPeriod.ts";

const habit={id:1,start_date:"2026-03-01",periodicity:"weekly",chosen_days:[1],cycle_days_active:0,cycle_days_rest:0};
const mark=(date,extra={})=>({date,habitId:"1",isDone:true,...extra});

test("period counts eligible habit-days once and keeps free days out of the rate",()=>{
    const calendar=[mark("2026-03-23"),mark("2026-03-23"),mark("2026-03-25",{isDone:false}),mark("2026-03-30",{isDone:false,isPlanned:true})];
    const r=activityPeriod([habit],calendar,"2026-03-30",8);
    assert.deepEqual([r.completed,r.opportunities,r.activeDays,r.missed,r.rate],[1,2,1,1,50]);
    assert.equal(shiftDay("2026-03-30",-1),"2026-03-29");
});
test("cycle, membership start, archive and future facts bound the calendar",()=>{
    const h={...habit,periodicity:"cycle",start_date:"2026-03-24",end_date:"2026-03-29",cycle_days_active:1,cycle_days_rest:1,access:{completion_start_date:"2026-03-26"}};
    const r=activityPeriod([h],[mark("2026-03-24"),mark("2026-03-28"),mark("2026-04-01")],"2026-03-31",9);
    assert.deepEqual([r.completed,r.opportunities,r.eligibleDays,r.rate],[1,2,4,50]);
});
test("sometimes without a plan is unscored, explicit plans and spontaneous completions count",()=>{
    const h={...habit,periodicity:"sometimes"};
    assert.equal(activityPeriod([h],[],"2026-03-30",7).rate,null);
    const r=activityPeriod([h],[mark("2026-03-25"),mark("2026-03-26",{isDone:false,isPlanned:true})],"2026-03-30",7);
    assert.equal(r.rate,50);
});

