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


test("TagSelector and DayChanger own shared habit-control styling", () => {
    const tag = read("src/components/ts/TagSelector.tsx");
    const day = read("src/components/ts/DayChanger.tsx");
    const global = read("src/scss/App.scss");
    const styles = read("src/scss/modules/habitFormControls.scss");

    assert.ok(tag.includes('import "../../scss/modules/habitFormControls.scss"'));
    assert.ok(day.includes('import "../../scss/modules/habitFormControls.scss"'));
    assert.ok(global.includes('@use "./modules/habitFormControls";'));
    assert.ok(styles.includes(".tagList {"));
    assert.ok(styles.includes(".dayChanger {"));
});

test("plan editor and compact modal controls keep mobile layout and text limits", () => {
    const plans = read("src/pages/Plan/PlanEditor.tsx");
    const styles = read("src/scss/modules/addPlan.scss");
    const habitStyles = read("src/scss/modules/addHabit.scss");
    const sharedTime = read("src/scss/modules/habitFormControls.scss");
    const addHabit = read("src/components/modules/AddHabit.tsx");
    const chatTA = read("src/components/ts/TA.tsx");
    const sideMenuStyles = read("src/scss/SM/sideMenu.scss");
    const sideMenu = read("src/components/ts/SM/SideMenu.tsx");
    const select = read("src/components/ts/SelectList.tsx");
    const sm = read("src/scss/SM/smAccount.scss");

    assert.ok(plans.indexOf('htmlFor="planDescription"') < plans.indexOf('htmlFor="planDate"'));
    assert.match(plans, /maxLength=\{1200\}/);
    assert.match(plans, /value\.description\.length\}\/1200/);
    assert.match(plans, /<TA id="planDescription"/);
    assert.match(chatTA, /ResizeObserver/);
    assert.match(styles, /\.addPlanDiv \.addHabitTimeWrapper\.timeInputs\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(styles, /\.addPlanDiv \.planFormSelect > svg,[\s\S]*?top: 50%;/);
    assert.match(sharedTime, /&\.timeInputs\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(sharedTime, /font-size: 16px;[\s\S]*?-webkit-text-size-adjust: 100%/);
    assert.match(sharedTime, /&\.timeInputs/);
    assert.match(plans, /<TagSelector selectedTag=/);
    assert.match(sideMenuStyles, /padding-bottom: calc\(1dvh \+ var\(--sm-nav-clearance/);
    assert.match(sideMenu, /--sm-nav-clearance/);
    assert.match(sharedTime, /\&\[type="time"\]/);
    assert.match(sharedTime, /\:\:-webkit-calendar-picker-indicator/);
    assert.match(addHabit, /type="time" id="inputStartTime"/);
    assert.match(addHabit, /className="timeInputShell"/);
    assert.match(plans, /className="timeInputShell"/);
    assert.match(addHabit, /type="time" id="inputEndTime"/);
    assert.match(habitStyles, /height: 5dvh/);
    assert.match(habitStyles, /3dvh \+ env\(safe-area-inset-bottom\)/);
    assert.match(select, /translateY\(-50%\) rotate/);
    assert.doesNotMatch(sm, /&:hover \{\s*background-color: var\(--menuButtHover\);\s*> \.settingName/);
});

test("AddPlan has no separate title or kind selection and labels do not force a minimum height", () => {
    const form = read("src/pages/Plan/PlanEditor.tsx");
    const mobile = read("src/scss/modules/addPlan.scss");
    const controls = read("src/scss/modules/habitFormControls.scss");
    assert.doesNotMatch(form, /addPlanHeading/);
    assert.match(form, /!modal && !initial/);
    assert.match(mobile, /height: auto/);
    assert.doesNotMatch(controls, /min-height: 2\.5em/);
});

test("time inputs align at the bottom of both columns without label min-height", () => {
    const css = read("src/scss/modules/habitFormControls.scss");
    assert.match(css, /> \.timeInputShell \{\s*margin-top: auto;/);
    assert.doesNotMatch(css, /min-height: 2\.5em/);
});

test("native time reset uses controlled input events and independently rounded shells", () => {
    const plan = read("src/pages/Plan/PlanEditor.tsx");
    const habit = read("src/components/modules/AddHabit.tsx");
    const css = read("src/scss/modules/habitFormControls.scss");
    const select = read("src/scss/SelectList.scss");
    for (const form of [plan, habit]) {
        assert.match(form, /className="timeInputShell"/);
        assert.match(form, /onInput=\{e =>/);
        assert.match(form, /onBlur=\{e =>/);
        assert.match(form, /className="timeInputClear"/);
    }
    assert.match(css, /\.timeInputShell\s*\{[\s\S]*?border-radius: 24px;[\s\S]*?overflow: hidden;/);
    assert.match(css, /> input\.addHabitInput\[type="time"\]\s*\{[\s\S]*?border: none;/);
    assert.doesNotMatch(css, /font-size: 20px;\s*padding-inline-end: 6vw;/);
    assert.match(select, /\.redHabitSL\s*\{[\s\S]*?> svg \{\s*top: 50%;/);
});
test("settings context-menu buttons can start a horizontal SideMenu swipe", () => {
    const layout = read("src/components/layout/MobileLayout.tsx");
    const press = read("src/components/hooks/utils/useLongPressContextMenu.ts");
    const style = read("src/pages/Settings/scss/settings.scss");
    assert.doesNotMatch(layout, /target\.closest\("[^"]*\[data-context-menu\]/);
    assert.match(press, /Math\.abs\(dx\) >= 8/);
    assert.match(style, /\.settingButt \{\s*touch-action: pan-y;/);
});
