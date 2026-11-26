import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("chat action swipe previews the neighbour before committing the mode", () => {
    const source = readFileSync(new URL("../src/pages/Chat/components/ChatActionPanel.tsx", import.meta.url), "utf8");
    assert.match(source, /else setHorizontalOffset\(press\.startHorizontal \+ dx \/ press\.width \* 100\)/);
    assert.match(source, /animateHorizontal\(direction === 1 \? -100 : 100, \(\) => \{\s*setChosenMess\(\[\]\);\s*setActiveHeader\(next\)/);
    assert.match(source, /if \(press\?\.axis === "x"\) animateHorizontal\(0\)/);
    assert.match(source, /inert=\{!active\}/);
    assert.match(source, /modes\.length === 2\s*\? \(horizontalOffset > 0 \? -1 : 1\)/);
});
