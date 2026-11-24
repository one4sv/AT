import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("goals stay inside habit overview, without a standalone goals route or main menu button",()=>{
    const app=read("src/App.tsx");
    const nav=read("src/components/ts/SM/AccountList.tsx");
    const overview=read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    assert.doesNotMatch(app,/path="goals"|path="goal\//);
    assert.doesNotMatch(nav,/to="\/goals"/);
    assert.match(nav,/to="\/habit"/);
    assert.match(nav,/openCreate\("AddGoal"\)/);
    assert.doesNotMatch(overview, /<GoalOverview|habitOverviewShowAll/);
    assert.match(overview, /goalCount > 0/);
});
test("SideMenu has desktop and touch create actions",()=>{
    const nav=read("src/components/ts/SM/SMnav.tsx");
    assert.match(nav,/data-action="add-goal"/);
    assert.match(nav,/action === "add-goal"/);
    assert.match(nav,/createActivity\("AddGoal"\)/);
    assert.match(nav, /<BookmarkSimpleIcon size=\{20\} weight="fill"\/> \{t\("sideMenu.newGoal"\)\}/);
    const modal=read("src/components/modules/ModuleMap.ts");
    for(const name of ["AddGoal","GoalCatalog","GoalDetails","GoalPicker"]) assert.match(modal,new RegExp(name+": lazy"));
});
test("creation does not use slider and remove stage button matches input height",()=>{
    const create=read("src/components/modules/AddGoal.tsx");
    const css=read("src/components/modules/scss/goalWorkspace.scss");
    assert.doesNotMatch(create,/type="range"|<SeekBar/);
    assert.match(create,/goalStageInputs/);
    assert.match(css,/\.goalStageInputs\s*\{[\s\S]*?height: clamp\(44px, 5dvh, 54px\);/);
    assert.match(css,/\.addHabitInput, \.goalStageRemove\s*\{\s*height: 100%;/);
    const details=read("src/components/modules/GoalDetails.tsx");
    assert.match(details,/<SeekBar/);
    assert.match(details,/seekbar\.scss/);
    const addHabit=read("src/components/modules/AddHabit.tsx");
    assert.doesNotMatch(addHabit,/className="addHabitGoal"/);
});
test("existing activity goal actions open the same goals slide",()=>{
    for(const path of ["src/pages/HabitPage/components/HabitInfo/HabitExtraButts.tsx",
        "src/components/ts/ContextMenu/menus/HabitHeaderMenu.tsx"]){
        const content=read(path);
        assert.match(content,/(setShowSlide|openSlide)\("goals"\)/);
        assert.doesNotMatch(content,/showDevNote\(\)/);
    }
});
test("goal locale keys are symmetric in RU and EN",()=>{
    const ru=JSON.parse(read("src/i18n/locales/ru/goals.json"));
    const en=JSON.parse(read("src/i18n/locales/en/goals.json"));
    const flatten=(x,p="")=>Object.entries(x).flatMap(([k,v])=>typeof v==="object" ?
        flatten(v,p+k+".") : [p+k]).sort();
    assert.deepEqual(flatten(ru),flatten(en));
    const ruCommon=JSON.parse(read("src/i18n/locales/ru/common.json"));
    const enCommon=JSON.parse(read("src/i18n/locales/en/common.json"));
    for(const key of ["newGoal","addGoal"]) assert.ok(ruCommon.sideMenu[key] && enCommon.sideMenu[key]);
});

test("nonzero summary counters open the existing list dialogs and share one create menu", () => {
    const overview = read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    const style = read("src/pages/HabitPage/scss/HabitOverview.scss");
    const createMenu = read("src/components/ts/ContextMenu/menus/PlanCreateMenu.tsx");
    const catalog = read("src/components/modules/GoalCatalog.tsx");
    for (const [count, label] of [["activityCount", "activities"], ["planCount", "plans"]]) {
        assert.ok(overview.includes(count + " > 0 && <button"));
        assert.ok(overview.includes('module: "HabitOverviewList", options: { name: "' + label + '" }'));
    }
    assert.match(overview, /goalCount > 0 && <button/);
    assert.match(overview, /module: "GoalCatalog"/);
    assert.doesNotMatch(overview, /habitOverviewShowAll|plans\.showAll|<GoalOverview/);
    assert.match(style, /grid-auto-columns: minmax\(0, 1fr\)/);
    assert.match(style, /\.habitOverviewSummary > button/);
    for (const module of ["AddPlan", "AddHabit", "AddGoal"]) {
        assert.ok(createMenu.includes('open("' + module + '")'));
    }
    assert.match(createMenu, /sideMenu\.newGoal/);
    assert.doesNotMatch(catalog, /module:\s*"AddGoal"/);
});

 test("goals do not appear on past calendar days and overview refresh is silent", () => {
    const overview=read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    assert.match(overview, /goalCount = chosenDay >= todayStrFunc\(\) \? goals.length : 0/);
    assert.match(overview, /initializing \? <SummarySkeleton\/>/);
    assert.match(overview, /initializing \? <UpcomingSkeleton\/>/);
    const style=read("src/pages/HabitPage/scss/HabitOverview.scss");
    assert.match(style, /\.habitOverviewEntryDone \{\s*align-self: center;/);
    const profile=read("src/pages/Acc/components/AccHabits.tsx");
    assert.match(profile, /useGoalsWorkspace\(own\)/);
    assert.match(profile, /upcomingProfilePlans\(plans \|\| \[\]\)/);
    assert.match(profile, /module: "HabitOverviewList", options: \{ name: "plans", nick:/);
    assert.match(profile, /module: "GoalCatalog", options: \{ nick:/);
    const modal=read("src/components/modules/HabitOverviewList.tsx");
    assert.match(modal, /acc\?\.nick === profileNick \? makeProfilePlanEntries\(profilePlans\)/);
});

 test("goal editor uses SelectList and stages links before save",()=>{
    const editor=read("src/components/modules/AddGoal.tsx");
    assert.match(editor, /<SelectList id="goalMode"/);
    assert.match(editor, /"days","streak","daily_timer","daily_counter"/);
    assert.match(editor, /habit_ids:linkedHabits.map/);
    assert.match(editor, /plan_ids:linkedPlans.map/);
    assert.match(editor, /setLinkedHabits\(goal.habits/);
});

test("goal editor filters archived links, adds multiple selections and explains milestones",()=>{
    const editor=read("src/components/modules/AddGoal.tsx");
    assert.match(editor,/filter\(h=>isGoalHabitAvailable/);
    assert.match(editor,/filter\(isGoalPlanAvailable\)/);
    assert.match(editor,/setLinkedHabits\(old=>old.some/);
    assert.match(editor,/usesStages && <div className="goalWorkspaceStages">/);
    assert.match(editor,/step=\{0.01\}/);
    assert.match(editor,/goalDailyCounter/);
});

test("SelectList portal is inside Blackout interaction",()=>{assert.match(read("src/components/ts/Blackout.tsx"),/closest\("\.planTagPortal, \.selectListPortalRoot"\)/);});

test("activity goal button reflects links and reuses goal dialogs",()=>{
    for(const path of ["src/pages/HabitPage/components/HabitInfo/HabitExtraButts.tsx","src/components/ts/ContextMenu/menus/HabitHeaderMenu.tsx"]){
        assert.match(read(path),/linked.length \? "habitUi.goals" : "habitUi.addGoal"/);
    }
    const picker=read("src/components/modules/GoalPicker.tsx");
    assert.match(picker,/linked.map\(goal/);
    assert.match(picker,/role="progressbar"/);
    assert.match(picker,/manualModes.includes\(goal.progress_mode\)/);
    assert.match(picker,/module:"GoalDetails"/);
    assert.match(picker,/module:"AddGoal",options:\{id:String\(goal.id\)\}/);
    assert.match(picker,/!hasHabitGoalLink\(goal,habitId\)/);
});

test("activity goals use a slide and selected progress is shared by timer and counter",()=>{
    const menu=read("src/pages/HabitPage/components/HabitInfo/HabitMenu.tsx");
    assert.match(menu,/case "goals":/);
    assert.match(menu,/slideHabitId=\{habit.id\}/);
    assert.match(read("src/pages/HabitPage/components/HabitInfo/HabitExtraButts.tsx"),/setShowSlide\("goals"\)/);
    for(const name of ["Timer","Counter"]) assert.match(read("src/pages/HabitPage/components/Habit/Complete/"+name+".tsx"),/<HabitGoalProgress/);
    assert.match(read("src/components/modules/GoalPicker.tsx"),/useHabitGoalDisplay/);
    assert.match(read("src/pages/HabitPage/components/HabitInfo/CompJurnal.tsx"),/journal.completion_removed/);
    const style=read("src/scss/SelectList.scss");
    assert.match(style,/backdrop-filter: blur\(9px\) !important/);
});

test("goal updates use a shared store, daily progress and optional completion/reminder",()=>{
    assert.match(read("src/components/hooks/useGoalsWorkspace.ts"),/useSyncExternalStore/);
    assert.match(read("src/components/ts/api.ts"),/at-goals-updated/);
    assert.match(read("src/components/ts/api.ts"),/timezone:appTimeZone\(\)/);
    const form=read("src/components/modules/AddGoal.tsx");
    assert.match(form,/auto_complete:autoComplete/);
    assert.match(form,/reminder_days:dueDate\?reminderDays:null/);
    assert.match(read("src/components/modules/GoalHistory.tsx"),/historyProgress/);
    assert.match(read("src/pages/HabitPage/components/Habit/Complete/HabitGoalProgress.tsx"),/goal.today_progress/);
});

 test("goal history opens in a separate Blackout module and metric modes follow linked activity types",()=>{
    const details=read("src/components/modules/GoalDetails.tsx");
    assert.match(details,/module:"GoalHistory"/);
    assert.doesNotMatch(details,/goal\.events\.map/);
    assert.match(read("src/components/modules/ModuleMap.ts"),/GoalHistory: lazy/);
    const editor=read("src/components/modules/AddGoal.tsx");
    assert.match(editor,/linkedTypes\.every\(type=>type==="timer"\)/);
    assert.match(editor,/linkedTypes\.every\(type=>type==="counter"\)/);
    assert.match(read("src/components/modules/GoalPicker.tsx"),/metricType==="timer" \|\| metricType==="counter"/);
});

 test("milestone percentages and cumulative timer mode have dedicated controls",()=>{
    const editor=read("src/components/modules/AddGoal.tsx");
    assert.match(editor,/completion_percent:s\.completion_percent/);
    assert.match(editor,/goalTotalMinutes/);
    assert.match(editor,/mode!=="total_timer"/);
    const details=read("src/components/modules/GoalDetails.tsx");
    assert.match(details,/completion_percent:editPercent/);
    assert.match(details,/achieved_minutes/);
    assert.match(read("src/components/modules/GoalPicker.tsx"),/goalMetricCompatible/);
});

 test("goal metric selection reads both normalized settings and joined relation",()=>{
    const types=read("src/pages/HabitPage/components/Overview/goalTypes.ts");
    assert.match(types,/habit\?\.settings\?\.metric_type/);
    assert.match(types,/Array\.isArray\(relation\)/);
    for(const path of ["src/components/modules/AddGoal.tsx","src/components/modules/GoalDetails.tsx","src/components/modules/GoalPicker.tsx","src/pages/HabitPage/components/Habit/Complete/HabitGoalProgress.tsx"]) assert.match(read(path),/goalHabitMetricType/);
});
