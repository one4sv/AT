import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compositionCommandInput, resolveCompositionShare, sharedCompositionLink, parseSharedCompositionLink, sharedCompositionAttachment } from "../src/components/ts/utils/sharedComposition.ts";
const origin = "https://achievetogether.vercel.app";
const item = {id:"private",name:"Test",appearance:{bg:"custom",bgUrl:"private-url",theme:"light",accent:"custom",customAccentHex:"#123456"}};
test("composition slots resolve only saved items, never empty or invalid slots", () => {
    assert.equal(compositionCommandInput("/settings interface compositions 1"),"1");
    assert.equal(resolveCompositionShare("1",[item]),item);
    for (const slot of ["","0","2","11","foo"]) assert.equal(resolveCompositionShare(slot,[item]),null);
});
test("composition snapshots exclude private gallery and validate received fields", () => {
    const href = sharedCompositionLink(item,origin);
    assert.ok(!href.includes("private"));
    const snapshot = parseSharedCompositionLink(href,origin);
    assert.equal(snapshot.appearance.bgUrl,"");
    assert.equal(snapshot.appearance.customAccentHex,"#123456");
    assert.equal(parseSharedCompositionLink(href.replace(origin,"https://example.com"),origin),null);
    const media={type:"image/webp",url:"/api/private-asset/media/test"};
    assert.equal(sharedCompositionAttachment(href,[media],origin),media);
    assert.equal(sharedCompositionAttachment(href,[],origin),undefined);
});
test("missing command slots return before the send pipeline", () => {
    const ta=readFileSync(new URL("../src/pages/Chat/components/ChatTa/ChatTextArea.tsx",import.meta.url),"utf8");
    assert.match(ta,/if \(!settingsLoaded \|\| !compositionChoice\) \{\s*showNotification\("error", settingsText\("personalization\.compositions\.shareNotFound"\)\);\s*return;/);
    assert.match(ta,/if \(!settingsLoaded \|\| !wallpaperChoice\) \{\s*showNotification\("error", settingsText\("backgroundLibrary\.shareNotFound"\)\);\s*return;/);
});
