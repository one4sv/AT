import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("invitation confirmation is explicitly approving while existing confirmations remain dangerous", () => {
    const confirm = read("src/components/modules/ConfirmAction.tsx");
    const chat = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    const css = read("src/components/modules/scss/confirmAction.scss");
    assert.match(confirm, /action\.variant === "approve" \? "approve" : "danger"/);
    assert.match(chat, /label: tc\("chatUi\.sendInvite"\),\s*variant: "approve"/);
    assert.match(css, /&\.approve\s*\{\s*border: none;\s*background: linear-gradient\(135deg, var\(--accent\), var\(--grad\)\);\s*color: var\(--inner_text\);/);
    assert.match(css, /&\.approve:not\(:disabled\):hover\s*\{\s*background: linear-gradient\(135deg, var\(--accent\), var\(--grad\)\);\s*color: var\(--inner_text\);/);
    assert.match(css, /&\.danger\s*\{\s*background: var\(--notValidBg\)/);
});
