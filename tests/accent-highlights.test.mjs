import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as sass from "sass";
import { applyCustomPalette, getCustomHighlightHex } from "../src/components/ts/utils/customPalette.ts";

const rootPath = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = sass.compileString(
    '@use "src/scss/variables" as vars; @include vars.generate-accent-vars(); @include vars.generate-grad-vars();',
    { loadPaths: [rootPath], logger: sass.Logger.silent }
).css;

function token(theme, group, name, tokenName) {
    const selector = new RegExp('\\[data-theme="?'+theme+'"?\\]\\[data-'+group+'="?'+name+'"?\\]\\s*\\{([^}]+)\\}');
    const block = selector.exec(css)?.[1];
    assert.ok(block, "Missing CSS selector for " + theme + " " + name);
    const value = new RegExp('--'+tokenName+':\\s*([^;]+);').exec(block)?.[1]?.trim();
    assert.ok(value, "Missing "+tokenName+" for "+theme+" "+name);
    return value;
}

function validHighlight(value) {
    return /^#[0-9a-f]{8}$/i.test(value) || /^rgba?\(\s*[\d.%,\s]+\)$/.test(value);
}

test("every preset accent/gradient emits valid highlight for light and dark themes", () => {
    for (const theme of ["light", "dark"]) {
        for (const name of ["poison", "apple", "sky", "space", "orange", "inversion", "abyss"]) {
            const highlight = token(theme, "accent", name, "accent_highlight");
            assert.ok(validHighlight(highlight), theme + " accent " + name + ": " + highlight);
        }
        for (const name of ["meadow", "rubin", "ocean", "violet", "ginger", "mono", "void"]) {
            const highlight = token(theme, "grad", name, "grad_highlight");
            assert.ok(validHighlight(highlight), theme + " grad " + name + ": " + highlight);
        }
    }
    assert.match(token("light", "accent", "inversion", "accent_highlight"), /^(#99999966|rgba\(153,\s*153,\s*153,\s*0\.4\))$/i);
    assert.match(token("dark", "accent", "abyss", "accent_highlight"), /^(#66666666|rgba\(102,\s*102,\s*102,\s*0\.4\))$/i);
    assert.match(token("light", "grad", "mono", "grad_highlight"), /^(#99999966|rgba\(153,\s*153,\s*153,\s*0\.4\))$/i);
    assert.match(token("dark", "grad", "void", "grad_highlight"), /^(#66666666|rgba\(102,\s*102,\s*102,\s*0\.4\))$/i);
});

test("custom highlight remains tinted and visible near theme surfaces", () => {
    assert.equal(getCustomHighlightHex("#ffffff", "light"), "#99999966");
    assert.equal(getCustomHighlightHex("#000000", "dark"), "#66666666");
    assert.equal(getCustomHighlightHex("#ffffff", "dark"), "#ffffff66");
    assert.equal(getCustomHighlightHex("#000000", "light"), "#00000066");
    assert.equal(getCustomHighlightHex("#ff6b00", "light"), "#ff6b0066");
    assert.equal(getCustomHighlightHex("#14b314", "dark"), "#14b31466");
    assert.ok(validHighlight(getCustomHighlightHex("#eeeeee", "light")));
    assert.ok(validHighlight(getCustomHighlightHex("#222222", "dark")));
});

test("custom palette switches highlights with theme and resets overrides on presets", () => {
    const previousDocument = globalThis.document;
    const previousStorage = globalThis.localStorage;
    const inline = new Map();
    let theme = "light";
    const saved = { customAccentHex: "#ffffff", customGradHex: "#000000" };
    globalThis.document = { documentElement: {
        getAttribute: () => theme,
        style: {
            setProperty: (key, value) => inline.set(key, value),
            removeProperty: key => inline.delete(key)
        }
    } };
    globalThis.localStorage = { getItem: key => saved[key] ?? null };
    try {
        applyCustomPalette("custom", "custom");
        assert.equal(inline.get("--accent_highlight"), "#99999966");
        assert.equal(inline.get("--grad_highlight"), "#00000066");
        theme = "dark";
        applyCustomPalette("custom", "custom");
        assert.equal(inline.get("--accent_highlight"), "#ffffff66");
        assert.equal(inline.get("--grad_highlight"), "#66666666");
        applyCustomPalette("inversion", "void");
        assert.equal(inline.has("--accent_highlight"), false);
        assert.equal(inline.has("--grad_highlight"), false);
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
        if (previousStorage === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = previousStorage;
    }
});
