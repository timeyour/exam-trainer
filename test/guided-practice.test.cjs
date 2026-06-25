const test = require("node:test");
const assert = require("node:assert/strict");
const { buildGuidedRound } = require("../web/guided-practice.js");

const questions = [
  { id: "Q1", chapter: "第一章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
  { id: "Q2", chapter: "第一章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
  { id: "Q3", chapter: "第二章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
  { id: "Q4", chapter: "第二章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
  { id: "Q5", chapter: "第三章", type: "single", options: [{}, {}], validForExam: false, validForStudy: true },
  { id: "Q6", chapter: "第三章", type: "short", options: [], validForExam: true, validForStudy: true },
  { id: "Q7", chapter: "第四章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true }
];

test("uses only eligible unlearned questions and skips non-foundation high-risk items", () => {
  const round = buildGuidedRound({
    courseId: "ai",
    questions,
    masteryItems: [
      { courseId: "ai", questionId: "Q2", status: "未学" },
      { courseId: "ai", questionId: "Q4", status: "未学", guidedRecallCorrectCount: 2 }
    ],
    wrongPoolItems: [
      { courseId: "ai", questionId: "Q1", lastReason: "没学过" },
      { courseId: "ai", questionId: "Q3", lastReason: "概念混淆" }
    ],
    randomize: (items) => items
  });

  assert.deepEqual(round.learnQuestionIds, ["Q1", "Q2", "Q7"]);
  assert.equal(round.learnQuestionIds.includes("Q3"), false);
  assert.equal(round.learnQuestionIds.includes("Q4"), false);
  assert.equal(round.learnQuestionIds.includes("Q5"), false);
  assert.equal(round.learnQuestionIds.includes("Q6"), false);
});

test("builds a three-question quiz from learned questions before using course fallbacks", () => {
  const round = buildGuidedRound({
    courseId: "ai",
    questions,
    masteryItems: [],
    wrongPoolItems: [],
    randomize: (items) => items
  });

  assert.equal(round.learnQuestionIds.length, 3);
  assert.equal(round.quizQuestionIds.length, 3);
  assert.equal(round.quizQuestionIds[0], round.learnQuestionIds[0]);
  assert.ok(round.quizQuestionIds.every((id) => ["Q1", "Q2", "Q3", "Q4"].includes(id)));
});

test("full mode includes every eligible exam question for learn and quiz", () => {
  const round = buildGuidedRound({
    courseId: "ai",
    questions,
    masteryItems: [
      { courseId: "ai", questionId: "Q4", status: "未学", guidedRecallCorrectCount: 2 }
    ],
    wrongPoolItems: [
      { courseId: "ai", questionId: "Q3", lastReason: "概念混淆" }
    ],
    full: true,
    randomize: (items) => items
  });

  assert.deepEqual(round.learnQuestionIds, ["Q1", "Q2", "Q3", "Q4", "Q7"]);
  assert.deepEqual(round.quizQuestionIds, ["Q1", "Q2", "Q3", "Q4", "Q7"]);
});

test("never returns a question from a different course evidence set", () => {
  const round = buildGuidedRound({
    courseId: "ai",
    questions,
    masteryItems: [{ courseId: "python", questionId: "Q2", status: "未学" }],
    wrongPoolItems: [{ courseId: "python", questionId: "Q1", lastReason: "没学过" }],
    randomize: (items) => items
  });

  assert.deepEqual(round.learnQuestionIds, ["Q1", "Q2", "Q3"]);
});

test("does not reintroduce mastered items from fallback and keeps quiz safe", () => {
  const bank = [
    { id: "Q1", chapter: "第一章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q2", chapter: "第二章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true }
  ];

  const round = buildGuidedRound({
    courseId: "ai",
    questions: bank,
    masteryItems: [
      { courseId: "ai", questionId: "Q1", status: "未学", guidedRecallCorrectCount: 2 },
      { courseId: "ai", questionId: "Q2", status: "未学", guidedRecallCorrectCount: 2 }
    ],
    wrongPoolItems: [],
    randomize: (items) => items
  });

  assert.deepEqual(round.learnQuestionIds, []);
  assert.deepEqual(round.quizQuestionIds, ["Q1", "Q2"]);
});

test("batch mode respects learnCount and quizCount", () => {
  const questions = [
    { id: "Q1", chapter: "第一章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q2", chapter: "第一章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q3", chapter: "第二章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q4", chapter: "第二章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q5", chapter: "第三章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q6", chapter: "第三章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true },
    { id: "Q7", chapter: "第四章", type: "single", options: [{}, {}], validForExam: true, validForStudy: true }
  ];

  const round = buildGuidedRound({
    courseId: "ai",
    questions,
    masteryItems: [],
    wrongPoolItems: [],
    learnCount: 5,
    quizCount: 5,
    randomize: (items) => items
  });

  assert.equal(round.learnQuestionIds.length, 5);
  assert.equal(round.quizQuestionIds.length, 5);
});

test("handles an empty question bank without throwing", () => {
  const round = buildGuidedRound({
    courseId: "ai",
    questions: [],
    masteryItems: [{ courseId: "ai", questionId: "Q1", status: "未学", guidedRecallCorrectCount: 2 }],
    wrongPoolItems: [{ courseId: "ai", questionId: "Q1", lastReason: "没学过" }],
    randomize: (items) => items
  });

  assert.deepEqual(round.learnQuestionIds, []);
  assert.deepEqual(round.quizQuestionIds, []);
});
