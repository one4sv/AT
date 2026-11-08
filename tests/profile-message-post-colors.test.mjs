import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("forwarded own messages use inner_text without changing other messages", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    const forward = css.match(/\.message\.my \.redirectedMess,[\s\S]*?color:\s*var\(--inner_text\);\s*\}/)?.[0];
    assert.ok(forward);
    for (const selector of [
        ".message.my .redirectSign",
        ".message.my .redirectSign > span",
        ".message.my .redirectText",
        ".message.my .redirectText a"
    ]) {
        assert.ok(forward.includes(selector), selector);
    }
    assert.match(css, /&\.ur\s*\{[\s\S]*?>\.redirectedMess > \.redirectSign > span\s*\{\s*color:\s*var\(--accent_text\)/);
});

test("avatar title spacing and online status font use the shared design", () => {
    const common = read("src/pages/Acc/scss/AccInfo.scss");
    const chat = read("src/scss/modules/ChatWithInfo.scss");
    const group = read("src/pages/Group/scss/Group.scss");

    assert.match(common, /\.accInfoNames\s*\{\s*flex:\s*1;\s*margin-left:\s*1\.5vw/);
    assert.match(common, /\.accOnlineStauts\s*\{[\s\S]*?font-size:\s*13px/);
    assert.match(chat, /\.chatWithInfoMain\s*\{[\s\S]*?padding:\s*1vh;\s*gap:\s*1vw;/);
    assert.match(group, /\.groupPage\s*\{[\s\S]*?\.accInfoNames\s*\{\s*min-width:\s*0;\s*margin-left:\s*2vw;/);
    assert.match(group, /@media\s*\(max-width:\s*800px\)\s*\{\s*margin-left:\s*0;\s*\}/);
});

test("post-linked habit SVG uses inner_text over the accent gradient", () => {
    const css = read("src/scss/Post.scss");
    assert.match(css, /\.PostHabit\s*\{[\s\S]*?background:\s*linear-gradient\(135deg,\s*var\(--accent\),\s*var\(--grad\)\)/);
    assert.match(css, /\.aphIcon\s*\{[\s\S]*?>svg\s*\{\s*height:\s*100%;\s*color:\s*var\(--inner_text\);/);
});
