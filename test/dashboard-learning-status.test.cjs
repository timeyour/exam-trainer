const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("dashboard uses shared learning status for every course", () => {
  const source = fs.readFileSync("web/app.js", "utf8");

  assert.match(source, /function buildCourseLearningStatus\(course\)/);
  assert.match(source, /renderLearningStatusPanel\(activeCourse, learningStatus\)/);
  assert.match(source, /data-exam-countdown-course/);
});

test("guided practice source and shell include the guided round hooks", () => {
  const appSource = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");
  const workerSource = fs.readFileSync("web/sw.js", "utf8");

  assert.match(appSource, /function startGuidedPractice\(questionIds = null, options = \{\}\)/);
  assert.match(appSource, /function startGuidedPracticeWithChoice\(/);
  assert.match(appSource, /function persistGuidedSession\(/);
  assert.match(appSource, /getResumableGuidedSession\(activeCourse\.id, null, "batch"\)/);
  assert.match(appSource, /GUIDED_BATCH_SIZE/);
  assert.match(appSource, /renderMemoryLoopGuide/);
  assert.match(appSource, /sessionMode === "full"/);
  assert.doesNotMatch(appSource, /ensureActiveCourseForGuided\(resumableGuidedCourseId\)/);
  assert.match(appSource, /freshTodayGuided/);
  assert.match(appSource, /startExam\("mock", \{ rescueMode: true \}\)/);
  assert.match(appSource, /function renderRescueExam\(/);
  assert.match(appSource, /不会，查看答案题眼/);
  assert.match(appSource, /checkRescueExam/);
  assert.match(appSource, /learnQuestionIds/);
  assert.match(appSource, /beforeunload/);
  assert.match(appSource, /function renderGuidedPractice\(\)/);
  assert.match(appSource, /function saveGuidedRound\(round\)/);
  assert.match(appSource, /guided_reveal/);
  assert.match(indexSource, /<script src="guided-practice\.js" defer><\/script>/);
  assert.match(workerSource, /"guided-practice\.js"/);
});

test("learning barrier profile is shown on dashboard", () => {
  const appSource = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");
  const workerSource = fs.readFileSync("web/sw.js", "utf8");

  assert.match(appSource, /function buildCourseBarrierProfile\(course\)/);
  assert.match(appSource, /function buildCourseDailyResearch\(course, barrierProfile\)/);
  assert.match(appSource, /function renderLearningBarrierPanel\(barrierProfile, dailyResearch, todayPlan/);
  assert.match(appSource, /data-learning-basis/);
  assert.match(appSource, /expression_gap_report/);
  assert.match(appSource, /expression_gap_clear/);
  assert.match(appSource, /会选但说不出/);
  assert.match(appSource, /function toggleExpressionGap\(context, session, question\)/);
  assert.match(indexSource, /learning-barriers\.js/);
  assert.match(workerSource, /"learning-barriers\.js"/);
});

test("dashboard exposes seamless today continue routing", () => {
  const source = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");

  assert.match(source, /id="startTodayContinue"/);
  assert.match(source, /function buildTodayActionPlan\(/);
  assert.match(source, /function startTodayContinue\(plan\)/);
  assert.match(source, /function renderTodayMissionCard\(plan\)/);
  assert.match(source, /我非要换方式/);
  assert.match(indexSource, /today-router\.js/);
});

test("today practice progress uses local date, not UTC prefix", () => {
  const source = fs.readFileSync("web/app.js", "utf8");

  assert.match(source, /function isEventOnLocalDate\(event/);
  assert.match(source, /isEventOnLocalDate\(event, today\)/);
  assert.doesNotMatch(source, /createdAt\?\.startsWith\(today\)/);
});

test("dashboard exposes guided answer-first practice as the primary entry", () => {
  const source = fs.readFileSync("web/app.js", "utf8");

  assert.match(source, /startTodayContinue/);
  assert.match(source, /startGuidedPractice/);
  assert.match(source, /function canStartGuidedPractice\(/);
  assert.match(source, /function getTodayGuidedPracticeSummary\(/);
  assert.match(source, /function getTodayGuidedMissedQuestions\(/);
  assert.match(source, /renderTodayGuidedMissList/);
  assert.match(source, /data-guided-miss-retry/);
  assert.match(source, /recallFailed/);
  assert.match(source, /today-mission-guided-stats/);
  assert.match(source, /renderCloudSyncPanel\(\)/);
  assert.match(source, /<details class="more-training"/);
});
