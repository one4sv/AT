import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

const source = read("src/pages/HabitPage/components/Overview/dayFocus.ts");
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", compiled)(mod, mod.exports);
const { getOverviewFocus, getOverviewNext } = mod.exports;

const item = (name, start, end = null, overrides = {}) => ({
    key: name, kind: "habit", name, start, end, completed: false,
    date: "2026-11-11", state: "will", ...overrides
});

test("2 AM today and the first task at 7 AM shows Start of day", () => {
    const entries = [item("morning habit", "07:00"), item("plan", "13:00", null, { kind: "plan" })];
    const focus = getOverviewFocus(entries, "2026-11-11", "2026-11-11", "02:00");
    assert.equal(focus?.kind, "dayStart");
    assert.equal(focus?.entry.name, "morning habit");
});

test("ongoing task is current, even when a different future plan exists", () => {
    const entries = [item("work", "07:00", "12:00"), item("appointment", "13:00", null, { kind: "plan" })];
    const focus = getOverviewFocus(entries, "2026-11-11", "2026-11-11", "08:30");
    assert.equal(focus?.kind, "current");
    assert.equal(focus?.entry.name, "work");
});

test("future day shows first scheduled plan instead of current activity", () => {
    const entries = [item("early plan", "01:00", null, { kind: "plan" }), item("run", "07:00")];
    const focus = getOverviewFocus(entries, "2026-11-12", "2026-11-11", "21:00");
    assert.equal(focus?.kind, "dayStart");
    assert.equal(focus?.entry.name, "early plan");
});

test("cancelled and completed entries are excluded; past day has no day-start forecast", () => {
    const entries = [
        item("completed", "07:00", null, { completed: true }),
        item("cancelled", "08:00", null, { kind: "plan", plan: { status: "canceled" } }),
        item("remaining", "09:00")
    ];
    assert.equal(getOverviewFocus(entries, "2026-11-12", "2026-11-11", "02:00")?.entry.name, "remaining");
    assert.equal(getOverviewFocus(entries, "2026-11-10", "2026-11-11", "02:00"), null);
});

test("existing skeleton structure matches actual panels instead of generic lines", () => {
    const overview = read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    const styles = read("src/pages/HabitPage/scss/HabitOverview.scss");
    assert.match(overview, /function SummarySkeleton/);
    assert.match(overview, /function UpcomingSkeleton/);
    assert.match(overview, /function CalendarSkeleton/);
    assert.match(overview, /className="habitOverviewSummary"/);
    assert.match(overview, /className="skeletonCard overviewSkeletonEntry"/);
    assert.match(styles, /\.overviewSummarySkeleton/);
    assert.match(styles, /\.overviewUpcomingSkeleton/);
});

test("message media skeletons are load-aware and respect disabled automatic loading", () => {
    const image = read("src/components/ts/TrafficImage.tsx");
    const media = read("src/pages/Chat/utils/MessageFiles.tsx");
    assert.match(image, /if \(blocked\) return/);
    assert.match(image, /loadedSrc !== src/);
    assert.match(image, /onLoad=\{\(\) => setLoadedSrc\(src\)\}/);
    assert.match(media, /className="skeletonBlock messageFileSkeleton"/);
    assert.match(media, /preload === "metadata" && !resolved/);
});

test("SMnav has working search during loading and avatar skeleton on actual image load", () => {
    const nav = read("src/components/ts/SM/SMnav.tsx");
    assert.match(nav, /const searchControl =/);
    assert.doesNotMatch(nav, /if \(loadingUser\) return/);
    assert.match(nav, /if \(!loadingUser && !user.id\) return null/);
    assert.match(nav, /loadingUser \? <span className="skeletonCircle smNavAvatarSkeleton"/);
    assert.match(nav, /onLoad=\{\(\) => setStatus\("ready"\)\}/);
    assert.equal((nav.match(/\{searchControl\}/g) || []).length, 1);
});

