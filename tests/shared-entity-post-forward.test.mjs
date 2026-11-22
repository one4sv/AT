import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("shared entity uses a loading skeleton and compact left padding", () => {
    const jsx = read("src/pages/Chat/components/SharedEntityCard.tsx");
    const css = read("src/pages/Chat/scss/SharedEntityCard.scss");
    assert.match(jsx, /sharedEntitySkeleton/);
    assert.match(jsx, /setLoading\(true\)/);
    assert.match(jsx, /\.finally\(/);
    assert.match(jsx, /author_nick/);
    assert.match(jsx, /encodeURIComponent\(item\.author_nick\)/);
    assert.match(css, /padding:\s*\.75dvh \.6vw \.75dvh \.22vw/);
    assert.match(css, /-webkit-line-clamp:\s*8/);
});

test("post footer and context menu share the existing forwarding flow", () => {
    const post = read("src/components/ts/Post.tsx");
    const menu = read("src/components/ts/ContextMenu/menus/PostMenu.tsx");
    assert.match(post, /onForward: forward/);
    assert.match(post, /className="PostForward"/);
    assert.match(post, /module: "Redirecting"/);
    assert.match(menu, /options\.onForward/);
});

test("media loading skeletons cover chat attachments and post attachments", () => {
    const chat = read("src/pages/Chat/utils/MessageFiles.tsx");
    const posts = read("src/pages/Acc/utils/AccPostMedia.tsx");
    const styles = read("src/scss/Post.scss");
    assert.match(chat, /messageFileSkeleton/);
    assert.match(posts, /PostVideoPreview/);
    assert.match(posts, /contextMenu\s+skeleton/);
    assert.match(styles, /\.postFilePreview\.messageMediaPending/);
});
