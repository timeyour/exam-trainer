const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBarrierProfile, buildDailyResearch } = require("../web/learning-barriers.js");

const now = new Date("2026-06-21T12:00:00+08:00");
const today = now.toISOString();

test("does not diagnose a barrier with fewer than three relevant observations", () => {
  const profile = buildBarrierProfile({
    courseId: "ai",
    now,
    totalQuestions: 100,
    practicedQuestions: 2,
    events: [],
    questionResults: []
  });
  assert.equal(profile.primary.code, "insufficient_data");
  assert.equal(profile.primary.confidence, "样本不足");
});

test("entry gap wins over expression reports while foundation evidence dominates", () => {
  const profile = buildBarrierProfile({
    courseId: "ai",
    now,
    totalQuestions: 100,
    practicedQuestions: 6,
    events: [
      { type: "study_unlearned", courseId: "ai", createdAt: today },
      { type: "study_unlearned", courseId: "ai", createdAt: today },
      { type: "expression_gap_report", courseId: "ai", questionId: "Q1", sessionId: "s1", createdAt: today }
    ],
    questionResults: [{ clickedUnknown: true }, { clickedUnknown: true }, { clickedUnknown: true }]
  });
  assert.equal(profile.primary.code, "entry_gap");
});

test("a clear event cancels the matching expression report", () => {
  const profile = buildBarrierProfile({
    courseId: "ai",
    now,
    totalQuestions: 10,
    practicedQuestions: 8,
    events: [
      { type: "expression_gap_report", courseId: "ai", questionId: "Q1", sessionId: "s1", createdAt: today },
      { type: "expression_gap_clear", courseId: "ai", questionId: "Q1", sessionId: "s1", createdAt: today },
      { type: "study_remembered", courseId: "ai", createdAt: today },
      { type: "study_remembered", courseId: "ai", createdAt: today }
    ],
    questionResults: [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }]
  });
  assert.equal(profile.items.find((item) => item.code === "expression_gap").evidenceCount, 0);
});

test("a correct answer followed by a different-day wrong answer identifies retention risk", () => {
  const profile = buildBarrierProfile({
    courseId: "ai",
    now,
    totalQuestions: 20,
    practicedQuestions: 12,
    events: [],
    questionResults: [
      { questionId: "Q1", isCorrect: true, createdAt: "2026-06-18T09:00:00+08:00" },
      { questionId: "Q1", isCorrect: false, createdAt: "2026-06-20T09:00:00+08:00" },
      { questionId: "Q2", isCorrect: true, createdAt: "2026-06-18T09:00:00+08:00" },
      { questionId: "Q2", isCorrect: false, createdAt: "2026-06-20T09:00:00+08:00" }
    ]
  });
  assert.equal(profile.items.find((item) => item.code === "retention_gap").evidenceCount, 2);
});

test("daily research says no new data instead of inventing a conclusion", () => {
  const report = buildDailyResearch({
    profile: { primary: { code: "entry_gap", label: "没印象", evidence: "3 次没印象" } },
    now,
    todayEvents: [],
    todayResults: []
  });
  assert.equal(report.noData, true);
  assert.match(report.summary, /没有新的学习数据/);
});

test("retrieval gap becomes primary when familiar-but-unsure evidence dominates", () => {
  const profile = buildBarrierProfile({
    courseId: "ai",
    now,
    totalQuestions: 50,
    practicedQuestions: 20,
    events: [],
    questionResults: [
      { clickedFamiliarButUnsure: true, isCorrect: false },
      { clickedFamiliarButUnsure: true, isCorrect: false },
      { confidence: "不确定", isCorrect: false }
    ]
  });
  assert.equal(profile.primary.code, "retrieval_gap");
  assert.equal(profile.primary.recommendedMode, "题眼背题");
});
