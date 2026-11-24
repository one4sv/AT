import test from "node:test";
import assert from "node:assert/strict";
import { numberInputValue } from "../src/components/ts/utils/numberInputValue.ts";
import { previewGoalProgress } from "../src/pages/HabitPage/components/Overview/goalTypes.ts";

test("clearing a number is distinct from typing zero, decimals or a negative metric", () => {
    for (const [value, expected] of [["",""],["0",0],["0.25",0.25],["-2",-2]]) {
        assert.equal(numberInputValue({value,valueAsNumber:value === "" ? NaN : Number(value)}),expected);
    }
});

test("optimistic progress honors explicit zero, legacy weights and decreasing metrics", () => {
    const goal = {progress_mode:"milestones",metric_start:100,metric_target:0,metric_current:50,metric_share:0.5};
    const first = {id:1,position:0,weight:1,completed_at:"now"};
    const second = {id:2,position:1,weight:3,completed_at:null};
    assert.equal(previewGoalProgress({...goal,stages:[first,second]}),25);
    assert.equal(previewGoalProgress({...goal,stages:[{...first,completion_percent:0},second]}),0);
    assert.equal(previewGoalProgress({...goal,progress_mode:"combined",stages:[first,second]}),37.5);
    assert.equal(previewGoalProgress({...goal,progress_mode:"metric",metric_current:150}),0);
});
