const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveTodayPrimaryAction } = require("../web/today-router.js");

const baseStats = {
  questionCount: 100,
  guidedPracticeReady: true,
  memorizeCount: 20,
  instantDrillCount: 50,
  examEligibleCount: 80,
  repairCandidateCount: 5,
  forgetFragileCount: 2,
  recallDueCount: 2,
  highRiskCount: 0,
  unlearnedCount: 30,
  examCount: 0,
  lastScore: "-",
  microTaskCount: 3,
  coverage: 0.1,
  todayProgress: 5
};

test("routes to import when course has no questions", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_a",
    stats: { ...baseStats, questionCount: 0 }
  });
  assert.equal(plan.action, "import");
});

test("entry gap routes to guided practice during cram", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_a",
    courseName: "示例科目 A",
    cramFlow: { focusCourseId: "demo_a", minQuestions: 20, reason: "今天主攻" },
    barrierProfile: { primary: { code: "entry_gap", confidence: "初步观察", evidence: "3 次没印象" } },
    stats: baseStats
  });
  assert.equal(plan.action, "guided");
  assert.match(plan.buttonLabel, /今日继续/);
});

test("retrieval gap on ai intro prefers top50 when enabled", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_a",
    showTop50: true,
    barrierProfile: { primary: { code: "retrieval_gap", confidence: "初步观察", evidence: "眼熟但不会" } },
    stats: baseStats
  });
  assert.equal(plan.action, "memorize-top50");
});

test("transfer gap prefers micro review when available", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_a",
    barrierProfile: { primary: { code: "transfer_gap", confidence: "初步观察", evidence: "限时乱" } },
    stats: baseStats
  });
  assert.equal(plan.action, "micro");
});

test("active course wins over cram focus course", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_b",
    courseName: "示例科目 B",
    cramFlow: { focusCourseId: "demo_a", focusCourseName: "示例科目 A", minQuestions: 20, reason: "今天主攻 AI 导论" },
    barrierProfile: { primary: { code: "entry_gap", confidence: "初步观察", evidence: "3 次没印象" } },
    stats: baseStats
  });
  assert.equal(plan.courseId, "demo_b");
  assert.equal(plan.courseName, "示例科目 B");
  assert.equal(plan.action, "guided");
});

test("high risk wrong pool overrides instant drill after some exam history", () => {
  const plan = resolveTodayPrimaryAction({
    courseId: "demo_a",
    barrierProfile: { primary: { code: "retrieval_gap", confidence: "初步观察", evidence: "眼熟" } },
    stats: { ...baseStats, highRiskCount: 8, coverage: 0.5, examCount: 2 }
  });
  assert.equal(plan.action, "wrong");
});