test("plan schedule border remains one pixel without layout shift on hover", () => {
    const styles = read("src/pages/HabitPage/scss/Schedule.scss");
    assert.match(styles, /\.planScheduleBlock \{/);
    assert.match(styles, /border: 1px solid transparent;/);
    assert.match(styles, /border-color: var\(--tc\);/);
    assert.match(styles, /padding: 1dvh 3vw;/);
});

test("next activity is the upcoming plan after an ongoing habit", () => {
    const ongoing = item("current habit", "08:00", "11:00");
    const plan = item("next plan", "13:00", null, { kind: "plan" });
    const later = item("later habit", "18:00");
    const entries = [ongoing, plan, later];
    const focus = getOverviewFocus(entries, "2026-11-11", "2026-11-11", "09:00");
    assert.equal(getOverviewNext(entries, "2026-11-11", "2026-11-11", "09:00", focus)?.name, "next plan");
});

test("upcoming focus skips itself and shows the next available activity", () => {
    const first = item("morning plan", "09:00", null, { kind: "plan" });
    const second = item("afternoon habit", "15:00");
    const entries = [first, second];
    const focus = getOverviewFocus(entries, "2026-11-11", "2026-11-11", "08:00");
    assert.equal(getOverviewNext(entries, "2026-11-11", "2026-11-11", "08:00", focus)?.name, "afternoon habit");
});

test("next skips canceled and completed plans, and past dates have no future focus", () => {
    const current = item("active habit", "08:00", "12:00");
    const canceled = item("canceled plan", "09:00", null, { kind: "plan", plan: { status: "canceled" } });
    const completed = item("completed plan", "10:00", null, { kind: "plan", completed: true });
    const next = item("next habit", "16:00");
    const entries = [current, canceled, completed, next];
    const focus = getOverviewFocus(entries, "2026-11-11", "2026-11-11", "08:30");
    assert.equal(getOverviewNext(entries, "2026-11-11", "2026-11-11", "08:30", focus)?.name, "next habit");
    assert.equal(getOverviewNext(entries, "2026-11-10", "2026-11-11", "08:30", focus), null);
});

test("future day without times still displays the next pending plan", () => {
    const first = item("first plan", null, null, { kind: "plan" });
    const second = item("second plan", null, null, { kind: "plan" });
    const entries = [first, second];
    const focus = getOverviewFocus(entries, "2026-11-12", "2026-11-11", "18:00");
    assert.equal(getOverviewNext(entries, "2026-11-12", "2026-11-11", "18:00", focus)?.name, "second plan");
});

test("overview focus labels are outside cards and both kinds use the same tag icon registry", () => {
    const overview = read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    const css = read("src/pages/HabitPage/scss/HabitOverview.scss");
    const sideMenu = read("src/components/ts/SM/HabitsList.tsx");
    assert.match(overview, /className="habitOverviewFocusLabel"/);
    assert.match(overview, /const tag = tags\.find/);
    assert.match(overview, /getOverviewNext\(/);
    assert.match(css, /\.habitOverviewFocusIcon\s*\{/);
    assert.match(sideMenu, /smPlanItem/);
    assert.match(sideMenu, /aria-current=/);
    assert.match(sideMenu, /pathname\.replace/);
});

test("overview focus cards navigate to the selected activity or plan", () => {
    const overview = read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    assert.match(overview, /className="habitOverviewCurrent"/);
    assert.match(overview, /navigate\(entry\.kind === "plan" \?/);
    assert.match(overview, /<ActivityIndicators habit=\{entry\.habit\} plan=\{entry\.plan\}/);
});

test("habit and plan indicators preserve resting colors and active inner_text", () => {
    const indicators = read("src/components/ts/ActivityIndicators.tsx");
    const style = read("src/scss/ActivityIndicators.scss");
    const sm = read("src/components/ts/SM/HabitsList.tsx");
    const day = read("src/pages/HabitPage/components/Overview/HabitOverviewEntries.tsx");
    assert.match(indicators, /getHabitStreakBadge/);
    assert.match(indicators, /PathIcon/);
    assert.match(indicators, /progress\.completed\}\s*\/\s*\{progress\.total/);
    assert.match(style, /\.activityStreak/);
    assert.match(style, /\.habit\.active \.activityIndicators/);
    assert.match(style, /color: var\(--inner_text\)/);
    assert.match(style, /color: var\(--borderWh\)/);
    assert.match(sm, /showIndicators progress=/);
    assert.match(day, /ActivityIndicators/);
});

test("plan filter and reused activity participant picker have consistent routing", () => {
    const data = read("src/components/ts/utils/dayTimeline.ts");
    const filters = read("src/components/context/SideMenuContext.tsx");
    const plan = read("src/pages/Plan/PlanMembers.tsx");
    const picker = read("src/components/modules/HabitParticipantPicker.tsx");
    assert.match(data, /filter === "plans"/);
    assert.match(filters, /value: "plans"/);
    assert.match(plan, /module: "HabitParticipantPicker"/);
    assert.match(picker, /plans\/\$\{planId\}\/invite/);
});

test("deletion of activities does not reuse selected chat message IDs", () => {
    const deleteModal = read("src/components/modules/DeleteConfirm.tsx");
    assert.match(deleteModal, /goal === "mess" && deleteMess\?\.length \? deleteMess : id/);
    assert.match(deleteModal, /if \(deleting\) return/);
    assert.match(deleteModal, /setDeleting\(false\)/);
});
