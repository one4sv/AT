import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");

test("both modal sliders use full-width panels and shared preview", () => {
    for (const [component, stylesheet, panel] of [
        ["components/ChatMedia.tsx", "ChatWithInfo.scss", "chatMediaPanel"],
        ["Redirecting.tsx", "Redirecting.scss", "redirectSlide"]
    ]) {
        const source = read("src/components/modules/"+component);
        const css = read("src/components/modules/scss/"+stylesheet);
        assert.match(source, /useModalSlider\(/);
        assert.match(source, /onPreviewIndexChange=\{slider\.setPreviewIndex\}/);
        assert.match(source, /translate3d\(\$\{-slider\.position \* 100\}%/);
        const start = css.lastIndexOf("."+panel+" {");
        const rule = css.slice(start, start+400);
        assert.match(rule, /flex: 0 0 100%;/);
        assert.match(rule, /max-width: 100%;/);
    }
    assert.doesNotMatch(read("src/components/modules/components/ChatMedia.tsx"), /^\s+layout\s*$/m);
});

test("modal slider ends the gesture even outside its viewport", () => {
    const source = read("src/components/hooks/utils/useModalSlider.ts");
    assert.match(source, /window\.addEventListener\("touchend", end, \{capture: true/);
    assert.match(source, /window\.addEventListener\("touchcancel", cancel, true\)/);
    assert.match(source, /setPreviewIndex\(null\)/);
    assert.match(source, /if \(press\?\.owned\) setDontHandle\(false\)/);
});
