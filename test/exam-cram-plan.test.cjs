const test = require("node:test");
const assert = require("node:assert/strict");
const plan = require("../web/exam-cram-plan.js");

test("exam cram demo plan covers demo week", () => {
  assert.equal(plan.DAILY_PLANS.length, 3);
  assert.equal(plan.DAILY_PLANS[0].date, "2026-09-01");
  assert.ok(plan.isActiveCramDate("2026-09-02"));
  assert.equal(plan.isActiveCramDate("2026-08-31"), false);
});

test("demo top ids are unique", () => {
  assert.equal(plan.DEMO_TOP_IDS.length, 8);
  assert.equal(new Set(plan.DEMO_TOP_IDS).size, 8);
});

test("app shell wires exam cram plan into today flow", () => {
  const fs = require("node:fs");
  const appSource = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");
  const workerSource = fs.readFileSync("web/sw.js", "utf8");
  assert.match(appSource, /function getCramFlowForToday/);
  assert.match(appSource, /function startDemoTopStudy/);
  assert.match(indexSource, /exam-cram-plan\.js/);
  assert.match(workerSource, /"exam-cram-plan\.js"/);
});
