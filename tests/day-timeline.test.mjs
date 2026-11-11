import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/ts/utils/dayTimeline.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
const dependencies = path => {
    if (path.includes("getDayArrs")) return { getDayArrays: () => ({
        completedArr: [], skippedArr: [], nowArr: [], willArr: []
    }) };
    if (path.includes("dateToStr")) return { todayStrFunc: () => "2026-11-11" };
    throw new Error("Unexpected import " + path);
};
new Function("require", "module", "exports", output)(dependencies, mod, mod.exports);
const { compareDayEntries, makeSideMenuEntries, describeDayTime } = mod.exports;

const entry = (name, start, end, periodicity = "everyday") => ({
    key:name,kind:"habit",name,start,end,date:"2026-11-11",description:"",
    completed:false,state:"will",habit:{periodicity}
});

test("timeline has fixed start-time, end-only, no-time, sometimes order", () => {
    const items = [
        entry("sometimes","02:00",null,"sometimes"),
        entry("no time",null,null),
        entry("end 18",null,"18:00"),
        entry("start 07","07:00",null),
        entry("end 09",null,"09:00"),
        entry("start 01","01:00","03:00")
    ];
    items.sort(compareDayEntries);
    assert.deepEqual(items.map(item => item.name),
        ["start 01","start 07","end 09","end 18","no time","sometimes"]);
});

test("SideMenu and overview import the same time-sort utility", () => {
    const overview = readFileSync(new URL("../src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx", import.meta.url), "utf8");
    const sideMenu = readFileSync(new URL("../src/components/ts/SM/HabitsList.tsx", import.meta.url), "utf8");
    const settings = readFileSync(new URL("../src/pages/Settings/components/SettingsTabs/HabitsTab.tsx", import.meta.url), "utf8");
    assert.match(overview, /makeDayEntries/);
    assert.match(sideMenu, /makeSideMenuEntries/);
    assert.doesNotMatch(settings, /orderShown|setNewOrder|orderHabits/);
});

test("future plans appear after today's habits in SideMenu", () => {
    const habit = { id:7,name:"Daily",desc:"",periodicity:"everyday",
        ongoing:true,start_time:"07:00",end_time:"",start_date:"2026-01-01" };
    const plan = { id:8,name:"Tomorrow",plan_date:"2026-11-12",
        start_time:"01:00",end_time:null,membership_status:"accepted" };
    const entries = makeSideMenuEntries("all",[habit],[plan],[],false,"");
    assert.deepEqual(entries.map(entry => entry.name),["Daily","Tomorrow"]);
});

test("time is displayed below a name and supports end-only times", () => {
    const t = (key, values) => key + " " + JSON.stringify(values || {});
    assert.match(describeDayTime(entry("end",null,"08:00"),t), /08:00/);
    assert.match(describeDayTime(entry("start","01:00",null),t), /01:00/);
});
