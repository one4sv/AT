import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("privacy exceptions stay inside their parent settings and out of the shared search/command catalog", () => {
    const catalog = readFileSync(new URL("../src/pages/Settings/Arrays/searchableSettings.ts", import.meta.url), "utf8");
    const exceptions = readFileSync(new URL("../src/pages/Settings/components/PrivacyExceptions.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(catalog, /(?:profile|habits|posts|plans|activity|plan-invite|group)Exceptions|catalog\.exceptions/);
    assert.match(exceptions, /data-setting-id=\{mode \+ "Exceptions"\}/);
});
