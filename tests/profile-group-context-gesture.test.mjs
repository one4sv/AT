import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");

test("Acc and Group keep context ownership until touch release", () => {
    const menu = read("src/components/hooks/utils/useLongPressContextMenu.ts");
    assert.match(menu, /current\.triggered = true;\s*window\.dispatchEvent\(new Event\("at-context-gesture-start"\)\)/);
    for (const path of ["src/pages/Acc/Acc.tsx", "src/pages/Group/Group.tsx"]) {
        const source = read(path);
        assert.match(source, /window\.addEventListener\("at-context-gesture-start", blockContextGesture\)/);
        assert.match(source, /if \(contextGesture\.current \|\| menu\.visible \|\| e\.defaultPrevented\)/);
        assert.match(source, /if \(contextGesture\.current \|\| menu\.visible\) \{\s*blockContextGesture\(\);\s*touchActive\.current = false;\s*contextGesture\.current = false;/);
        assert.match(source, /menu\.visible \? " accContentLocked"/);
    }
});

test("account navigation uses four main cards and single-line descriptions", () => {
    const source = read("src/components/ts/SM/AccountList.tsx");
    assert.equal((source.match(/className=\{\x60SMmainButt /g) || []).length, 4);
    const style = read("src/scss/SM/smAccount.scss");
    assert.match(style, /\.SMmainButtDesc\s*\{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/);
    for (const lang of ["ru", "en"]) {
        const locale = JSON.parse(read("src/i18n/locales/"+lang+"/common.json"));
        assert.ok(locale.accountNavigation.settingsDesc);
        assert.ok(locale.accountNavigation.savedDesc);
        assert.ok(locale.sideMenu.plansAndActivities);
    }
});
