import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("startup preferences are per-account local settings with compatibility defaults", () => {
    const ctx = read("src/components/context/SettingsContext.tsx");
    for (const key of ["settings_startup_page","settings_mobile_start_menu","settings_mobile_start_tab"]) {
        assert.ok(ctx.includes(key));
    }
    assert.match(ctx,/useLocalStorage<StartupPage>\(LOCAL_KEYS\.startupPage, "feed"\)/);
    assert.match(ctx,/useLocalStorage<boolean>\(LOCAL_KEYS\.showMobileMenuOnStart, true\)/);
    assert.match(ctx,/useLocalStorage<StartupSideMenuTab>\(LOCAL_KEYS\.startupSideMenuTab, "chats"\)/);
    const storage = read("src/components/hooks/utils/useLocalStorage.ts");
    assert.match(storage,/GLOBAL_KEYS = \["settings_theme", "settings_lang"\]/);
});

test("launch redirects only the initial root navigation and leaves direct links alone", () => {
    const app = read("src/App.tsx");
    assert.match(app,/const checked = useRef\(false\)/);
    assert.match(app,/checked\.current = true/);
    assert.match(app,/location\.pathname === "\/" && startupPage === "habits"/);
    assert.match(app,/navigate\("\/habit", \{ replace: true, state: \{ startup: true \} \}\)/);
    assert.match(app,/<StartupNavigation \/>/);
});

test("mobile startup menu applies after settings load and chooses the desired tab", () => {
    const menu = read("src/components/context/SideMenuContext.tsx");
    assert.match(menu,/!settingsLoaded \|\| !showMobileMenuOnStart/);
    assert.match(menu,/mobileStartupApplied\.current = true/);
    assert.match(menu,/setActiveTab\(startupSideMenuTab\)/);
    assert.match(menu,/setTranslateX\(shouldOpen \? 0 : -100\)/);
    assert.match(menu,/!location\.state\?\.startup/);
});

test("General uses existing RadioGroup and Toggler, mobile-only controls are gated", () => {
    const ui = read("src/pages/Settings/components/SettingsTabs/GeneralTab.tsx");
    assert.match(ui,/id="startupPage"/);
    assert.match(ui,/val=\{startupPage\}/);
    assert.match(ui,/isMobile &&/);
    assert.match(ui,/<Toggler state=\{showMobileMenuOnStart\}/);
    assert.match(ui,/showMobileMenuOnStart && <div className="settingInnerWrapper"/);
    assert.match(ui,/id="startupSideMenuTab"/);
    for (const lang of ["ru","en"]) {
        const texts = JSON.parse(read("src/i18n/locales/" + lang + "/settings.json"));
        for (const key of ["startupTitle","startupPage","startupFeed","startupHabits",
            "showMobileMenuOnStart","startupSideMenuTab","startupChats","startupActivities"]) {
            assert.ok(texts.general[key]);
        }
    }
});
