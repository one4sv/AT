import assert from "node:assert/strict";
import test from "node:test";
import { planReminderClock } from "../src/pages/Plan/utils/planReminderClock.ts";

test("plan reminder time is calculated in plan time zone, with a 09:00 fallback", () => {
    assert.equal(planReminderClock("2026-11-22","19:00","Europe/Amsterdam",60),"18:00");
    assert.equal(planReminderClock("2026-11-22",null,"Europe/Amsterdam",60),"08:00");
    assert.equal(planReminderClock("2026-11-22","09:00","Europe/Moscow",10),"08:50");
    assert.equal(planReminderClock("2026-11-22","19:00","Europe/Amsterdam",0),"19:00");
    assert.equal(planReminderClock("2026-11-22","19:00","Europe/Amsterdam",1440),"19:00");
});

test("DST and invalid time zones are handled without invented time", () => {
    assert.equal(planReminderClock("2027-03-28","03:00","Europe/Amsterdam",60),"01:00");
    assert.equal(planReminderClock("2026-11-22",null,"Invalid/Timezone",60),null);
    assert.equal(planReminderClock("2026-11-22",null,undefined,60),null);
    assert.equal(planReminderClock("2026-11-22",null,"UTC",-1),null);
});
