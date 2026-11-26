import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
test("account navigation uses the existing context menu on all six surfaces",()=>{
    const source=read("src/components/ts/SM/AccountList.tsx");
    for(const id of ["profile","feed","active","settings","saved","more"]) assert.ok(source.includes('openNavigationMenu(event, "'+id+'"'));
    assert.match(source,/data-context-menu-allow-button="true"/);
    assert.match(read("src/components/ts/ContextMenu/ContextMenu.tsx"),/case "smAccountNavigation":\s*return <SMAccountMenu/);
});
test("profile header uses measured right alignment; card uses same menu component",()=>{
    const header=read("src/components/ts/Header.tsx");
    assert.doesNotMatch(header,/rect\.right - 240/);
    assert.match(header,/anchorRight: true/);
    assert.match(read("src/components/ts/ContextMenu/ContextMenu.tsx"),/menu\.options\.anchorRight \? menu\.x - menuWidth/);
    assert.match(read("src/pages/Acc/components/AccInfo.tsx"),/className="accInfoInner"[^>]*data-context-menu=/);
});
test("QR photo is square and sidebar overview uses the Active label",()=>{
    const css=read("src/components/modules/scss/ShareAccDiv.scss");
    assert.match(css,/\.qrCodePhoto\s*\{[^}]*height: auto;[^}]*aspect-ratio: 1;/);
    assert.match(read("src/components/ts/SM/SMheader.tsx"),/sideMenu\.plansAndActivities/);
});
