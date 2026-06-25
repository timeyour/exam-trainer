const test = require("node:test");
const assert = require("node:assert/strict");
const { buildLearningStatus } = require("../web/learning-estimates.js");

const now = new Date("2026-06-21T12:00:00+08:00");
const course = { id: "ai", examDate: "2026-09-01", examTime: "10:00" };

function input(overrides = {}) {
  return {
    course,
    now,
    events: [],
    records: [],
    totalQuestions: 100,
    practicedQuestions: 0,
    masteryCounts: {},
    highRiskCount: 0,
    ...overrides
  };
}

test("marks one course reviewed today without counting another course", () => {
  const status = buildLearningStatus(
    input({
      events: [
        { courseId: "ai", createdAt: "2026-06-21T09:00:00+08:00", type: "exam_submit" },
        { courseId: "python", createdAt: "2026-06-21T10:00:00+08:00", type: "practice_correct" }
      ]
    })
  );

  assert.equal(status.reviewedToday, true);
  assert.equal(status.studyDaysLast7, 1);
});

test("with no simulated exam, declares pass evidence insufficient", () => {
  const status = buildLearningStatus(
    input({
      practicedQuestions: 70,
      masteryCounts: { "基本掌握": 20 }
    })
  );

  assert.equal(status.passEstimate.available, false);
  assert.equal(status.passEstimate.confidence, "证据不足");
});

test("high recent scores, coverage, and low risk produce a narrow higher band", () => {
  const status = buildLearningStatus(
    input({
      events: [
        { courseId: "ai", createdAt: "2026-06-18T09:00:00+08:00" },
        { courseId: "ai", createdAt: "2026-06-19T09:00:00+08:00" },
        { courseId: "ai", createdAt: "2026-06-21T09:00:00+08:00" }
      ],
      records: [{ score: 78 }, { score: 84 }, { score: 88 }],
      practicedQuestions: 68,
      masteryCounts: { "基本掌握": 30, "稳定掌握": 24, "浅层熟悉": 3 },
      highRiskCount: 2
    })
  );

  assert.equal(status.passEstimate.available, true);
  assert.equal(status.passEstimate.confidence, "较高");
  assert.equal(status.passEstimate.high - status.passEstimate.low, 16);
  assert.ok(status.passEstimate.center >= 70);
});

test("high risk and no study today reduce a near-exam estimate", () => {
  const stable = buildLearningStatus(
    input({
      events: [{ courseId: "ai", createdAt: "2026-06-21T09:00:00+08:00" }],
      records: [{ score: 72 }, { score: 74 }],
      practicedQuestions: 45,
      masteryCounts: { "基本掌握": 25 },
      highRiskCount: 2
    })
  );
  const risky = buildLearningStatus(
    input({
      course: { ...course, examDate: "2026-06-22" },
      records: [{ score: 72 }, { score: 74 }],
      practicedQuestions: 45,
      masteryCounts: { "基本掌握": 25, "浅层熟悉": 18, "假掌握": 10 },
      highRiskCount: 20
    })
  );

  assert.ok(risky.passEstimate.center < stable.passEstimate.center);
});

test("returns explicit labels for missing and elapsed exam time", () => {
  const missing = buildLearningStatus(input({ course: { id: "ai" } }));
  const elapsed = buildLearningStatus(
    input({ course: { id: "ai", examDate: "2026-06-20", examTime: "08:00" } })
  );

  assert.equal(missing.countdown.label, "考试时间待补");
  assert.equal(elapsed.countdown.label, "已开考");
});
