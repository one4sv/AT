import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { wallpaperCommandInput, resolveWallpaperShare, sharedWallpaperLink, parseSharedWallpaperLink, sharedWallpaperAttachment } from "../src/components/ts/utils/backgroundCatalog.ts";
const origin = "https://achievetogether.vercel.app";
const gallery = [{url:"one"},{url:"two"},{url:"three"}];
test("wallpaper commands resolve catalog aliases, current and numbered custom images", () => {
    for (const [command,id] of [["antic statue","greekStatue"],["antic gladiator","greekGladiator"],["retro city","neonCity"],["myph tree","mythTree"],["myth tree","mythTree"]]) {
        const value = wallpaperCommandInput("/settings interface background image " + command);
        assert.deepEqual(resolveWallpaperShare(value, "", "", gallery), {kind:"stock",id});
    }
    assert.deepEqual(resolveWallpaperShare("current","custom","one",gallery), {kind:"custom",url:"one"});
    assert.deepEqual(resolveWallpaperShare("3","","",gallery), {kind:"custom",url:"three"});
    assert.equal(resolveWallpaperShare("4","","",gallery), null);
    assert.equal(resolveWallpaperShare("current","color","",gallery), null);
    assert.equal(resolveWallpaperShare("modern paris","","",gallery), null);
});
test("custom links contain no private gallery URL and bind only one message image", () => {
    const href = sharedWallpaperLink({kind:"custom",url:"secret"},origin);
    assert.equal(href, origin + "/wallpapers?shared=custom");
    assert.deepEqual(parseSharedWallpaperLink(href,origin),{kind:"custom"});
    const media = {type:"image/webp",url:"/api/private-asset/media/test"};
    assert.equal(sharedWallpaperAttachment(href,[media],origin),media);
    assert.equal(sharedWallpaperAttachment(href,[media,media],origin),undefined);
    assert.equal(sharedWallpaperAttachment("https://example.com/wallpapers?shared=custom",[media],origin),undefined);
    assert.equal(parseSharedWallpaperLink(origin+"/wallpapers?shared=modernParis",origin),null);
});
test("wallpaper catalog retains back on the left, applies in the center and toggles on the right", () => {
    const studio=readFileSync(new URL("../src/pages/WallpaperStudio/WallpaperStudio.tsx",import.meta.url),"utf8");
    const bottom = studio.slice(studio.indexOf('<PageBottom className="wallpaperStudioBottom"'));
    assert.match(bottom, /onBack=\{\(\) => navigate\("\/settings\/pers"\)\}/);
    assert.ok(bottom.indexOf("pageBottomAction wallpaperHeaderApply") < bottom.indexOf("pageBottomBack wallpaperStudioCatalogToggle"));
    assert.match(bottom,/open \? <ChevronDown\/> : <ChevronUp\/>/);
    assert.match(studio,/pageBottomAction wallpaperHeaderApply/);
    assert.match(studio,/isApplied \? "backgroundLibrary.shareSelected" : "backgroundLibrary.shareChoose"/);
});
