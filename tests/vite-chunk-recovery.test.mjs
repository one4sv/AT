import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const vite = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

test("all modal and lazy-page CSS is loaded from the initial stylesheet", () => {
    assert.match(vite, /cssCodeSplit:\s*false/);
});

test("SPA fallback excludes missing JS assets, without breaking client routes", () => {
    const source = config.rewrites.find(item => item.destination === "/index.html")?.source;
    assert.ok(source, "SPA rewrite required");
    const matches = new RegExp("^" + source + "$");
    assert.equal(matches.test("/assets/HabitPage-ByXygUFM.js"), false);
    assert.equal(matches.test("/assets/EmojiBar-DUtVdROy.js"), false);
    assert.equal(matches.test("/api/user"), false);
    assert.equal(matches.test("/habit/19"), true);
    assert.equal(matches.test("/settings/acc"), true);
    assert.equal(matches.test("/wallpapers/japan"), true);
});

test("SPA HTML is revalidated, while fingerprinted JS remains immutable", () => {
    const globalHeader = config.headers.find(item => item.source.startsWith("/((?!api/|assets/"));
    assert.ok(globalHeader?.headers.some(item =>
        item.key === "Cache-Control" && item.value.includes("must-revalidate")
    ));
    const assetHeader = config.headers.find(item => item.source === "/assets/(.*)");
    assert.ok(assetHeader?.headers.some(item =>
        item.key === "Cache-Control" && item.value.includes("immutable")
    ));
});

test("missing chunk recovery retries once, avoiding an endless reload loop", () => {
    const match = html.match(/<script>\s*(\/\/ Vite lazy chunks[\s\S]*?)<\/script>/);
    assert.ok(match, "early recovery script must be included in HTML");

    const listeners = new Map();
    const storage = new Map();
    const location = { origin: "https://at.test", count: 0, reload() { this.count += 1; } };
    let warning = 0;
    const context = {
        navigator: { onLine: true },
        location,
        Date,
        sessionStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); },
            removeItem(key) { storage.delete(key); }
        },
        window: { addEventListener(name, listener) { listeners.set(name, listener); } },
        document: {
            body: null,
            getElementById() { return null; },
            addEventListener(name) { if (name === "DOMContentLoaded") warning++; }
        }
    };
    runInNewContext("(function() { " + match[1] + " })()", context);

    let prevented = false;
    listeners.get("vite:preloadError")({
        preventDefault() { prevented = true; }
    });
    assert.equal(prevented, true);
    assert.equal(location.count, 1);

    listeners.get("vite:preloadError")({ preventDefault() {} });
    assert.equal(location.count, 1);
    assert.equal(warning, 1);

    listeners.get("error")({
        target: {
            tagName: "SCRIPT",
            type: "module",
            src: "https://at.test/assets/HabitPage-old.js"
        }
    });
    assert.equal(location.count, 1);
});

test("missing lazy stylesheet triggers one reload without retrying repeatedly", () => {
    const match = html.match(/<script>\s*(\/\/ Vite lazy chunks[\s\S]*?)<\/script>/);
    assert.ok(match);
    const listeners = new Map();
    const storage = new Map();
    let reloads = 0;
    const context = {
        navigator: { onLine: true },
        location: {
            origin: "https://at.test",
            reload() { reloads++; }
        },
        Date,
        sessionStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); },
            removeItem(key) { storage.delete(key); }
        },
        window: {
            addEventListener(type, callback) { listeners.set(type, callback); }
        },
        document: {
            body: null,
            getElementById() { return null; },
            addEventListener() {}
        }
    };
    runInNewContext("(function() { " + match[1] + " })()", context);
    const linkError = {
        target: {
            tagName: "LINK",
            rel: "stylesheet",
            href: "https://at.test/assets/ChatWithInfo-B0mOxz5V.css"
        }
    };
    listeners.get("error")(linkError);
    assert.equal(reloads, 1);
    listeners.get("error")(linkError);
    assert.equal(reloads, 1);
    listeners.get("error")({
        target: {
            tagName: "LINK",
            rel: "stylesheet",
            href: "https://external.test/styles.css"
        }
    });
    assert.equal(reloads, 1);
});

test("account deletion uses RegForm native checkbox, not a Toggler", () => {
    const tab = readFileSync(
        new URL("../src/pages/Settings/components/SettingsTabs/AccSettingsTab.tsx", import.meta.url),
        "utf8"
    );
    const modal = readFileSync(
        new URL("../src/components/modules/AccountSecurityAction.tsx", import.meta.url),
        "utf8"
    );
    const styles = readFileSync(new URL("../src/scss/consentCheckbox.scss", import.meta.url), "utf8");
    assert.match(tab, /module: "AccountSecurityAction", point: "delete"/);
    assert.doesNotMatch(tab, /settingCollapsibleInner|settingTogglerDiv|openDelete/);
    assert.match(modal, /className="checkString accountSecurityCheckbox"/);
    assert.match(modal, /className="landingNativeCheckbox"/);
    assert.match(modal, /<CheckSquareIcon weight="fill"/);
    assert.match(modal, /<SquareIcon aria-hidden="true"/);
    assert.doesNotMatch(modal, /settingTogglerDiv/);
    assert.match(styles, /\.checkString\s*\{/);
    assert.match(styles, /\.landingNativeCheckbox\s*\{/);
});

test("email and deletion forms open through Blackout, not inline accordions", () => {
    const tab = readFileSync(
        new URL("../src/pages/Settings/components/SettingsTabs/AccSettingsTab.tsx", import.meta.url), "utf8"
    );
    const mapping = readFileSync(new URL("../src/components/modules/ModuleMap.ts", import.meta.url), "utf8");
    const modal = readFileSync(new URL("../src/components/modules/AccountSecurityAction.tsx", import.meta.url), "utf8");
    const scss = readFileSync(new URL("../src/components/modules/scss/AccountSecurityAction.scss", import.meta.url), "utf8");
    assert.match(tab, /module: "AccountSecurityAction", point: "email"/);
    assert.match(tab, /module: "AccountSecurityAction", point: "delete"/);
    assert.match(mapping, /AccountSecurityAction: lazy\(\(\) => import\("\.\/AccountSecurityAction"\)\)/);
    assert.match(modal, /import "\.\/AccountSecurityAction\.scss"/);
    assert.match(modal, /auth\/account\/email\/request/);
    assert.match(modal, /auth\/account\/email\/confirm/);
    assert.match(modal, /auth\/account\/deletion\/request/);
    assert.match(modal, /auth\/account\/deletion\/confirm/);
    assert.match(scss, /\.accountSecurityPrimary, \.accountSecurityDanger\s*\{\s*margin-left:\s*auto/);
});
