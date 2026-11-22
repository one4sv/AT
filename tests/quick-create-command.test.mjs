import test from "node:test";
import assert from "node:assert/strict";
import { isQuickCreateCommand, parseQuickCreateCommand, quickCommandOnSpace } from "../src/components/ts/utils/quickCreateCommand.ts";

test("recognizes only supported commands", () => {
    assert.equal(isQuickCreateCommand("/act"), true);
    assert.equal(isQuickCreateCommand("/plan название: врач"), true);
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
    const russian = parseQuickCreateCommand("/plan название: Врач; дата: 31.12.2099; начало: 12:00");
    assert.equal(russian?.kind, "plan");
    assert.equal(russian?.date, "2099-12-31");
    assert.equal(russian?.startTime, "12:00");
    const invalid = parseQuickCreateCommand("/plan название: Пример; дата: 31.02.2099");
    assert.equal(invalid?.date, undefined);
    const english = parseQuickCreateCommand("/plan name: Appointment; date: 2099-12-31; time: 10:00 - 11:30");
    assert.equal(english?.endTime, "11:30");
});


test("space after slash command activates inline composer", () => {
    assert.equal(quickCommandOnSpace("/act "), "act");
    assert.equal(quickCommandOnSpace("/plan "), "plan");
    assert.equal(quickCommandOnSpace(" /ACT "), "act");
    assert.equal(quickCommandOnSpace("/act"), null);
    assert.equal(quickCommandOnSpace("/action "), null);
    assert.equal(quickCommandOnSpace("/act text"), null);
    assert.equal(quickCommandOnSpace("/plan\n"), null);
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
