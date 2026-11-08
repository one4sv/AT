import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("activity participants use normal text on neutral rows and inner_text on accent rows", () => {
    const css = read("src/pages/HabitPage/scss/HabitChatMenu.scss");
    assert.match(css, /\.habitMemberStatus\s*\{\s*color:\s*var\(--borderWh\)/);
    assert.match(css, /&\.active\s+\.habitMemberStatus\s*\{\s*color:\s*var\(--inner_text\)/);
    assert.match(css, /\.habitOwnerLink\s*\{[\s\S]*?\.habitMemberStatus\s*\{\s*color:\s*var\(--borderWh\)/);
});

test("selected activity conversation and hover preserve inner_text on gradient", () => {
    const css = read("src/scss/modules/contactPickerControls.scss");
    const selected = css.slice(css.indexOf("        &.selected {"), css.indexOf("        &:disabled {"));
    assert.match(selected, /background:\s*linear-gradient\(135deg,\s*var\(--accent\),\s*var\(--grad\)\)/);
    assert.match(selected, /color:\s*var\(--inner_text\)/);
    assert.match(selected, />\s*\.createChatConCheck\s*\{\s*color:\s*var\(--inner_text\)/);
    assert.match(selected, /@media\s*\(hover:\s*hover\)[\s\S]*?&:hover\s*\{[\s\S]*?color:\s*var\(--inner_text\)/);
    assert.match(selected, /@media\s*\(hover:\s*none\)[\s\S]*?&:active\s*\{[\s\S]*?color:\s*var\(--inner_text\)/);
});

test("solid accent notification and action buttons use inner_text", () => {
    const contacts = read("src/scss/SM/contactsList.scss");
    const message = read("src/pages/Chat/scss/message.scss");
    const createChat = read("src/scss/modules/CreateChat.scss");
    assert.match(contacts, /\.contactsUnreadCount\s*\{[\s\S]*?background-color:\s*var\(--darker_accent\);\s*color:\s*var\(--inner_text\)/);
    assert.match(message, /&\.myRB\s*\{[\s\S]*?background-color:\s*var\(--darker_accent\);\s*color:\s*var\(--inner_text\)/);
    const chips = createChat.slice(createChat.indexOf(".createChatChosenCon {"), createChat.indexOf("\n.createChatConRemove {"));
    assert.match(chips, /&:hover\s*\{\s*background-color:\s*var\(--darker_accent\);\s*color:\s*var\(--inner_text\)/);
    assert.match(chips, /&:active\s*\{\s*background-color:\s*var\(--darker_accent\);\s*color:\s*var\(--inner_text\)/);
});
