import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const balanced = "padding: max(";

test("chat and composer keep one-line text centered", () => {
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    const composer = read("src/scss/Composer.scss");
    assert.ok(chat.slice(chat.indexOf(".chatTA {"), chat.indexOf(".chatTaButts {")).includes(balanced));
    assert.ok(composer.slice(composer.indexOf(".composerInput {"), composer.indexOf(".composerRow {")).includes(balanced));
});

test("activity and plan comments have balanced textarea paddings", () => {
    const css = read("src/pages/HabitPage/scss/DayComment.scss");
    assert.ok(css.slice(css.indexOf(".habitDayComment {"), css.indexOf(".habitDayComment.inputWithEmoji")).includes(balanced));
    const mobileOverride = css.slice(css.indexOf(".habitDayCommentMobile.inputWithEmoji {"), css.indexOf(".sharedDayComments {"));
    assert.ok(!mobileOverride.includes("padding-bottom"));
    assert.ok(read("src/pages/HabitPage/scss/habitMobileDone.scss").includes(balanced));
});

test("description of a new chat has matching top and bottom padding", () => {
    const css = read("src/components/modules/scss/CreateChat.scss");
    const body = css.slice(css.indexOf(".createChatDesc {"), css.indexOf(".inviteUser {"));
    assert.ok(body.includes("padding: .5dvh 0;"));
    assert.ok(!body.includes("padding-top"));
    assert.ok(!body.includes("height: 7dvh"));
});

test("post, schedule, profile, roles and quick command fields use balanced padding", () => {
    for (const path of [
        "src/pages/Main/scss/PostWrite.scss",
        "src/pages/Post/scss/postPage.scss",
        "src/pages/HabitPage/scss/Schedule.scss",
        "src/pages/Acc/scss/AccInfo.scss"
    ]) assert.ok(read(path).includes(balanced), path);
    assert.ok(read("src/components/modules/scss/PermissionsDiv.scss").includes("padding-block: max("));
    const chat = read("src/pages/Chat/scss/chatTa.scss");
    assert.ok(chat.includes("padding: .5dvh .75vw;"));
    assert.ok(chat.includes("padding: .5dvh 2vw;"));
});
