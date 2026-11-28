import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("chat videos play inline, retain first frame and reserve a separate status row", () => {
    const view = read("src/pages/Chat/utils/MessageFiles.tsx");
    const css = read("src/pages/Chat/scss/message.scss");
    assert.match(view, /controls playsInline poster=\{poster\}/);
    assert.match(view, /firstFramePoster/);
    assert.match(view, /video\.videoWidth \/ video\.videoHeight/);
    assert.match(css, /\.message\.mediaOnly\.hasVideo\s*\{\s*>\s*\.messageStatusBarDiv\s*\{\s*position:\s*static/);
    assert.match(css, /--message-video-ratio/);
});
test("video playback is exclusive and pauses for file pickers and modals", () => {
    const guard = read("src/components/ts/utils/videoPlayback.ts");
    assert.match(guard, /addEventListener\("play", play, true\)/);
    assert.match(guard, /pauseVideos\(event\.target\)/);
    assert.match(guard, /event\.target\.type === "file"/);
    assert.match(guard, /#t=0\.001/);
    assert.match(read("src/components/ts/Blackout.tsx"), /if \(blackout\.seted\) pauseVideos\(\)/);
    assert.match(read("src/App.tsx"), /installVideoPlaybackGuard\(\)/);
});
test("iOS dropped files are detached from provider handles before multipart upload", () => {
    const util = read("src/components/ts/utils/fileDrop.ts");
    assert.match(util, /await file\.arrayBuffer\(\)/);
    assert.match(util, /new File\(\[bytes\], file\.name/);
    assert.match(util, /50_000_000/);
    for (const path of ["src/components/context/DropContext.tsx", "src/components/ts/TA.tsx", "src/components/context/SendMessContext.tsx"]) {
        assert.match(read(path), /materializeDroppedFiles\(/);
    }
});

test("single videos stay compact without changing their aspect ratio", () => {
    const css = read("src/pages/Chat/scss/message.scss");
    assert.ok(css.includes("--message-video-max-height: 38dvh;"));
    assert.ok(css.includes("--message-video-max-width: min(70vw, 400px);"));
    assert.ok(css.includes("calc(var(--message-video-max-height) * var(--message-video-ratio, 1.333333))"));
});
