import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("health tag uses FirstAidIcon and chat avatar has smaller left inset", () => {
    const registry = read("src/components/ts/tags.ts");
    const header = read("src/pages/Chat/scss/chatUser.scss");
    assert.match(registry, /FirstAidIcon/);
    assert.match(registry, /\{ icon: FirstAidIcon, label: "Здоровье", value: "health", group:"health" \}/);
    assert.match(header, /\.chatUserPick\s*\{[\s\S]*?padding-left:\s*\.15vw/);
    assert.match(header, /@media \(max-width: 800px\) \{\s*padding-left:\s*\.25vw/);
});

test("Saved has share actions for entities without invitation or group commands", () => {
    const c = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    const list = c.slice(c.indexOf("const savedShareCommandItems"), c.indexOf("const commandQuery"));
    for (const kind of ["habit", "plan", "post", "user"]) {
        assert.match(list, new RegExp('id:"share:' + kind + '"'));
    }
    assert.doesNotMatch(list, /share:invite|share:group/);
    assert.match(c, /selectSavedCommand\(matchingCommands\[/);
    assert.match(c, /onSelect=\{selectSavedCommand\}/);
    assert.match(list, /id:"share:plan",label:"\/shareplan"/);
    assert.match(c, /parseQuickInput\(mess\)/);
    assert.doesNotMatch(c, /<QuickCommandComposer/);
    assert.match(c, /shareMatch \? shareItems : plainShare/);
    assert.match(c, /setLinkedEntity\(\{type:kind,id:entityId,label:item.label\}\)/);
});

test("inline slash highlight stays underneath editable textarea", () => {
    const c = read("src/pages/Chat/components/ChatTa/ChatTextArea.tsx");
    const css = read("src/pages/Chat/scss/chatTa.scss");
    assert.match(c, /className="chatCommandHighlight"/);
    assert.match(c, /onScroll=\{e => setCommandScrollTop\(e.currentTarget.scrollTop\)\}/);
    assert.match(css, /\.chatCommandHighlight \{[\s\S]*?pointer-events:\s*none/);
    assert.match(css, /\.chatCommandHighlight \{[\s\S]*?background:\s*var\(--accent_highlight\)/);
    assert.match(css, /\.commandArgument \{[\s\S]*?background:\s*var\(--accent_highlight\)/);
    assert.match(c, /className="commandPlaceholder"/);
});
