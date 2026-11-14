import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only AddPlan changes desktop centering; AddHabit keeps its own mixin", () => {
    const planStyle = read("src/components/modules/scss/addPlan.scss");
    const habitStyle = read("src/components/modules/scss/addHabit.scss");
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
    const plan = read("src/pages/Plan/scss/PlanPage.scss");
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
    const planCard = read("src/components/ts/Plan.tsx");
    assert.match(menu, /<PlanDiv plan=\{entry\.plan!\}/);
    assert.match(planCard, /<PlanTagIcon tag=\{plan\.tag\}\/>/);
    assert.match(header, /titleIcon && <span className="headerTitleTag">/);
});

test("dangerous actions follow SCSS_GUIDE, including hover and touch", () => {
    const style = read("src/pages/Plan/scss/PlanPage.scss");
    const page = read("src/pages/Plan/PlanPage.tsx");
    assert.match(style, /\.planDanger\s*\{[\s\S]*?color: var\(--notValid\);[\s\S]*?border: 1px solid var\(--notValid\);/);
    assert.match(style, /@media \(hover: hover\)\s*\{\s*&:hover\s*\{\s*background: var\(--notValidBg\);/);
    assert.match(style, /@media \(hover: none\)\s*\{\s*&:active\s*\{\s*background: var\(--notValidBg\);/);
    assert.match(page, /className="planQuietButton planDanger"/);
    assert.doesNotMatch(style, /\.planDanger\s*\{\s*color: var\(--accent_text\)/);
});

test("reminder section has a right-aligned caret", () => {
    const reminders = read("src/pages/Plan/PlanReminders.tsx");
    const style = read("src/pages/Plan/scss/PlanPage.scss");
    assert.match(reminders, /<CaretDownIcon className="planRemindersCaret" size=\{20\}\/>/);
    assert.match(style, /\.planRemindersCaret\s*\{\s*margin-left: auto;/);
});


test("desktop plan completion and comment live inside the first details section", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const css = read("src/pages/Plan/scss/PlanPage.scss");
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
    const style = read("src/components/modules/scss/addPlan.scss");
    const sharedStyle = read("src/scss/habitFormControls.scss");
    assert.match(editor, /!modal && !initial && <div className="inpWrapperAddHabit">/);
    assert.doesNotMatch(editor, /modal && <div className="addPlanHeading"/);
    assert.match(page, /<PlanMembers plan=\{plan\}/);
    assert.match(members, /setBlackout\(\{ seted: true, module: "HabitParticipantPicker"/);
    const picker = read("src/components/modules/HabitParticipantPicker.tsx");
    assert.match(picker, /api\.post\(`plans\/\$\{planId\}\/invite`/);
    assert.match(members, /api\.delete\("plans\/" \+ plan\.id \+ "\/members\/" \+ id\)/);
    assert.match(style, /height: auto;/);
    assert.match(style, /max-height: calc\(92dvh - env\(safe-area-inset-bottom\)\);/);
    assert.doesNotMatch(sharedStyle, /min-height: 2\.5em/);
});

test("collapsed completion controls keep their status color rather than an interact overlay", () => {
    const plan = read("src/pages/Plan/scss/PlanPage.scss");
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
    assert.match(page, /data-context-menu=\{plan\.membership_status === "accepted" \? "true" : undefined\}/);
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
    const css = read("src/pages/Plan/scss/PlanPage.scss");
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


test("plan header action is the same vertical three-dot control and width as the chat header", () => {
    const sharedHeader = read("src/components/ts/Header.tsx");
    const chatHeader = read("src/pages/Chat/components/ChatUser.tsx");
    const styles = read("src/scss/header.scss");
    assert.match(chatHeader, /<div className="headerButt" data-header-gesture="chat"/);
    assert.match(chatHeader, /<DotsThreeOutlineVerticalIcon weight="fill"\/>/);
    assert.match(sharedHeader, /className="headerButt planHeaderActionsButt"/);
    assert.match(sharedHeader, /<DotsThreeOutlineVerticalIcon weight="fill"\/>/);
    assert.doesNotMatch(sharedHeader, /<DotsThreeIcon/);
    assert.match(styles, /\.headerButt\s*\{[\s\S]*?height: 4dvh;[\s\S]*?aspect-ratio: 1\/1;/);
});

test("plan members have no shared list background and each row takes the full hover width", () => {
    const styles = read("src/pages/Plan/scss/PlanPage.scss");
    const group = styles.match(/\.planMembers\s*\{([^}]*)\}/)?.[1] || "";
    assert.doesNotMatch(group, /background|padding/);
    assert.match(styles, /\.planMember\s*\{[\s\S]*?width: 100%;[\s\S]*?box-sizing: border-box;[\s\S]*?background: transparent;/);
    assert.match(styles, /\.planMember\s*\{[\s\S]*?&:hover\s*\{\s*background: var\(--mc\);/);
});


test("plan card uses the same context-menu surface and supports persistent pin", () => {
    const plan = read("src/components/ts/Plan.tsx");
    const list = read("src/components/ts/SM/HabitsList.tsx");
    const menu = read("src/components/ts/ContextMenu/menus/PlanMenu.tsx");
    const ctx = read("src/components/context/PlansContext.tsx");
    const timeline = read("src/components/ts/utils/dayTimeline.ts");
    assert.match(plan, /data-context-menu=\{onSelect \? undefined : "true"\}/);
    assert.match(plan, /"planItem"/);
    assert.match(plan, /pinnedHabitSign/);
    assert.match(list, /<PlanDiv/);
    assert.match(menu, /await setPin/);
    assert.match(menu, /<LinkButton\/>/);
    assert.match(menu, /navigator\.share/);
    assert.match(menu, /t\("plans\.share"\)/);
    assert.match(ctx, /api\.patch\("plans\/" \+ id \+ "\/pin"/);
    assert.match(timeline, /a\.plan\?\.pinned/);
});

test("completion mode and editing action keep menu independent", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const header = read("src/components/ts/Header.tsx");
    assert.match(page, /id="planCompletionMode"/);
    assert.match(page, /plans\.completedParticipants/);
    assert.match(page, /planHeadingEditButton/);
    assert.doesNotMatch(page, /planCompletionChoices|planCompletionModeEditable/);
    assert.doesNotMatch(header, /planEditing|planHeaderSaveButt/);
    assert.match(header, /<DotsThreeOutlineVerticalIcon weight="fill"\/>/);
});

test("pending plan invitations are visible in SideMenu and the activity overview", () => {
    const list = read("src/components/ts/SM/HabitsList.tsx");
    const ctx = read("src/components/context/SideMenuContext.tsx");
    const overview = read("src/pages/HabitPage/components/HabitInfo/HabitInvitations.tsx");
    assert.match(list, /pendingPlans\.map\(plan => <Link/);
    assert.match(list, /to=\{"\/plan\/" \+ plan\.id\}/);
    assert.match(ctx, /const pendingCount = plans\.filter/);
    assert.match(overview, /api\.post\(\x60plans\/\$\{id\}\/respond\x60, \{ status \}\)/);
    assert.match(overview, /await refreshPlans\(\)/);
    assert.match(overview, /plans\.invitationTitle/);
});

test("plan invitations refresh when a user returns to a tab", () => {
    const context = read("src/components/context/PlansContext.tsx");
    assert.match(context, /window\.addEventListener\("focus", refreshOnResume\)/);
    assert.match(context, /document\.addEventListener\("visibilitychange", refreshOnResume\)/);
    assert.match(context, /window\.removeEventListener\("focus", refreshOnResume\)/);
    assert.match(context, /document\.visibilityState !== "visible"/);
});

test("completion mode uses plain text when viewing and a RadioGroup only when editing", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const css = read("src/pages/Plan/scss/PlanPage.scss");
    assert.match(page, /plan\.kind === "shared" && \(editing && plan\.is_owner \?/);
    assert.match(page, /<RadioGroup id="planCompletionMode"/);
    assert.match(page, /<span className="planCompletionMode">/);
    assert.match(page, /disabled=\{saving \|\| !!plan\.completed_count/);
    assert.doesNotMatch(page, /planCompletionModeEditable|planCompletionChoices/);
    assert.match(css, /\.planCompletionMode\s*\{/);
});
test("plan heading edit and save icons cannot shrink due to inherited button padding", () => {
    const page = read("src/pages/Plan/PlanPage.tsx");
    const css = read("src/pages/Plan/scss/PlanPage.scss");
    assert.match(page, /<CheckIcon size=\{24\} weight="bold"\/>/);
    assert.match(page, /<PencilSimpleIcon size=\{24\} weight="bold"\/>/);
    assert.match(css, /\.planHeading \.planHeadingEditButton\s*\{[\s\S]*?flex: 0 0 42px;\s*padding: 0;/);
    assert.match(css, /> svg\s*\{[\s\S]*?width: 24px;\s*height: 24px;\s*flex: 0 0 24px;/);
    assert.match(css, /\.planHeading \.planHeadingSaveButton:disabled[\s\S]*?border: none;/);
});
