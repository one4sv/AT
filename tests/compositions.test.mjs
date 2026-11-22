import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
    EMPTY_COMPOSITIONS, MAX_COMPOSITIONS, COMPOSITIONS_KEY, COMPOSITIONS_BOOT_KEY,
    chooseComposition, compositionDayKey, compositionWeekday,
    normalizeCompositionStore, writeCompositionAppearance,
    writeCompositionBootstrap, initializeOpeningComposition
} from "../src/components/ts/utils/compositions.ts";

const fixture = (id, bg = "color") => ({
    id, name: "Composition " + id, appearance: {
        theme: "dark", accent: "custom", grad: "custom",
        customAccentHex: "#abcabc", customGradHex: "#123456",
        decor: "glass", blur: 6, layout: "hidden",
        showMobileMenuOnStart: false, startupSideMenuTab: "habits",
        bg, bgUrl: "/api/private-asset/bgs/example.webp",
        bgEffects: { blur: 4, movement: true, speed: 2, filter: "sepia" },
        wallpaperStyle: { logoEnabled: true, fillMode: "gradient",
            fillColor: "#112233", fillGrad: "#223344", logoMode: "solid",
            logoColor: "#445566", logoGrad: "#556677", logoGlow: 80 },
        contourPattern: "chaos", contourSize: 1.5,
        artPattern: "order", artSize: .75
    }
});
const store = (mode, more = {}) => ({
    ...EMPTY_COMPOSITIONS,
    mode,
    items: [fixture("a"), fixture("b"), fixture("c")],
    activeId: "a",
    ...more
});
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("composition snapshots include all wallpaper/logo/SideMenu settings but no font size", () => {
    const sample = fixture("a").appearance;
    assert.deepEqual(Object.keys(sample.wallpaperStyle).sort(),
        ["logoEnabled","fillMode","fillColor","fillGrad","logoMode","logoColor","logoGrad","logoGlow"].sort());
    assert.deepEqual(Object.keys(sample.bgEffects).sort(), ["blur","movement","speed","filter"].sort());
    assert.equal(sample.showMobileMenuOnStart,false);
    assert.equal(sample.startupSideMenuTab,"habits");
    for (const excluded of ["fontSize","lang","dateFormat","timeFormat","timeZone","note"]) {
        assert.ok(!(excluded in sample));
    }
    assert.equal(MAX_COMPOSITIONS,10);
    assert.deepEqual(normalizeCompositionStore({ ...store("manual"),
        items: Array.from({ length: 14 }, (_, i) => fixture(String(i))) }).items.length,10);
});

test("opening rotates, daily holds until tomorrow, weekday picks assigned slot", () => {
    const mon = new Date(2026,10,23,9,0,0);
    const tue = new Date(2026,10,24,9,0,0);
    assert.equal(compositionDayKey(mon),"2026-11-23");
    assert.equal(compositionWeekday(mon),0);
    assert.equal(chooseComposition(store("open"),mon,()=>0,false),null);
    assert.equal(chooseComposition(store("open"),mon,()=>0,true)?.composition.id,"b");
    const daily = chooseComposition(store("daily"),mon,()=>0,true);
    assert.equal(daily?.composition.id,"b");
    assert.equal(chooseComposition(daily.store,mon,()=>0,true),null);
    assert.equal(chooseComposition(daily.store,tue,()=>0,true)?.composition.id,"a");
    const weekly = store("weekly", {weekdays:["c","b",null,null,null,null,null]});
    const monday = chooseComposition(weekly,mon,()=>0,false);
    assert.equal(monday?.composition.id,"c");
    assert.equal(chooseComposition(monday.store,mon,()=>0,false),null);
    assert.equal(chooseComposition(monday.store,tue,()=>0,false)?.composition.id,"b");
    assert.equal(chooseComposition(store("weekly"),mon),null);
});

test("deleted slots and invalid storage are safely normalized", () => {
    assert.deepEqual(normalizeCompositionStore(null),EMPTY_COMPOSITIONS);
    const normalized = normalizeCompositionStore({ ...store("weekly"),
        activeId:"missing", weekdays:["a","missing","b"], mode:"unknown"
    });
    assert.equal(normalized.activeId,null);
    assert.equal(normalized.weekdays[1],null);
    assert.equal(normalized.weekdays.length,7);
    assert.equal(normalized.mode,"manual");
});

