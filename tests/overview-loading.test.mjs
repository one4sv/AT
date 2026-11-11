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
const { getOverviewFocus } = mod.exports;

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
    assert.match(nav, /if \(loadingUser\) return/);
    assert.match(nav, /onLoad=\{\(\) => setStatus\("ready"\)\}/);
    assert.equal((nav.match(/\{searchControl\}/g) || []).length, 2);
});

test("plan schedule border remains one pixel without layout shift on hover", () => {
    const styles = read("src/pages/HabitPage/scss/Schedule.scss");
    assert.match(styles, /\.planScheduleBlock \{/);
    assert.match(styles, /border: 1px solid transparent;/);
    assert.match(styles, /border-color: var\(--tc\);/);
    assert.match(styles, /padding: 1dvh 3vw;/);
});
