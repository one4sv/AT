import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("GroupInfo owns the profile info stylesheet, without prior Acc navigation", () => {
    const component = read("src/pages/Group/components/GroupInfo.tsx");
    const group = read("src/pages/Group/scss/Group.scss");
    assert.ok(component.includes('import "../../Acc/scss/AccInfo.scss";'));
    assert.ok(group.includes('@use "../../Acc/scss/Acc.scss";'));
});

test("group online status is anchored at the avatar, not the far right of the header", () => {
    const component = read("src/pages/Group/components/GroupInfo.tsx");
    const styles = read("src/pages/Group/scss/Group.scss");
    const anchor = component.slice(
        component.indexOf('<div className="groupAvatarStatusAnchor">'),
        component.indexOf('<input', component.indexOf('<div className="groupAvatarStatusAnchor">'))
    );

    assert.match(anchor, /className="accPic groupAvatar"/);
    assert.match(anchor, /className=\{\`accOnlineStauts/);
    assert.equal((component.match(/className=\{\`accOnlineStauts/g) ?? []).length, 1);
    assert.match(styles, /\.groupAvatarStatusAnchor\s*\{\s*position:\s*relative;/);
    assert.match(styles, /\.accOnlineStauts\s*\{\s*left:\s*calc\(100% - 0\.8dvh\)/);
    assert.match(styles, /@media\s*\(max-width:\s*800px\)\s*\{[\s\S]*?width:\s*20vh;/);
});

test("avatar and status styles are guaranteed in the initial CSS", () => {
    const shared = read("src/pages/Acc/scss/AccInfo.scss");
    const bundleCheck = read("scripts/check-bundle.mjs");
    const lazyCheck = read("scripts/check-lazy-styles.mjs");
    assert.match(shared, /\.accPic\s*\{\s*position:\s*relative;/);
    assert.ok(bundleCheck.includes('".groupAvatarStatusAnchor"'));
    assert.ok(bundleCheck.includes('".accOnlineStauts"'));
    assert.ok(lazyCheck.includes('"src/pages/Group/components/GroupInfo.tsx"'));
});
