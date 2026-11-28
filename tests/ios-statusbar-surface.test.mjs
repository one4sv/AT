import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("iOS headers retain clearance below the native blur edge without sampling hacks", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("../src/scss/_global.scss", import.meta.url), "utf8");
    assert.doesNotMatch(html, /atStatusBarSurface/);
    assert.doesNotMatch(css, /atStatusBarSurface/);
    assert.match(css, /--at-header-gap: 20px;/);
    assert.match(css, /--at-page-header-gap: 20px;/);
    assert.match(css, /&\[data-at-keyboard="true"\]\s*\{\s*--at-header-gap: 0px;\s*--at-page-header-gap: 0px;/);
    assert.match(html, /content="black-translucent"/);
});
