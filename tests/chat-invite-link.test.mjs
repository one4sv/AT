import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("group /invite links the selected object to the current chat after confirmation", () => {
    const jsx = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    const start = jsx.indexOf('if (shareMatch[1] === "invite" && chatWith?.is_group)');
    const end = jsx.indexOf('} else if (shareMatch[1] === "invite" || shareMatch[1] === "group")', start);
    assert.ok(start >= 0 && end > start);
    const group = jsx.slice(start, end);
    assert.match(group, /String\(chatWith\.id\) !== id \|\| chatLoading/);
    assert.match(group, /module: "ConfirmAction"/);
    assert.match(group, /variant: "approve"/);
    assert.match(group, /"habits\/" \+ entityId \+ "\/chat"/);
    assert.match(group, /"plans\/" \+ entityId \+ "\/chat"/);
    assert.match(group, /chat_id: chatId/);
    assert.match(group, /only_if_unlinked: true/);
    assert.match(group, /refetchGroup\(String\(chatId\)\)/);
    assert.doesNotMatch(group, /navigate\(/);
});

test("private /invite still sends a personal invitation; group suggestions are scoped", () => {
    const jsx = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    assert.match(jsx, /else if \(shareMatch\[1\] === "invite" \|\| shareMatch\[1\] === "group"\)/);
    assert.match(jsx, /api\.post\(endpoint, \{ nick: target\.nick \}\)/);
    assert.match(jsx, /link_to_chat: "1"/);
    assert.match(jsx, /chatUi\.inviteLinkToChat/);
    const ru = JSON.parse(read("src/i18n/locales/ru/common.json"));
    const en = JSON.parse(read("src/i18n/locales/en/common.json"));
    for (const key of ["addToChat","addedToChat","addPlanToChatDescription",
        "addHabitToChatDescription","inviteLinkToChat"]) {
        assert.ok(ru.chatUi[key]);
        assert.ok(en.chatUi[key]);
    }
});
