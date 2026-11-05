import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wallpaperDir = path.join(root, "public", "wallpapers");
const outputDir = path.join(wallpaperDir, "generated");
const width = 2560;
const height = 1440;

// Keep the original phone photography exactly: no newly invented objects, colors or scenery.
// A landscape aspect ratio necessarily crops some of the portrait composition.
const scenes = [
    { name: "sakura", focus: .48 },
    { name: "alley", focus: .45 },
    { name: "torii", focus: .42 }
];

await mkdir(outputDir, { recursive: true });

for (const scene of scenes) {
    const source = path.join(wallpaperDir, `japanese-${scene.name}-mobile.webp`);
    const destination = path.join(outputDir, `japanese-${scene.name}-desktop.webp`);
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error(`Invalid mobile wallpaper: ${scene.name}`);
    }

    const cropHeight = Math.round(metadata.width * height / width);
    const top = Math.round((metadata.height - cropHeight) * scene.focus);
    if (cropHeight <= 0 || cropHeight > metadata.height || top < 0) {
        throw new Error(`Unsupported mobile wallpaper dimensions: ${scene.name}`);
    }

    await sharp(source)
        .extract({ left: 0, top, width: metadata.width, height: cropHeight })
        .resize(width, height, { kernel: sharp.kernel.lanczos3 })
        .sharpen({ sigma: .7 })
        .webp({ quality: 93, effort: 6 })
        .toFile(destination);

    const bytes = await readFile(destination);
    const declaredSize = bytes.readUInt32LE(4) + 8;
    if (bytes.length < 100_000 || bytes.toString("ascii", 0, 4) !== "RIFF" ||
        bytes.toString("ascii", 8, 12) !== "WEBP" || declaredSize !== bytes.length) {
        throw new Error(`Desktop wallpaper generated incorrectly: ${scene.name}`);
    }
    console.log(`Generated desktop wallpaper: ${scene.name} (${width}×${height}, ${bytes.length} bytes)`);
}
