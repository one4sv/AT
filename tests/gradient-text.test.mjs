import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const gradient = "background:\\s*linear-gradient\\(";
const accent = "color:\\s*var\\(--accent_text\\)";

test("chatWriteTAButt and composer send control use accent_text on the gradient", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const composer = read("src/scss/Composer.scss");
    assert.match(chat, new RegExp("\\.chatWriteTAButt\\s*\\{[\\s\\S]*?" + gradient + "[^;]*;\\s*" + accent));
    assert.match(composer, new RegExp("> \\.composerSend\\s*\\{[\\s\\S]*?" + gradient + "[^;]*;[\\s\\S]*?" + accent));
});

test("gradient hover states and open navigation state use accent_text", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const nav = read("src/scss/SM/smHeader.scss");
    assert.match(chat, /&:hover\s*\{\s*color:\s*var\(--accent_text\);\s*background:\s*linear-gradient/);
    assert.match(chat, /&:active\s*\{\s*color:\s*var\(--accent_text\);\s*background:\s*linear-gradient/);
    assert.match(nav, /&\.open\s*\{\s*background:\s*linear-gradient\([^;]+;\s*color:\s*var\(--accent_text\)/);
    assert.match(nav, /&\.open:hover\s*\{\s*color:\s*var\(--accent_text\)/);
    assert.match(nav, /&\.open:active\s*\{\s*color:\s*var\(--accent_text\)/);
});

test("messages, active filters, account settings and send actions respect gradient text color", () => {
    const message = read("src/pages/Chat/scss/message.scss");
    const media = read("src/scss/modules/ChatWithInfo.scss");
    const settings = read("src/pages/Settings/scss/settings.scss");
    const actions = read("src/pages/HabitPage/scss/Complete.scss");
    assert.match(message, /&\.my\s*\{[\s\S]*?background:\s*linear-gradient\([^;]+;[\s\S]*?color:\s*var\(--accent_text\)/);
    assert.match(media, /\.chatMediaFilter\.active\s*\{\s*color:\s*var\(--accent_text\)/);
    assert.match(settings, /&\.settingButtAcc\s*\{[\s\S]*?background:\s*linear-gradient[\s\S]*?color:\s*var\(--accent_text\)/);
    assert.match(actions, /\.doneButt\s*\{\s*@include var\.longButt\([^;]*var\(--accent_text\)/);
});

test("design documentation does not prescribe inner_text for gradient states", () => {
    const guide = read("docs/SCSS_GUIDE.md");
    const style = read("docs/CODE_STYLE.md");
    assert.doesNotMatch(guide, /градиент[^\n]{0,200}color: var\(--inner_text\)/i);
    assert.doesNotMatch(style, /градиент[^\n]{0,200}color: var\(--inner_text\)/i);
});
