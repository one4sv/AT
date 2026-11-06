import sharp from "sharp";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "assets", "wallpaper-sources");
const outputDir = path.join(root, "public", "wallpapers");
const scenes = ["sakura", "alley", "torii"];
const sizes = { desktop: [2560, 1440], mobile: [1440, 2560] };
const expectedSourceSizes = {
    "sakura-mobile": 4126265,
    "sakura-desktop": 3209132,
    "alley-mobile": 3639711,
    "alley-desktop": 2734585,
    "torii-mobile": 3579120,
    "torii-desktop": 2702921
};

// The source PNGs are split into small, byte-identical base64 parts to avoid
// truncating binary files when transferring them through the GitHub integration.
// No crop or conversion from a mobile image is used to create a desktop image.
await mkdir(outputDir, { recursive: true });
const names = await readdir(sourceDir);

for (const scene of scenes) {
    for (const [device, [width, height]] of Object.entries(sizes)) {
        const name = `japanese-${scene}-${device}`;
        const prefix = name + ".part";
        const parts = names.filter(file => file.startsWith(prefix) && file.endsWith(".b64")).sort();
        if (!parts.length) throw new Error(`Missing original PNG parts for ${name}`);

        const encoded = (await Promise.all(parts.map(async part =>
            (await readFile(path.join(sourceDir, part), "utf8")).trim()
        ))).join("");
        const image = Buffer.from(encoded, "base64");
        if (image.length !== expectedSourceSizes[`${scene}-${device}`] ||
            image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
            throw new Error(`Corrupted original PNG source for ${name}`);
        }

        const output = path.join(outputDir, name + ".webp");
        await sharp(image).resize(width, height, { fit: "fill", kernel: "lanczos3" })
            .webp({ quality: 85, effort: 5 }).toFile(output);

        const bytes = await readFile(output);
        const metadata = await sharp(bytes).metadata();
        if (bytes.length < 100_000 ||
            bytes.toString("ascii", 0, 4) !== "RIFF" ||
            bytes.toString("ascii", 8, 12) !== "WEBP" ||
            bytes.readUInt32LE(4) + 8 !== bytes.length ||
            metadata.width !== width || metadata.height !== height) {
            throw new Error(`Invalid generated WebP file for ${name}`);
        }
        console.log(`Verified ${name}.webp: ${width}x${height}, ${bytes.length} bytes`);
    }
}