test("prepaint initialization writes the account-scoped settings and custom palettes", () => {
    const local = new Map();
    const previous = globalThis.localStorage;
    globalThis.localStorage = {
        getItem:key=>local.has(key)?local.get(key):null,
        setItem:(key,value)=>{local.set(key,value);},
        removeItem:key=>{local.delete(key);}
    };
    try {
        const appearance = fixture("a","logo").appearance;
        writeCompositionAppearance(appearance,"testuser");
        assert.equal(JSON.parse(local.get("testuser_settings_wallpaper_style")).logoGlow,80);
        assert.equal(JSON.parse(local.get("testuser_settings_bg_effects")).speed,2);
        assert.equal(JSON.parse(local.get("testuser_settings_bg")),"logo");
        assert.equal(JSON.parse(local.get("settings_theme")),"dark");
        assert.equal(local.get("customAccentHex"),"#abcabc");
        assert.equal(local.get("customGradHex"),"#123456");
        assert.equal(JSON.parse(local.get("at_startup_preferences")).settings_mobile_start_menu,false);
        assert.equal(local.has("testuser_settings_font_size"),false);

        const configured = store("open");
        writeCompositionBootstrap("testuser",configured);
        local.set("testuser_"+COMPOSITIONS_KEY,JSON.stringify(configured));
        initializeOpeningComposition();
        const updated = JSON.parse(local.get("testuser_"+COMPOSITIONS_KEY));
        assert.equal(updated.items.length,3);
        assert.notEqual(updated.activeId,"a");
        assert.equal(JSON.parse(local.get(COMPOSITIONS_BOOT_KEY)).state.activeId,updated.activeId);
    } finally {
        globalThis.localStorage = previous;
    }
});

test("UI is in Interface bottom with responsive 2/4/5 cards and localized search", () => {
    const page = read("src/pages/Settings/components/SettingsTabs/PersSettingTab.tsx");
    const preview = read("src/pages/Settings/components/CompositionsSettings.tsx");
    const styles = read("src/pages/Settings/scss/compositions.scss");
    const search = read("src/pages/Settings/Arrays/searchableSettings.ts");
    const init = read("src/theme-init.ts");
    assert.ok(page.indexOf("<CompositionsSettings search={search}/>") > page.indexOf('data-setting-id="layout"'));
    assert.match(styles,/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(styles,/@container \(min-width: 560px\)/);
    assert.match(styles,/@container \(min-width: 850px\)/);
    assert.match(search,/id: "compositions"/);
    assert.match(preview,/wallpaperStyle/);
    assert.match(preview,/t\("personalization\.compositions\." \+ key, vars\)/);
    assert.match(preview,/compositionWeekdays/);
    assert.match(init,/initializeOpeningComposition\(\)/);
    for (const lang of ["ru","en"]) {
        const dictionary = JSON.parse(read("src/i18n/locales/"+lang+"/settings.json"));
        assert.equal(typeof dictionary.personalization.compositions.title,"string");
        assert.equal(typeof dictionary.personalization.compositions.modeHint_weekly,"string");
        for (const key of ["title", "description", "saveCurrent", "rotation", "manual", "modeHint_manual", "localHint", "overwrite", "day_mon"]) {
            const value = dictionary.personalization.compositions[key];
            assert.equal(typeof value, "string", lang + ": " + key);
            assert.ok(value.length > 0 && !value.startsWith("compositions."), lang + ": unresolved " + key);
        }
    }
});

test("composition actions use the global ContextMenu rather than a local popup", () => {
    const page = read("src/pages/Settings/components/CompositionsSettings.tsx");
    const menu = read("src/components/ts/ContextMenu/menus/CompositionMenu.tsx");
    const renderer = read("src/components/ts/ContextMenu/ContextMenu.tsx");
    const context = read("src/components/context/ContextMenuContext.tsx");
    const style = read("src/pages/Settings/scss/compositions.scss");

    assert.match(page, /useContextMenu\(\)/);
    assert.match(page, /openMenu\(x, y, "composition", \{/);
    assert.match(page, /data-context-menu="true" data-context-menu-allow-button="true"/);
    assert.match(page, /onContextMenu=\{event => onCompositionContextMenu\(event, item\)\}/);
    assert.match(page, /aria-haspopup="menu"/);
    assert.match(renderer, /case "composition":\s*return <CompositionMenu \/>/);
    assert.match(context, /onDuplicate\?: \(\) => void/);
    assert.match(menu, /onEdit/);
    assert.match(menu, /onSave/);
    assert.match(menu, /onDuplicate/);
    assert.match(menu, /onDelete/);
    assert.ok(menu.lastIndexOf('label("remove")') > menu.lastIndexOf('label("duplicate")'));
    assert.doesNotMatch(page, /compositionActions|menuId|menuRef/);
    assert.doesNotMatch(style, /\.compositionActions|\.compositionMenuAnchor/);
});
