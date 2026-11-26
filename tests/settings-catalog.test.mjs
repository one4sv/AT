import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("privacy exception entries have distinct localized names and entity icons", () => {
    const catalog = readFileSync(new URL("../src/pages/Settings/Arrays/searchableSettings.ts", import.meta.url), "utf8");
    const exceptions = readFileSync(new URL("../src/pages/Settings/components/PrivacyExceptions.tsx", import.meta.url), "utf8");
    const entries = [...catalog.matchAll(/id: "(\w+(?:-\w+)?Exceptions)", name: t\("catalog\.exceptions\.(\w+)"\), icon: LockIcon,[^\n]+icon2: (\w+)/g)];
    assert.equal(entries.length, 7);
    assert.equal(new Set(entries.map(entry => entry[1])).size, 7);
    assert.doesNotMatch(catalog, /name: t\("catalog\.exceptions"\)/);
    for (const locale of ["ru", "en"]) {
        const translations = JSON.parse(readFileSync(new URL("../src/i18n/locales/" + locale + "/settings.json", import.meta.url), "utf8")).catalog.exceptions;
        const labels = entries.map(entry => translations[entry[2]]);
        assert.equal(new Set(labels).size, 7);
        assert.ok(labels.every(label => typeof label === "string" && label.length > 12));
    }
    assert.match(exceptions, /data-setting-id=\{mode \+ "Exceptions"\}/);
});


test("setting navigation targets have a low-specificity rounded highlight surface", () => {
    const css = readFileSync(new URL("../src/pages/Settings/scss/settings.scss", import.meta.url), "utf8");
    assert.match(css, /:where\(\.settingTab \[data-setting-id\]\)\s*\{\s*border-radius: 24px;/);
});
