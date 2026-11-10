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

    assert.match(common, /\.accInfoNames\s*\{\s*flex:\s*1;\s*margin-left:\s*5px/);
    assert.match(common, /\.accInfoInner\s*\{[\s\S]*?padding:\s*0\.5vh 5px;[\s\S]*?padding:\s*1vh 8px;/);
    assert.match(common, /\.accPic\s*\{[\s\S]*?left:\s*0;/);
    assert.match(common, /\.accOnlineStauts\s*\{[\s\S]*?font-size:\s*13px/);
    assert.match(chat, /\.chatWithInfoMain\s*\{[\s\S]*?padding:\s*1vh;\s*gap:\s*5px;/);
    assert.match(group, /\.groupPage\s*\{[\s\S]*?\.accInfoNames\s*\{\s*min-width:\s*0;\s*margin-left:\s*5px;/);
    assert.match(chat, />\.accInfoNames\s*\{\s*margin-left:\s*0;/);
    assert.match(group, /@media\s*\(max-width:\s*800px\)\s*\{\s*margin-left:\s*0;\s*\}/);
});

test("post-linked habit SVG uses inner_text over the accent gradient", () => {
    const css = read("src/scss/Post.scss");
    assert.match(css, /\.PostHabit\s*\{[\s\S]*?background:\s*linear-gradient\(135deg,\s*var\(--accent\),\s*var\(--grad\)\)/);
    assert.match(css, /\.aphIcon\s*\{[\s\S]*?>svg\s*\{\s*height:\s*100%;\s*color:\s*var\(--inner_text\);/);
});

test("short messages grow with reactions and receipts stay inside the bubble", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    const message = read("src/pages/Chat/components/Message.tsx");
    assert.match(css, /\.message\s*\{\s*max-width:\s*40vw;\s*width:\s*max-content;/);
    assert.match(css, /\.messageStatusBarDiv\s*\{\s*width:\s*max-content;\s*max-width:\s*100%;/);
    assert.match(css, /\.messageBar\s*\{\s*width:\s*max-content;\s*flex-shrink:\s*0;[\s\S]*?flex-wrap:\s*nowrap;/);
    assert.match(css, /\.reactions\s*\{\s*display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;/);
    assert.match(css, /\.messageStatusBarDiv\s*\{[\s\S]*?overflow-x:\s*auto;/);
    assert.match(css, /\.messageReadSign\s*\{\s*flex-shrink:\s*0;/);
    assert.match(message, /users\.length >= 4 && <span className="reactionCount">\{users\.length\}<\/span>/);
    assert.doesNotMatch(message, /className="reactionMore"/);
});

test("reaction picker opens with the context menu, not an inline add button", () => {
    const message = read("src/pages/Chat/components/Message.tsx");
    const css = read("src/pages/Chat/scss/message.scss");
    assert.doesNotMatch(message, /reactionTrigger|SmilePlus|reactionPickerOpen/);
    assert.doesNotMatch(css, /\.reactionTrigger/);
    assert.match(message, /contextReactionOpen && createPortal\(/);
    assert.match(message, /<ReactionPicker[\s\S]*?onSelect=\{reaction => \{/);
});


test("quick reaction restores hover-only behavior outside message metadata", () => {
    const message = read("src/pages/Chat/components/Message.tsx");
    const css = read("src/pages/Chat/scss/message.scss");
    assert.match(message, /!isMobile && !isChose && !m\.isPending && uniqueReactions\.length === 0 && <button/);
    assert.match(message, /className=\{`reactionButt \$\{isMy \? "myRB" : "urRB"\}\`\}/);
    assert.match(message, /void setReaction\(m\.id, emote\);/);
    assert.match(css, /\.reactionButt\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?visibility:\s*hidden;/);
    assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)\s*\{\s*\.message:hover > &,/);
    assert.match(css, /right:\s*calc\(100% - 8px\)/);
    assert.match(css, /left:\s*calc\(100% - 8px\)/);
    assert.doesNotMatch(message, /reactionTrigger|reactionPickerOpen/);
});

test("quick reaction overlaps bubble so hover never crosses an empty gap", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    const button = css.match(/\.reactionButt\s*\{[\s\S]*?@media \(hover: hover\) and \(pointer: fine\)/)?.[0];
    assert.ok(button);
    assert.match(button, /&\.myRB\s*\{\s*right:\s*calc\(100% - 8px\);/);
    assert.match(button, /&\.urRB\s*\{\s*left:\s*calc\(100% - 8px\);/);
    assert.doesNotMatch(button, /&::before/);
});

test("outgoing message metadata stays flush right within the bubble", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    assert.match(css, /&\.my\s*\{[\s\S]*?> \.messageStatusBarDiv\s*\{\s*align-self:\s*flex-end;\s*margin-left:\s*auto;/);
    assert.match(css, /> \.messageStatusBarDiv\s*\{[\s\S]*?flex-direction:\s*row-reverse;\s*> \.messageBar\s*\{\s*flex-direction:\s*row-reverse;/);
    assert.match(css, /\.message\.mediaOnly\s*\{[\s\S]*?> \.messageStatusBarDiv\s*\{[\s\S]*?right:\s*7px;/);
});

test("reaction items match status metadata height and don't stretch message footer", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    const message = read("src/pages/Chat/components/Message.tsx");
    const reactionStyles = css.match(/\.reactionItem\s*\{[\s\S]*?&\.active\s*\{/ )?.[0];
    assert.ok(reactionStyles);
    assert.match(reactionStyles, /box-sizing:\s*border-box;/);
    assert.match(reactionStyles, /min-height:\s*0;/);
    assert.match(reactionStyles, /height:\s*20px;/);
    assert.match(reactionStyles, /padding:\s*0 3px;/);
    assert.match(reactionStyles, /background:\s*transparent;/);
    assert.match(message, /<ReactionIcon value=\{reaction\} size=\{17\} \/>/);
    assert.doesNotMatch(css, /\.reactionItem\s*\{\s*flex-direction:\s*row;[\s\S]{0,90}min-height:\s*26px/);
});
