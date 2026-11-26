import test from "node:test";
import assert from "node:assert/strict";
import { isQuickCreateCommand, parseQuickCreateCommand, quickCommandOnSpace } from "../src/components/ts/utils/quickCreateCommand.ts";

test("recognizes only supported commands", () => {
    assert.equal(isQuickCreateCommand("/act"), true);
    assert.equal(isQuickCreateCommand("/do название: врач"), true);
    assert.equal(isQuickCreateCommand("hello /act"), false);
    assert.equal(isQuickCreateCommand("/active"), false);
    assert.equal(parseQuickCreateCommand("/anything"), null);
});

test("Russian activity fills name, description, period and time", () => {
    assert.deepEqual(parseQuickCreateCommand("/act название: Прогаю; описание: Учиться Go; периодичность: каждый день; время: 12:00–19:00"), {
        kind: "habit", name: "Прогаю", description: "Учиться Go", periodicity: "everyday",
        startTime: "12:00", endTime: "19:00", tag: undefined
    });
});

test("English activity and incomplete templates", () => {
    const english = parseQuickCreateCommand("/act name: Coding; description: Practice TS; periodicity: sometimes; start: 9; end: 17");
    assert.equal(english?.kind, "habit");
    assert.equal(english?.periodicity, "sometimes");
    assert.equal(english?.startTime, "09:00");
    assert.equal(english?.endTime, "17:00");
    const incomplete = parseQuickCreateCommand("/act название: ; описание: ; периодичность: каждый день; начало: ; конец: ");
    assert.equal(incomplete?.name, undefined);
    assert.equal(incomplete?.periodicity, "everyday");
});

test("Plan date and time are normalized, impossible dates rejected", () => {
    const russian = parseQuickCreateCommand("/do название: Врач; дата: 31.12.2099; начало: 12:00");
    assert.equal(russian?.kind, "plan");
    assert.equal(russian?.date, "2099-12-31");
    assert.equal(russian?.startTime, "12:00");
    const invalid = parseQuickCreateCommand("/do название: Пример; дата: 31.02.2099");
    assert.equal(invalid?.date, undefined);
    const english = parseQuickCreateCommand("/do name: Appointment; date: 2099-12-31; time: 10:00 - 11:30");
    assert.equal(english?.endTime, "11:30");
});


test("space after slash command activates inline composer", () => {
    assert.equal(quickCommandOnSpace("/act "), "act");
    assert.equal(quickCommandOnSpace("/do "), "do");
    assert.equal(quickCommandOnSpace(" /ACT "), "act");
    assert.equal(quickCommandOnSpace("/act"), null);
    assert.equal(quickCommandOnSpace("/action "), null);
    assert.equal(quickCommandOnSpace("/act text"), null);
    assert.equal(quickCommandOnSpace("/do\n"), null);
});


test("inline command fields normalize time, date and RU/EN frequency", async () => {
    const { parseQuickFieldTime, parseQuickFieldDate, parseQuickFieldPeriodicity } =
        await import("../src/components/ts/utils/quickCreateCommand.ts");
    assert.equal(parseQuickFieldTime("9"), "09:00");
    assert.equal(parseQuickFieldTime("12.30"), "12:30");
    assert.equal(parseQuickFieldTime("24:00"), undefined);
    assert.equal(parseQuickFieldDate("22.11.2026"), "2026-11-22");
    assert.equal(parseQuickFieldDate("2026-11-22"), "2026-11-22");
    assert.equal(parseQuickFieldDate("31.02.2026"), undefined);
    assert.equal(parseQuickFieldPeriodicity("каждый день"), "everyday");
    assert.equal(parseQuickFieldPeriodicity("Every day"), "everyday");
    assert.equal(parseQuickFieldPeriodicity("несколько дней в неделю"), "weekly");
    assert.equal(parseQuickFieldPeriodicity("Cyclic"), "cycle");
    assert.equal(parseQuickFieldPeriodicity("иногда"), "sometimes");
    assert.equal(parseQuickFieldPeriodicity("random"), undefined);
});


test("single TA positional fields preserve quoted text and skip optional description", async () => {
    const { parseQuickInput } = await import("../src/components/ts/utils/quickCreateCommand.ts");
    assert.equal(parseQuickInput("/act ")?.field, "name");
    assert.equal(parseQuickInput("/do \"Visit doctor\"  31.12.2099")?.draft.date, "2099-12-31");
    assert.equal(parseQuickInput("/do \"Visit doctor\"  31.12.2099")?.draft.name, "Visit doctor");
    assert.equal(parseQuickInput("/act Gym  weekly 1,3 9 10")?.draft.weeklyDays, "1,3");
    assert.equal(parseQuickInput("/act Gym  cycle 2 2")?.draft.cycleRest, "2");
    assert.equal(parseQuickInput("/ac"), null);
    assert.equal(parseQuickInput("/plan Doctor"), null);
    assert.equal(isQuickCreateCommand("/plan"), false);
    assert.equal(parseQuickInput("/do Doctor")?.draft.date, undefined);
});


test("todo uses positional inline fields and defaults to manual progress", async () => {
    const {parseQuickInput} = await import("../src/components/ts/utils/quickCreateCommand.ts");
    const basic=parseQuickInput('/todo "Read books"');
    assert.equal(basic.draft.kind,"goal");
    assert.equal(basic.draft.goalMode,"manual");
    assert.equal(basic.draft.name,"Read books");
    const metric=parseQuickInput('/todo "Read books" "" 01.06.2027 metric 0 20 books');
    assert.equal(metric.draft.date,"2027-06-01");
    assert.equal(metric.draft.metricTarget,"20");
    assert.equal(metric.field,"metricUnit");
    assert.equal(metric.overflow,false);
    assert.equal(parseQuickInput('/todo Goal "" 31.02.2027').draft.date,undefined);
    assert.equal(parseQuickInput('/todo Goal "" "" invalid').draft.goalMode,undefined);
});
