import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only AddPlan changes desktop centering; AddHabit keeps its own mixin", () => {
    const planStyle = read("src/scss/modules/addPlan.scss");
    const habitStyle = read("src/scss/modules/addHabit.scss");
    assert.match(planStyle, /@media \(min-width: 801px\) \{\s*transform: translate\(-50%, -50%\);/);
    assert.match(habitStyle, /@include var\.centerTopModal;/);
    assert.doesNotMatch(habitStyle, /transform: translate\(-50%, -50%\)/);
});

test("now completion icon uses exactly the calendar now color", () => {
    const calendar = read("src/pages/HabitPage/scss/calendar.scss");
    const overview = read("src/pages/HabitPage/scss/HabitOverview.scss");
    const entry = read("src/pages/HabitPage/components/Overview/HabitOverviewEntries.tsx");
    const nowDot = calendar.match(/&\.now\s*\{\s*background-color:\s*(#[a-f0-9]+);/i);
    const nowButton = overview.match(/\.habitOverviewEntryDone\.now\s*\{\s*color:\s*(#[a-f0-9]+);/i);
    assert.ok(nowDot && nowButton);
    assert.equal(nowButton[1].toLowerCase(), nowDot[1].toLowerCase());
    assert.match(entry, /entry\.state === "now" \? " now"/);
});

test("plan and post feed use identical relative width on desktop and mobile", () => {
    const feed = read("src/pages/Main/scss/Main.scss");
    const plan = read("src/pages/Plan/PlanPage.scss");
    assert.match(feed, /\.MainDiv\s*\{\s*width: 60%;/);
    assert.match(feed, /\.postFeed\s*\{[\s\S]*?width: 70%;/);
    assert.match(plan, /\.planPage\s*\{\s*width: 42%;/);
    assert.match(plan, /\.planPage\s*\{\s*width: 95%;/);
});

test("editing keeps existing plan sections and uses field-level controls", () => {
    const source = read("src/pages/Plan/PlanPage.tsx");
    assert.match(source, /editing && !plan \? <div className="planSection">/);
    assert.match(source, /planInlineName/);
    assert.match(source, /planInlineDate/);
    assert.match(source, /planInlineStart/);
    assert.match(source, /planInlineDescription/);
    assert.match(source, /startEditing/);
    assert.match(source, /void save\(draft\)/);
    assert.match(source, /className=\{"doneButt planDoneButton "/);
    assert.match(source, /habitUi\.complete/);
});

test("tag icons appear in title, shared header and SideMenu", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const menu = read("src/components/ts/SM/HabitsList.tsx");
    const header = read("src/components/ts/Header.tsx");
    assert.match(page, /<selectedTag\.icon size=\{26\}/);
    assert.match(page, /setTitleIcon\(Icon \? <Icon size=\{24\}\/> : null\)/);
    assert.match(menu, /<PlanTagIcon tag=\{entry\.plan\?\.tag\}\/>/);
    assert.match(header, /titleIcon && <span className="headerTitleTag">/);
});

test("dangerous actions follow SCSS_GUIDE, including hover and touch", () => {
    const style = read("src/pages/Plan/PlanPage.scss");
    const page = read("src/pages/Plan/PlanPage.tsx");
    assert.match(style, /\.planDanger\s*\{[\s\S]*?color: var\(--notValid\);[\s\S]*?border: 1px solid var\(--notValid\);/);
    assert.match(style, /@media \(hover: hover\)\s*\{\s*&:hover\s*\{\s*background: var\(--notValidBg\);/);
    assert.match(style, /@media \(hover: none\)\s*\{\s*&:active\s*\{\s*background: var\(--notValidBg\);/);
    assert.match(page, /className="planQuietButton planDanger"/);
    assert.doesNotMatch(style, /\.planDanger\s*\{\s*color: var\(--accent_text\)/);
});

test("reminder section has a right-aligned caret", () => {
    const reminders = read("src/pages/Plan/PlanReminders.tsx");
    const style = read("src/pages/Plan/PlanPage.scss");
    assert.match(reminders, /<CaretDownIcon className="planRemindersCaret" size=\{20\}\/>/);
    assert.match(style, /\.planRemindersCaret\s*\{\s*margin-left: auto;/);
});


test("desktop plan completion and comment live inside the first details section", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const css = read("src/pages/Plan/PlanPage.scss");
    const indexDetails = page.indexOf('<div className="planSection">',page.indexOf('return <div className="planPage">'));
    const indexCompletion = page.indexOf('<div className="planInlineCompletion">');
    const indexReminders = page.indexOf('<PlanReminders planId={plan.id}/>');
    assert.ok(indexDetails >= 0 && indexCompletion > indexDetails && indexCompletion < indexReminders);
    assert.doesNotMatch(page, /planSection planCompletionSection/);
    assert.match(css, /scrollbar-width: thin/);
    assert.match(css, /\.planPrimaryButton\s*\{[\s\S]*?display: flex;[\s\S]*?align-items: center;[\s\S]*?justify-content: center;/);
    assert.match(css, /\.planMetadataEditing\s*\{[\s\S]*?align-items: center;/);
});
test("plan reminders always have a link to their specific settings section", () => {
    const reminders = read("src/pages/Plan/PlanReminders.tsx");
    assert.match(reminders, /state=\{\{ from: "\/plan\/" \+ planId, settingId: "planReminders" \}\}/);
    assert.match(reminders, /remindersSettingsHint/);
    assert.match(reminders, /<Link to="\/settings\/notes"/);
});
test("scrolling content is isolated beneath the shared header", () => {
    const route = read("src/scss/routeTransition.scss");
    assert.match(route,/\.routeTransition\s*\{[\s\S]*?z-index: 0;[\s\S]*?isolation: isolate;/);
});

test("creation is personal and participant management lives on plan page", () => {
    const editor = read("src/pages/Plan/PlanEditor.tsx");
    const page = read("src/pages/Plan/PlanPage.tsx");
    const members = read("src/pages/Plan/PlanMembers.tsx");
    const style = read("src/scss/modules/addPlan.scss");
    const sharedStyle = read("src/scss/modules/habitFormControls.scss");
    assert.match(editor, /!modal && !initial && <div className="inpWrapperAddHabit">/);
    assert.doesNotMatch(editor, /modal && <div className="addPlanHeading"/);
    assert.match(page, /<PlanMembers plan=\{plan\}/);
    assert.match(members, /api\.post\("plans\/" \+ plan\.id \+ "\/invite"/);
    assert.match(members, /api\.delete\("plans\/" \+ plan\.id \+ "\/members\/" \+ id\)/);
    assert.match(style, /height: auto;/);
    assert.match(style, /max-height: calc\(92dvh - env\(safe-area-inset-bottom\)\);/);
    assert.doesNotMatch(sharedStyle, /min-height: 2\.5em/);
});

test("collapsed completion controls keep their status color rather than an interact overlay", () => {
    const plan = read("src/pages/Plan/PlanPage.scss");
    const habit = read("src/pages/HabitPage/scss/habitMobileDone.scss");
    assert.match(plan, /\.planMobileDone \.doneButtDivMobile\.close > \.bottomOpen\s*\{\s*border: none;\s*background: transparent;/);
    assert.match(plan, /\.planMobileDone \.habitDayCommentMobile > \.bottomOpen\s*\{/);
    assert.doesNotMatch(plan, /\.planMobileDone \.bottomOpen\s*\{/);
    assert.match(habit, /> \.bottomOpen\s*\{\s*border: none;\s*background: transparent;\s*color: inherit;/);
    const completedButtonStyles = habit.split(".doneButtDivMobile {")[1].split(".doneButtMobile {")[0];
    assert.doesNotMatch(completedButtonStyles, /backdrop-filter: blur\(var\(--blur\)\)/);
});

test("plan management is offered on the first section and both header triggers", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const header = read("src/components/ts/Header.tsx");
    const gestures = read("src/components/hooks/utils/useHeaderMenuGestures.ts");
    const menu = read("src/components/ts/ContextMenu/menus/PlanMenu.tsx");
    const provider = read("src/components/context/PageTitleContext.tsx");
    assert.match(page, /className="planSection planMainSection"/);
    assert.match(page, /data-context-menu=\{plan\.is_owner \? "true" : undefined\}/);
    assert.match(page, /onContextMenu=\{event => \{/);
    assert.match(page, /setHeaderMenu\(\{ point: "plan"/);
    assert.doesNotMatch(page, /className="planSection">\s*<h2>\{t\("plans\.management"\)\}/);
    assert.match(header, /className="headerButt planHeaderActionsButt"/);
    assert.match(header, /data-header-gesture="plan"/);
    assert.match(header, /if \(planHeaderMenu\) \{/);
    assert.match(gestures, /kind === "plan"/);
    assert.match(provider, /headerMenu: \{ point: string; options: MenuOptions \} \| null/);
    for (const action of ["onEdit", "onSave", "onStopEdit", "onToggleCancel", "onConfirmDelete"])
        assert.match(menu, new RegExp("options\\." + action));
    assert.match(page, /confirmDelete && plan\.is_owner && <div className="planDeleteConfirm">/);
});
test("plan details stay in place when inputs become active", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const css = read("src/pages/Plan/PlanPage.scss");
    const date = read("src/components/ts/CalendarInput.tsx");
    assert.match(page, /const readOnly = !editing \|\| !draft/);
    assert.match(page, /className="planDetailsInput planTitleInput"/);
    assert.match(page, /className="planDetailsInput planDetailsDate"/);
    assert.match(page, /className="planDetailsInput planDescriptionText planDetailsDescription"/);
    assert.match(page, /readOnly=\{readOnly\} tabIndex=\{readOnly \? -1 : 0\}/);
    assert.match(page, /onChange=\{event => changeDraft\("name", event\.target\.value\)\}/);
    assert.match(css, /\.planMainSection \.planDetailsInput\[readonly\],[\s\S]*?pointer-events: none;/);
    assert.match(date, /dateFormat=\{dateFormat\}/);
});
