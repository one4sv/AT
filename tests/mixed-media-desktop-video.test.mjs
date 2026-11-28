import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("PWA declares both standard and Apple capability tags", () => {
    const html = read("index.html");
    assert.match(html, /name="mobile-web-app-capable" content="yes"/);
    assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
    assert.match(html, /content="black-translucent"/);
});
test("chat library opens mixed media in the existing viewer rather than routing video URLs", () => {
    const library = read("src/components/modules/components/ChatMedia.tsx");
    const viewer = read("src/components/modules/ImgPrev.tsx");
    assert.doesNotMatch(library, /if \(item\.category === "video"\)\s*\{\s*openLink/);
    assert.match(library, /media\.category === "photo" \|\| media\.category === "video"/);
    assert.match(library, /module: "ImgPrev"/);
    assert.match(viewer, /<PreviewVideo item=\{image\} active=\{offset === 0\}/);
    assert.match(viewer, /controls=\{active && !desktop\}/);
    assert.match(viewer, /type: currentImages\[imageIndex\]\?\.type/);
});
test("desktop controls use existing SeekBar and operate on the actual video", () => {
    const view = read("src/components/ts/VideoControls.tsx");
    for (const feature of ["video.play()", "video.pause()", "video.currentTime =", "video.volume =", "video.playbackRate =", "requestFullscreen()", "document.exitFullscreen()", "seek(state.time - 10)", "seek(state.time + 10)"]) assert.ok(view.includes(feature), feature);
    assert.equal((view.match(/<SeekBar /g) || []).length, 2);
    assert.match(read("src/pages/Chat/utils/MessageFiles.tsx"), /<VideoControls videoRef=\{videoRef\}/);
});
