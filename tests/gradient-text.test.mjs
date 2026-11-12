import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const gradient = "background:\\s*linear-gradient\\(";
const inner = "color:\\s*var\\(--inner_text\\)";

test("chatWriteTAButt and composer send control use inner_text on gradients", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const composer = read("src/scss/Composer.scss");
    assert.match(chat, new RegExp("\\.chatWriteTAButt\\s*\\{[\\s\\S]*?" + gradient + "[^;]*;\\s*" + inner));
    assert.match(composer, new RegExp("> \\.composerSend\\s*\\{[\\s\\S]*?" + gradient + "[^;]*;[\\s\\S]*?" + inner));
});

test("gradient hover, active and open navigation states use inner_text", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const nav = read("src/scss/SM/smHeader.scss");
    assert.match(chat, /&:hover\s*\{\s*color:\s*var\(--inner_text\);\s*background:\s*linear-gradient/);
    assert.match(chat, /&:active\s*\{\s*color:\s*var\(--inner_text\);\s*background:\s*linear-gradient/);
    assert.match(nav, /&\.open\s*\{\s*background:\s*linear-gradient\([^;]+;\s*color:\s*var\(--inner_text\)/);
    assert.match(nav, /&\.open:hover\s*\{\s*color:\s*var\(--inner_text\)/);
    assert.match(nav, /&\.open:active\s*\{\s*color:\s*var\(--inner_text\)/);
});

test("messages, active filters, account settings, selected tabs and send actions use inner_text", () => {
    const message = read("src/pages/Chat/scss/message.scss");
    const media = read("src/components/modules/scss/ChatWithInfo.scss");
    const settings = read("src/pages/Settings/scss/settings.scss");
    const actions = read("src/pages/HabitPage/scss/Complete.scss");
    const side = read("src/scss/SM/smNav.scss");
    const profile = read("src/pages/Acc/scss/Acc.scss");
    assert.match(message, /&\.my\s*\{[\s\S]*?background:\s*linear-gradient\([^;]+;[\s\S]*?color:\s*var\(--inner_text\)/);
    assert.match(media, /\.chatMediaFilter\.active\s*\{\s*color:\s*var\(--inner_text\)/);
    assert.match(settings, /&\.settingButtAcc\s*\{[\s\S]*?background:\s*linear-gradient\([^;]+;\s*color:\s*var\(--inner_text\)/);
    assert.match(actions, /\.doneButt\s*\{[\s\S]*?background:\s*linear-gradient\([^;]+;\s*color:\s*var\(--inner_text\)/);
    assert.match(side, /&\.active\s*\{\s*color:\s*var\(--inner_text\)/);
    assert.match(profile, /&\.acbActive\s*\{\s*color:\s*var\(--inner_text\)/);
});

test("non-gradient default control colors are preserved", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const nav = read("src/scss/SM/smNav.scss");
    assert.match(chat, /\.chatWriteSvgButt\s*\{[\s\S]*?color:\s*var\(--tc\)/);
    assert.match(nav, /\.SMnavButt\s*\{[\s\S]*?color:\s*var\(--borderHabit\)/);
});

test("design documentation requires inner_text and forbids accent_text over accent gradients", () => {
    for (const path of ["docs/SCSS_GUIDE.md", "docs/CODE_STYLE.md"]) {
        const doc = read(path);
        assert.match(doc, /var\(--inner_text\)/);
        assert.match(doc, /градиент/);
    }
});
