import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => readFileSync(path.join(root, file), "utf8");
const errors = [];
const pkg = JSON.parse(read("package.json"));
const roadmap = read("src/pages/Info/roadmapData.ts");
const about = read("src/pages/Info/tabs/AboutTab.tsx");
const docs = ["AGENTS.md", "docs/ROADMAP_PROPOSAL.md", "docs/V0_6_FEATURES_AND_QA.md", "docs/RELEASE_QA.md"];

const version = pkg.version.match(/^(\d+\.\d+\.\d+)(?:-dev(?:\.\d+)?)?$/)?.[1];
if (!version) errors.push(`Invalid package version: ${pkg.version}`);
const current = roadmap.match(/export const roadmapCurrent: RoadmapRelease = \{\s*version: "([^"]+)"/)?.[1];
if (current !== version) errors.push(`Roadmap current ${current} differs from package ${version}`);
const versions = [...roadmap.matchAll(/\bversion: "([^"]+)"/g)].map(match => match[1]);
const duplicates = versions.filter((value, index) => versions.indexOf(value) !== index);
if (duplicates.length) errors.push(`Repeated roadmap versions: ${[...new Set(duplicates)].join(", ")}`);
if (versions.filter(value => value === version).length !== 1) errors.push("Current version must occur exactly once");
if (!about.includes("roadmap")) errors.push("About page must link to roadmap");
for (const doc of docs) {
    if (!read(doc).includes(version)) errors.push(`${doc}: current version ${version} is missing`);
}
if (/title:\s*\{\s*ru:/.test(roadmap)) errors.push("Release titles must be invariant English strings");
if (errors.length) {
    console.error("Release consistency failed:\n" + errors.map(error => "- " + error).join("\n"));
    process.exitCode = 1;
} else {
    console.log(`Release consistency OK: ${version}; ${versions.length} roadmap entries. No changelog generated.`);
}
