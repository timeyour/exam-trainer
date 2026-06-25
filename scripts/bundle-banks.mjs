import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXAM_DIR = path.join(ROOT, "shared", "exam");
const OUT_FILE = path.join(ROOT, "web", "banks.js");

const COURSE_FILES = {
  demo_a: "demo-a-question-bank.json",
  demo_b: "demo-b-question-bank.json",
  demo_c: "demo-c-question-bank.json"
};

const banks = {};
for (const [courseId, fileName] of Object.entries(COURSE_FILES)) {
  banks[courseId] = JSON.parse(fs.readFileSync(path.join(EXAM_DIR, fileName), "utf8"));
}

fs.writeFileSync(OUT_FILE, `window.__EXAM_COURSE_BANKS__ = ${JSON.stringify(banks)};\n`);
console.log(`Wrote ${OUT_FILE}`);
