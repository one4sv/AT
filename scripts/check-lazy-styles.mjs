import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const modules = readFileSync(resolve(root, "src/components/modules/ModuleMap.ts"), "utf8");
const lazyImports = source => [...source.matchAll(/\blazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)/g)].map(match => match[1]);
const entries = [
    ...lazyImports(app).map(file => resolve(root, "src", file + ".tsx")),
    ...lazyImports(modules).map(file => resolve(root, "src/components/modules", file + ".tsx"))
];

// The local-only Admin page is intentionally a minimal, unstyled development tool.
const inlineOnly = new Set([resolve(root, "src/pages/Admin.tsx")]);
const shared = [
    "src/pages/Acc/components/AccInfo.tsx",
    "src/components/ts/Habit.tsx",
    "src/components/ts/ConnectionStatus.tsx",
    "src/components/ts/CalendarInput.tsx"
].map(file => resolve(root, file));

const failures = [];
for (const file of [...new Set([...entries, ...shared])]) {
    if (!existsSync(file)) {
        failures.push(`Missing component: ${file}`);
        continue;
    }
    if (inlineOnly.has(file)) continue;
    const code = readFileSync(file, "utf8");
    if (!/\bimport\s*["'][^"']+\.(?:scss|css)["']/.test(code)) {
        failures.push(`Styles are not imported by their owner: ${file}`);
    }
}

if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
} else {
    console.log(`Lazy styles: ${entries.length} lazy entries + ${shared.length} reusable components checked`);
}
