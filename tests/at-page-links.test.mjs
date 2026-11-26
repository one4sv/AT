import assert from "node:assert/strict";
import test from "node:test";
import { normalizeATLink, parseATPageLink } from "../src/pages/Chat/utils/parseATPageLink.ts";
import { parseSettingNavigationLink } from "../src/pages/Settings/Arrays/sharedSettings.ts";
globalThis.window = { location: { origin: "https://achievetogether.vercel.app" } };
test("known internal routes and settings links are recognized without accessing sensitive tokens", () => {
    const url = "https://achievetogether.vercel.app";
    assert.equal(parseSettingNavigationLink(url + "/settings/privacy?setting=plansExceptions").id, "plansExceptions");
    assert.equal(parseATPageLink(url + "/").kind, "feed");
    assert.equal(parseATPageLink(url + "/habit").kind, "activities");
    assert.equal(parseATPageLink(url + "/info/roadmap#history").hash, "#history");
    assert.equal(parseATPageLink(url + "/settings/devices").kind, "devices");
    assert.equal(parseATPageLink(url + "/settings/password?token=secret"), null);
    assert.equal(parseATPageLink(url + "/join/token"), null);
    assert.equal(parseATPageLink(url + "/auth/qr?token=secret"), null);
    assert.equal(parseATPageLink("https://example.com/info/roadmap"), null);
    assert.equal(normalizeATLink("achievetogether.vercel.app/settings/privacy").pathname, "/settings/privacy");
    assert.equal(normalizeATLink("https://achievetogether.vercel.app.example.com"), null);
});
