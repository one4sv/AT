import assert from "node:assert/strict";
import test from "node:test";
import { parseSettingCommand, parseSettingLink, parseSettingNavigationLink, settingLink } from "../src/pages/Settings/Arrays/sharedSettings.ts";

globalThis.window = { location: { origin: "https://achievetogether.vercel.app" } };

test("settings commands validate values and leave ordinary messages alone", () => {
    assert.deepEqual(parseSettingCommand("/settings background blur 12"), {
        input: "background blur 12", setting: "background blur", value: "12"
    });
    assert.equal(parseSettingCommand("/settings background blur 31").value, null);
    assert.equal(parseSettingCommand("/settings theme system").value, "system");
    assert.equal(parseSettingCommand("/settings context edges off").value, "off");
    assert.equal(parseSettingCommand("/settings-example"), null);
});

test("setting links preserve values and reject other origins, paths and invalid values", () => {
    const url = settingLink("background blur", "12");
    assert.deepEqual(parseSettingLink(url), { setting: "background blur", value: "12" });
    assert.equal(parseSettingLink(url.replace("achievetogether.vercel.app", "example.org")), null);
    assert.equal(parseSettingLink(url.replace("/pers", "/gen")), null);
    assert.equal(parseSettingLink(url.replace("value=12", "value=31")), null);
    assert.equal(parseSettingLink("http://["), null);
});


test("local and shared setting roots use identical value validation", () => {
    assert.deepEqual(parseSettingCommand("/set theme dark"), parseSettingCommand("/settings theme dark"));
    assert.equal(parseSettingCommand("/set theme invalid").value, null);
    assert.equal(parseSettingCommand("/setting"), null);
});


test("navigation-only settings cards do not apply preset values", () => {
    assert.deepEqual(parseSettingNavigationLink("https://achievetogether.vercel.app/settings/security?setting=showLinkPreview"), {
        section: "security", id: "showLinkPreview", pathname: "/settings/security", search: "?setting=showLinkPreview"
    });
    assert.equal(parseSettingNavigationLink("https://achievetogether.vercel.app/wallpapers").id, "bg");
    assert.equal(parseSettingNavigationLink(settingLink("theme", "dark")), null);
    assert.equal(parseSettingNavigationLink("https://example.com/settings"), null);
    assert.equal(parseSettingNavigationLink("https://achievetogether.vercel.app/settings/unknown"), null);
});
