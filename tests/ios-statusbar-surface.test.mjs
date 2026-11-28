import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("iOS status-bar sampling surface is empty, fixed, noninteractive and outside React root", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("../src/scss/_global.scss", import.meta.url), "utf8");
    assert.match(html, /<div class="atStatusBarSurface" aria-hidden="true"><\/div>\s*<div id="root"><\/div>/);
    assert.match(css, /\.atStatusBarSurface\s*\{\s*display: none;/);
    const rule = css.match(/html\[data-ios-pwa="true"\] body > \.atStatusBarSurface\s*\{([^}]+)\}/)?.[1];
    assert.ok(rule);
    for (const declaration of ["position: fixed", "height: 11px", "width: 100%", "pointer-events: none", "background-color: var(--bgc", "-webkit-background-clip: text", "background-clip: text"]) {
        assert.ok(rule.includes(declaration), declaration);
    }
    assert.doesNotMatch(rule, /opacity:\s*0|visibility:\s*hidden/);
});
