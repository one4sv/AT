import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = read("src/components/ts/utils/dateToStr.ts");
const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
}).outputText;
const mod = { exports: {} };
const i18n = { resolvedLanguage: "ru", t: key => key };
new Function("module", "exports", "require", compiled)(mod, mod.exports, () => ({ __esModule: true, default: i18n }));
const dates = mod.exports;
globalThis.document = { documentElement: { dataset: { dateFormat: "standart", timeFormat: "twentyFour",
    timeZone: "Europe/Moscow" } } };

test("absolute instants shift date and clock with selected IANA zone", () => {
    const instant = new Date("2026-11-12T23:30:00Z");
    assert.equal(dates.dateInAppZone(instant), "2026-11-13");
    assert.equal(dates.clockInAppZone(instant), "02:30");
    document.documentElement.dataset.timeZone = "America/New_York";
    assert.equal(dates.dateInAppZone(instant), "2026-11-12");
    assert.equal(dates.clockInAppZone(instant), "18:30");
});

test("plan civil dates do not move when time zone changes", () => {
    for (const zone of ["Pacific/Honolulu", "Asia/Tokyo", "Europe/Luxembourg"]) {
        document.documentElement.dataset.timeZone = zone;
        assert.equal(dates.formatAppDate("2026-11-12"), "12.11.2026");
        assert.equal(dates.formatDateFromString("2026-11-12"), "12.11.2026");
        assert.equal(dates.shiftCalendarDay("2026-03-29", 1), "2026-03-30");
    }
});

test("twelve-hour format affects timestamp clock without changing its instant", () => {
    document.documentElement.dataset.timeZone = "America/New_York";
    document.documentElement.dataset.timeFormat = "twelve";
    assert.match(dates.formatAppTime("2026-11-12T23:30:00Z"), /6:30|06:30/);
    assert.equal(dates.formatClock("18:30"), "6:30 PM");
});

test("relative today and tomorrow share configured timezone", () => {
    document.documentElement.dataset.timeZone = "Europe/Moscow";
    const today = dates.todayStrFunc();
    const tomorrow = dates.shiftCalendarDay(today, 1);
    assert.equal(dates.relativePlanDay(today, key => key), "chatUi.today");
    assert.equal(dates.relativePlanDay(tomorrow, key => key), "sideMenu.tomorrow");
    assert.equal(dates.formatDateLabel(tomorrow).includes("sideMenu.tomorrow"), true);
});

test("settings and date consumers use the central timezone", () => {
    const context = read("src/components/context/SettingsContext.tsx");
    const general = read("src/pages/Settings/components/SettingsTabs/GeneralTab.tsx");
    const overview = read("src/pages/HabitPage/components/Overview/HabitOverviewLayout.tsx");
    const chat = read("src/pages/Chat/utils/DateDivider.tsx");
    const schedule = read("src/pages/HabitPage/components/Schedule/ScheduleBlock.tsx");
    assert.match(context, /settings_time_zone/);
    assert.match(context, /dataset\.timeZone/);
    assert.match(general, /SelectList className="generalTimeZoneSelect"/);
    assert.match(general, /const representative = new Map<number, string>\(\)/);
    assert.match(general, /for \(let hour = -12; hour <= 14; hour\+\+\)/);
    assert.match(general, /representative\.set\(minutes, timeZone\)/);
    assert.match(overview, /clockInAppZone\(\)/);
    assert.match(chat, /dateInAppZone/);
    assert.match(schedule, /clockInAppZone/);
});
