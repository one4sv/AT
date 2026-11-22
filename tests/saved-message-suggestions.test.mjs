import test from "node:test";
import assert from "node:assert/strict";
import { parseSavedMessageSuggestion as parse } from "../src/components/ts/utils/savedMessageSuggestion.ts";

test("future dated notes become a plan", () => {
    assert.deepEqual(parse("31.12 12.00 врач", "2026-11-21", "20:00")?.draft,
        {kind: "plan", name: "врач", date: "2026-12-31", startTime: "12:00"});
    assert.deepEqual(parse("2 марта др кента", "2026-02-20", "14:00")?.draft,
        {kind: "plan", name: "др кента", date: "2026-03-02"});
    assert.equal(parse("2 марта 2027 др кента", "2026-11-21", "14:00")?.draft.date, "2027-03-02");
});

test("future plan with title before numeric date and time", () => {
    const expected = {kind: "plan", name: "Психотерапевт", date: "2026-11-30", startTime: "16:00"};
    assert.deepEqual(parse("Психотерапевт 30.11 16.00", "2026-11-22", "13:00")?.draft, expected);
    assert.deepEqual(parse("Психотерапевт 30.11 в 16:00", "2026-11-22", "13:00")?.draft, expected);
    assert.deepEqual(parse("Психотерапевт 30.11.2026 16:00", "2026-11-22", "13:00")?.draft, expected);
    assert.deepEqual(parse("  Психотерапевт 30.11 16.00  ", "2026-11-22", "13:00"),
        {start: 2, end: 27, draft: expected});
    assert.deepEqual(parse("Dentist 30/11 at 16:00", "2026-11-22", "13:00")?.draft,
        {kind: "plan", name: "Dentist", date: "2026-11-30", startTime: "16:00"});
    assert.deepEqual(parse("Психотерапевт 30.11", "2026-11-22", "13:00")?.draft,
        {kind: "plan", name: "Психотерапевт", date: "2026-11-30"});
    for (const invalid of ["Психотерапевт 20.11 16.00", "Психотерапевт 31.11 16.00",
        "Психотерапевт 30.11 25.00", "Психотерапевт 30.11 16.66",
        "Психотерапевт 22.11 12.00"]) {
        assert.equal(parse(invalid, "2026-11-22", "13:00"), null, invalid);
    }
});

test("daily activity preserves its time range", () => {
    assert.deepEqual(parse("каждый день работа с 12 до 19", "2026-11-21", "20:00")?.draft,
        {kind: "habit", name: "работа", periodicity: "everyday", startTime: "12:00", endTime: "19:00"});
    assert.equal(parse("daily coding from 9 to 17", "2026-11-21", "20:00")?.draft.startTime, "09:00");
});

test("never suggest past dates, passed times or invalid dates", () => {
    for (const value of ["2 марта др кента", "19.11 18.00 врач", "31.02 12.00 врач", "31.12.2025 врач"]) {
        assert.equal(parse(value, "2026-11-21", "12:00"), null);
    }
    assert.equal(parse("21.11 09.00 врач", "2026-11-21", "10:00"), null);
});

test("skip slash commands, random text, URLs and multiline messages", () => {
    for (const value of ["/plan название: врач", "31.12", "привет", "https://a.ru/31.12", "31.12 12.00 врач\nприём"]) {
        assert.equal(parse(value, "2026-11-21", "08:00"), null);
    }
});
