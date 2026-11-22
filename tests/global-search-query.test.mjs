import { smHeaderPopupPosition } from "../src/components/ts/utils/smHeaderPopupPosition.ts";
import { settingsSearchNavigation } from "../src/pages/Settings/Arrays/settingsSearchNavigation.ts";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { formatSMSearchQuery, parseSMSearchQuery, searchFilters, searchTabFilters, searchTabForFilter, searchSourceFilters, searchResultRank } from "../src/components/ts/utils/globalSearchQuery.ts";

test("search filters preserve query terms and keep one owning section", () => {
    for (const name of searchFilters) {
        const text = "/" + name + " врач";
        assert.deepEqual(parseSMSearchQuery(text), {filter:name,query:"врач"});
        assert.ok(searchTabFilters[searchTabForFilter(name)].includes(name));
    }
    assert.deepEqual(parseSMSearchQuery("врач"), {filter:null,query:"врач"});
    assert.deepEqual(parseSMSearchQuery("/ms"), {filter:"ms",query:""});
    assert.deepEqual(parseSMSearchQuery("/"), {filter:null,query:""});
    assert.deepEqual(parseSMSearchQuery("/com врач"), {filter:null,query:""});
    assert.deepEqual(parseSMSearchQuery("/every врач"), {filter:null,query:""});
    assert.equal(formatSMSearchQuery(null,"врач"),"врач");
    assert.equal(formatSMSearchQuery("plan","врач"),"/plan врач");
    assert.equal(new Set(Object.values(searchTabFilters).flat()).size,searchFilters.length);
    assert.deepEqual(searchTabFilters.spots,[]);
    assert.equal(searchTabForFilter("user"), "chats");
    assert.equal(searchTabFilters.user.includes("user"), false);
});

test("unfiltered search loads section-specific categories and only expands when typed", () => {
    assert.deepEqual(searchSourceFilters("chats", null, ""), ["user"]);
    assert.deepEqual(searchSourceFilters("chats", null, "врач"), ["user", "ms"]);
    assert.deepEqual(searchSourceFilters("habits", null, ""), ["habit", "plan"]);
    assert.deepEqual(searchSourceFilters("user", null, ""), ["setting"]);
    assert.deepEqual(searchSourceFilters("user", null, "новости"), ["post", "setting"]);
    assert.deepEqual(searchSourceFilters("user", "post", ""), []);
    assert.deepEqual(searchSourceFilters("chats", "group", ""), ["group"]);
});

test("unfiltered search groups contacts and owned entities before other entities", () => {
    for (const [tab, data, expected] of [
        ["chats", [{kind:"ms"}, {kind:"user"}, {kind:"contact"}], ["contact","user","ms"]],
        ["habits", [
            {kind:"plan", mine:false}, {kind:"habit", mine:false},
            {kind:"plan", mine:true}, {kind:"habit", mine:true}
        ], ["habit","plan","habit","plan"]],
        ["user", [{kind:"post", mine:false}, {kind:"post", mine:true}, {kind:"setting"}], ["setting","post","post"]]
    ]) {
        const sorted = data.slice().sort((a,b) => searchResultRank(tab,a)-searchResultRank(tab,b));
        assert.deepEqual(sorted.map(x=>x.kind), expected);
        if (tab === "habits") assert.deepEqual(sorted.map(x=>x.mine), [true,true,false,false]);
        if (tab === "user") assert.deepEqual(sorted.map(x=>x.mine), [undefined,true,false]);
    }
});

test("header filter menu centers on its trigger and clamps within the SideMenu", () => {
    assert.deepEqual(smHeaderPopupPosition(300, 100, 140, 100), {left:100,width:140});
    assert.deepEqual(smHeaderPopupPosition(300, 5, 45, 180), {left:8,width:180});
    assert.deepEqual(smHeaderPopupPosition(300, 270, 40, 160), {left:132,width:160});
    assert.deepEqual(smHeaderPopupPosition(300, 0, 300, 160), {left:8,width:284});
});

test("settings search in SideMenu navigates to the same target and highlights the exact setting", () => {
    assert.deepEqual(settingsSearchNavigation("gen", {id:"timeZone", name:"Часовой пояс"}), {
        pathname:"/settings/gen",
        state:{from:"/settings", settingId:"timeZone", settingName:"Часовой пояс"}
    });
    assert.deepEqual(settingsSearchNavigation("notes", {id:"planReminders", name:"Напоминания планов"}), {
        pathname:"/settings/notes",
        state:{from:"/settings", settingId:"planReminders", settingName:"Напоминания планов"}
    });
    assert.equal(settingsSearchNavigation("pers", {id:"bg",name:"Задний фон"}).pathname, "/wallpapers");
    assert.equal(settingsSearchNavigation("gen", {id:"language",name:"Язык"}).pathname, "/settings/language");
});

test("header glass samples content below it instead of masking the list", () => {
    const list = readFileSync(new URL("../src/scss/SM/sideMenu.scss", import.meta.url), "utf8");
    const header = readFileSync(new URL("../src/scss/SM/smHeader.scss", import.meta.url), "utf8");
    const wrapper = list.match(/\.ListWrapper\s*\{([^}]*)\}/s)?.[1] || "";
    assert.doesNotMatch(wrapper, /(?:-webkit-)?mask-image/);
    assert.match(header, /backdrop-filter:\s*blur\(2px\)/);
    assert.match(header, /background:\s*color-mix\(in srgb, var\(--mc\) 25%, transparent\)/);
});

test("normal and search lists have the same visual top offset below SMheader", () => {
    const plain = readFileSync(new URL("../src/scss/SM/sideMenu.scss", import.meta.url), "utf8");
    const search = readFileSync(new URL("../src/scss/SM/globalSearch.scss", import.meta.url), "utf8");
    const normalRule = plain.match(/\.SMlist\s*\{([^}]+)\}/s)?.[1] ?? "";
    const searchRule = search.match(/\.SMlist\.smSearchResults\s*\{([^}]+)\}/s)?.[1] ?? "";
    const offset = (style, property) => Number(
        style.match(new RegExp(property + ":\\s*([\\d.]+)dvh"))?.[1] ?? 0
    );
    assert.equal(offset(normalRule, "margin-top"),
        offset(searchRule, "margin-top") + offset(searchRule, "padding-top"));
});
