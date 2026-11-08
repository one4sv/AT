import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const html = await readFile(path.join(distDir, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
const entry = scripts
    .map(([, attributes]) => {
        if (!/\btype="module"/.test(attributes)) return null;
        return attributes.match(/\bsrc="([^"]+)"/)?.[1] ?? null;
    })
    .find(Boolean);

if (!entry || !entry.startsWith("/assets/") || !entry.endsWith(".js")) {
    throw new Error("Could not find the production entry script in dist/index.html");
}

const bytes = (await stat(path.join(distDir, entry.slice(1)))).size;
const assetNames = await readdir(path.join(distDir, "assets"));
const jsChunks = assetNames.filter(name => name.endsWith(".js")).length;
const cssFiles = assetNames.filter(name => name.endsWith(".css"));
if (cssFiles.length !== 1) {
    throw new Error(`Expected one eagerly loaded CSS bundle, found ${cssFiles.length}: ${cssFiles.join(", ")}`);
}
if (!html.includes(`/assets/${cssFiles[0]}`)) {
    throw new Error("The single CSS bundle must be included in the initial HTML");
}
const css = await readFile(path.join(distDir, "assets", cssFiles[0]), "utf8");
for (const selector of [".redHabitSL", ".selectListDiv", ".contactPickerList", ".createChatSearch", ".habitParticipantPicker"]) {
    if (!css.includes(selector)) {
        throw new Error(`Required modal style is missing from the initial CSS: ${selector}`);
    }
}
const limit = 1_500_000;
console.log(`Entry: ${entry} — ${(bytes / 1024).toFixed(1)} KiB; JavaScript chunks: ${jsChunks}`);
if (bytes > limit) {
    throw new Error(`Entry script exceeds ${limit / 1_000_000} MB budget. Keep large routes and modals lazy-loaded.`);
}
