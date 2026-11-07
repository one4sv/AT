import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../public/at-wallpaper-cache-sw.js", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

function worker() {
    const events = {};
    const notifications = [];
    const opened = [];
    const self = {
        location: { origin: "https://achievetogether.vercel.app" },
        addEventListener(name, callback) { events[name] = callback; },
        skipWaiting() {},
        registration: {
            showNotification(title, options) {
                notifications.push({ title, options });
                return Promise.resolve();
            }
        },
        clients: {
            claim() { return Promise.resolve(); },
            matchAll() { return Promise.resolve([]); },
            openWindow(url) { opened.push(url); return Promise.resolve(); }
        }
    };
    runInNewContext(script, { self, URL, Response, caches: {}, fetch() {} });
    return { events, notifications, opened };
}

async function sendPush(worker, payload) {
    let done;
    worker.events.push({
        data: { json: () => payload },
        waitUntil(promise) { done = promise; }
    });
    await done;
}

test("PWA manifest provides standalone scope for iOS Home Screen", () => {
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.scope, "/");
    assert.equal(manifest.start_url, "/");
    assert.ok(manifest.icons.some(icon => icon.sizes === "any"));
});

test("push always displays a notification with a safe same-origin route", async () => {
    const context = worker();
    await sendPush(context, { title: "Test", body: "Message", url: "https://malicious.example/steal", tag: "chat" });
    assert.equal(context.notifications.length, 1);
    assert.equal(context.notifications[0].title, "Test");
    assert.equal(context.notifications[0].options.data.url, "/");

    await sendPush(context, { title: "Chat", body: "Hello", url: "/chat/g/42", tag: "chat-42" });
    assert.equal(context.notifications[1].options.data.url, "/chat/g/42");
});

test("notification tap opens the exact safe chat route", async () => {
    const context = worker();
    let done;
    context.events.notificationclick({
        notification: { data: { url: "/chat/g/42" }, close() {} },
        waitUntil(promise) { done = promise; }
    });
    await done;
    assert.deepEqual(context.opened, ["https://achievetogether.vercel.app/chat/g/42"]);
});

test("service worker leaves non-wallpaper API fetches untouched", () => {
    const context = worker();
    let intercepted = false;
    context.events.fetch({
        request: { method: "GET", url: "https://achievetogether.vercel.app/api/chat" },
        respondWith() { intercepted = true; }
    });
    assert.equal(intercepted, false);
});
