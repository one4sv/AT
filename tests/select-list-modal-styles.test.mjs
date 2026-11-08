import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("SelectList owns styles independent from the habit page", () => {
    const select = read("src/components/ts/SelectList.tsx");
    const global = read("src/scss/App.scss");
    const shared = read("src/scss/SelectList.scss");
    const activity = read("src/components/modules/AddHabit.tsx");
    const editor = read("src/pages/HabitPage/scss/redHabit.scss");

    assert.ok(select.includes('import "../../scss/SelectList.scss"'));
    assert.ok(global.includes('@use "./SelectList";'));
    assert.match(shared, /\.redHabitSL\s*\{/);
    assert.match(shared, /@include var\.selectList\(/);
    assert.match(shared, /:where\(\.selectListDiv\)/);
    assert.doesNotMatch(editor, /\.redHabitSL\s*\{/);
    assert.ok(activity.includes('className="redHabitSL"'));
});

test("activity participant picker matches the invitation dialog", () => {
    const invite = read("src/components/modules/CreateChat.tsx");
    const activity = read("src/components/modules/HabitParticipantPicker.tsx");
    const shared = read("src/scss/modules/contactPickerControls.scss");
    const global = read("src/scss/App.scss");

    for (const code of [invite, activity]) {
        assert.ok(code.includes('className="createChatList contactPickerList"'));
        assert.ok(code.includes('className="createChatChosenCon"'));
        assert.ok(code.includes('className="createChatSearch"'));
    }
    assert.ok(activity.includes('createChatContact'));
    assert.ok(activity.includes('className="createChatConCheck"'));
    assert.ok(!activity.includes('className="contactsUser"'));

    for (const name of [".contactPickerList", ".createChatSearch", ".createChatChosenCon", ".createChatContact"]) {
        assert.ok(shared.includes(name + " {"), name);
    }
    assert.ok(global.includes('@use "./modules/contactPickerControls";'));
});

test("contact search preserves selection, loading and save", () => {
    const activity = read("src/components/modules/HabitParticipantPicker.tsx");
    assert.ok(activity.includes("setSelected([contact])"));
    assert.ok(activity.includes("findContactsRef.current(search, controller"));
    assert.ok(activity.includes("controller.abort()"));
    assert.ok(activity.includes("habitMembersSkeleton"));
    assert.ok(activity.includes("saving || !selected.length"));
    assert.ok(activity.includes("await loadHabit(String(habit.id))"));
});
