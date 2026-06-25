const DEFAULT_COURSE_BANK_PATHS = {
  demo_a: "/shared/exam/demo-a-question-bank.json",
  demo_b: "/shared/exam/demo-b-question-bank.json",
  demo_c: "/shared/exam/demo-c-question-bank.json"
};
const DEFAULT_BANK_PATH = DEFAULT_COURSE_BANK_PATHS.demo_a;
const STORAGE_KEYS = {
  bank: "ai_exam_question_bank_v1",
  courseBanks: "ai_exam_course_banks_v1",
  courses: "ai_exam_courses_v1",
  courseDocs: "ai_exam_course_docs_v1",
  activeCourseId: "ai_exam_active_course_v1",
  records: "ai_exam_records_v1",
  wrongPool: "ai_exam_wrong_pool_v1",
  shallowRecords: "ai_exam_shallow_records_v1",
  mastery: "ai_exam_mastery_v1",
  behaviorEvents: "ai_exam_behavior_events_v1",
  attentionLogs: "ai_exam_attention_logs_v1",
  guidedRounds: "ai_exam_guided_rounds_v1",
  guidedProgress: "ai_exam_guided_progress_v1",
  syncKey: "ai_exam_sync_key_v1",
  lastCloudSyncAt: "ai_exam_last_cloud_sync_at_v1",
  localUpdatedAt: "ai_exam_local_updated_at_v1"
};

const CLOUD_SYNC_ENDPOINT = "/.netlify/functions/sync";
const AUTO_SYNC_DEBOUNCE_MS = 1600;
const GUIDED_BATCH_SIZE = 3;
const GUIDED_ANSWER_MIN_VIEW_MS = 3000;
const SYNC_STORAGE_FIELDS = [
  ["courses", STORAGE_KEYS.courses],
  ["activeCourseId", STORAGE_KEYS.activeCourseId],
  ["records", STORAGE_KEYS.records],
  ["wrongPool", STORAGE_KEYS.wrongPool],
  ["shallowRecords", STORAGE_KEYS.shallowRecords],
  ["mastery", STORAGE_KEYS.mastery],
  ["behaviorEvents", STORAGE_KEYS.behaviorEvents],
  ["attentionLogs", STORAGE_KEYS.attentionLogs],
  ["guidedRounds", STORAGE_KEYS.guidedRounds],
  ["guidedProgress", STORAGE_KEYS.guidedProgress]
];

const DEFAULT_EXAM_CONFIG = {
  examName: "示例模拟考试",
  durationMinutes: 60,
  targetQuestionCount: 20,
  singleChoiceCount: 10,
  multipleChoiceCount: 5,
  judgeCount: 5,
  passingScore: 60,
  randomOrder: true,
  showAnswerDuringExam: false
};

const SPRINT_CONFIG = {
  ...DEFAULT_EXAM_CONFIG,
  examName: "示例考前冲刺",
  durationMinutes: 20,
  singleChoiceCount: 0,
  multipleChoiceCount: 0,
  judgeCount: 0,
  passingScore: 60
};

const TYPE_LABELS = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
  fill: "填空",
  short: "简答"
};

const WRONG_REASONS = [
  "没学过",
  "概念混淆",
  "记错人物/年份",
  "多选漏选",
  "审题失误",
  "手滑误点",
  "会但反应慢",
  "下一秒忘"
];

const HIGH_RISK_CHAPTERS = ["第四章", "第六章", "第八章"];
const MASTERY_STATUSES = ["未学", "秒忘", "浅层熟悉", "概念混淆", "假掌握", "基本掌握", "稳定掌握"];
const RECALL_TAGS = ["#会了", "#半会", "#不会", "#上机", "#概念混淆", "#下一秒忘"];
const RECALL_REVIEW_DAYS = {
  "#会了": 7,
  "#半会": 3,
  "#上机": 3,
  "#不会": 1,
  "#概念混淆": 1,
  "#下一秒忘": 1
};
const ATTENTION_LOG_FIELDS = [
  ["distracted", "今天是否分心"],
  ["startDifficult", "是否启动困难"],
  ["taskSwitching", "是否任务跳转"],
  ["forgetful", "是否忘事"],
  ["childhood", "小时候是否也这样"]
];
const DEFAULT_ACTIVE_COURSE_ID = "demo_a";

const EXAM_VENUE = {
  name: "示例考点",
  address: "示例市示例路 1 号",
  building: "教学楼 A",
  admissionTicket: "00000000000000"
};

const DEFAULT_COURSES = [
  {
    id: "demo_a",
    name: "示例科目 A",
    examType: "闭卷",
    examDate: "2026-09-01",
    examTime: "10:00",
    location: "机房 A",
    priority: "P1",
    status: "刷题中",
    difficulty: 3
  },
  {
    id: "demo_b",
    name: "示例科目 B",
    examType: "闭卷",
    examDate: "2026-09-02",
    examTime: "14:00",
    location: "机房 B",
    priority: "P1",
    status: "补基础",
    difficulty: 4
  },
  {
    id: "demo_c",
    name: "示例科目 C",
    examType: "闭卷",
    examDate: "2026-09-03",
    examTime: "09:00",
    location: "教室 C",
    priority: "P2",
    status: "未开始",
    difficulty: 3
  }
];

const CONFUSION_GROUPS = [
  {
    id: "demo_structures",
    name: "数据结构易混组",
    items: [
      { label: "栈", keyAnswer: "后进先出", memoryHook: "栈 = LIFO" },
      { label: "队列", keyAnswer: "先进先出", memoryHook: "队列 = FIFO" }
    ]
  },
  {
    id: "demo_logic",
    name: "逻辑运算易混组",
    items: [
      { label: "逻辑与", keyAnswer: "∧", memoryHook: "与 = 都要真" },
      { label: "逻辑或", keyAnswer: "∨", memoryHook: "或 = 有一个真" }
    ]
  }
];

const app = document.getElementById("app");
const state = {
  bank: null,
  questions: [],
  courses: [],
  courseBanks: {},
  courseDocs: [],
  activeCourseId: DEFAULT_ACTIVE_COURSE_ID,
  records: [],
  wrongPool: {},
  shallowRecords: [],
  mastery: {},
  behaviorEvents: [],
  attentionLogs: [],
  guidedRounds: [],
  syncKey: "",
  syncStatus: "",
  syncBusy: false,
  syncTimerId: null,
  syncPending: false,
  syncConflict: null,
  isApplyingSync: false,
  exam: null,
  practice: null,
  repair: null,
  study: null,
  guided: null,
  instantDrill: null,
  timerId: null,
  dashboardTimerId: null,
  message: "",
  confirmClear: false
};

init().catch((error) => {
  console.error(error);
  app.innerHTML = `
    <section class="panel">
      <h1>题库加载失败</h1>
      <p>${escapeHtml(error.message)}</p>
    </section>
  `;
});
registerServiceWorker();

async function init() {
  state.courses = loadCourses();
  state.courseBanks = loadCourseBanks();
  state.courseDocs = loadCourseDocs();
  state.activeCourseId = loadActiveCourseId();
  state.records = loadRecords();
  state.wrongPool = loadWrongPool();
  state.shallowRecords = loadShallowRecords();
  state.mastery = loadMastery();
  state.behaviorEvents = loadBehaviorEvents();
  state.attentionLogs = loadAttentionLogs();
  state.guidedRounds = loadGuidedRounds();
  state.syncKey = loadSyncKey();
  const defaultBanks = await loadDefaultCourseBanks();
  let banksChanged = false;
  Object.entries(defaultBanks).forEach(([courseId, bank]) => {
    if (shouldUseBundledBank(courseId, state.courseBanks[courseId], bank)) {
      state.courseBanks[courseId] = bank;
      banksChanged = true;
    }
  });
  if (banksChanged) {
    saveCourseBanks(state.courseBanks);
  }
  syncActiveCourseBank();
  bindKeyboard();
  window.addEventListener("beforeunload", () => {
    persistGuidedSession();
    flushCloudSyncOnExit();
  });
  window.addEventListener("pagehide", () => {
    persistGuidedSession();
    flushCloudSyncOnExit();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persistGuidedSession();
      flushCloudSyncOnExit();
      return;
    }
    if (document.visibilityState === "visible" && state.syncKey) {
      queueAutoCloudSync("visible", { immediate: true });
    }
  });
  renderDashboard();
  if (state.syncKey && isCloudSyncSupported()) {
    await runAutoCloudSync("startup", { immediate: true });
  }
}

async function loadQuestionBank(path = DEFAULT_BANK_PATH, courseId = "") {
  const bundledBank = getBundledQuestionBank(courseId);
  if (bundledBank) {
    return normalizeBank(bundledBank);
  }
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`默认题库读取失败：HTTP ${response.status}`);
  }
  return normalizeBank(await response.json());
}

async function loadDefaultCourseBanks() {
  const entries = await Promise.all(
    Object.entries(DEFAULT_COURSE_BANK_PATHS).map(async ([courseId, path]) => [courseId, await loadQuestionBank(path, courseId)])
  );
  return Object.fromEntries(entries);
}

function getBundledQuestionBank(courseId) {
  const bank = window.__EXAM_COURSE_BANKS__?.[courseId];
  return bank ? JSON.parse(JSON.stringify(bank)) : null;
}

function shouldUseBundledBank(courseId, currentBank, bundledBank) {
  if (!currentBank?.questions?.length) {
    return true;
  }
  const currentSource = currentBank.meta?.source || "";
  const bundledSource = bundledBank.meta?.source || "";
  return courseId === DEFAULT_ACTIVE_COURSE_ID && currentSource.includes("sample-notice.pdf") && bundledSource.includes("修正定稿");
}

function repairInlineOptionsFromStem(question) {
  const stem = String(question.question || "");
  const options = Array.isArray(question.options) ? question.options.map((option) => ({ ...option })) : [];
  const keys = new Set(options.map((option) => option.key));
  const trailingInline = stem.match(/([?？）)]\s*)?((?:[A-E][、．.:\s]+[^A-E?？（(\n]+?\s*)+)$/);
  if (!trailingInline) {
    return { question: stem, options };
  }

  const inlinePart = trailingInline[2];
  const extracted = [];
  for (const match of inlinePart.matchAll(/([A-E])[、．.:\s]+([^A-E?？（(\n]+?)(?=\s*[A-E][、．.:\s]|$)/g)) {
    const key = match[1];
    const text = match[2].trim();
    if (!text || keys.has(key)) {
      continue;
    }
    extracted.push({ key, text });
    keys.add(key);
  }

  if (!extracted.length) {
    return { question: stem, options };
  }

  const cleanedStem = stem.slice(0, stem.length - inlinePart.length).trim();
  const mergedOptions = [...extracted, ...options].sort((a, b) => a.key.localeCompare(b.key));
  return { question: cleanedStem, options: mergedOptions };
}

function normalizeJudgeAnswer(answer) {
  const normalized = answer.map((item) => String(item).trim());
  if (normalized.every((item) => ["A", "B", "true", "false", "T", "F", "√", "×"].includes(item))) {
    return normalized;
  }
  const mapped = normalized.map((item) => {
    if (["正确", "对", "是", "true", "T", "√"].includes(item)) {
      return "A";
    }
    if (["错误", "错", "否", "false", "F", "×"].includes(item)) {
      return "B";
    }
    return item;
  });
  return mapped;
}

function normalizeBank(rawBank) {
  const questions = Array.isArray(rawBank) ? rawBank : rawBank.questions || [];
  const normalizedQuestions = questions.map((question) => {
    const repaired = repairInlineOptionsFromStem(question);
    const answer = Array.isArray(question.answer) ? question.answer : [question.answer].filter(Boolean);
    let options = repaired.options;
    let normalizedAnswer = question.type === "judge" ? normalizeJudgeAnswer(answer) : answer;
    const stem = repaired.question;

    if (question.type === "judge" && options.length < 2) {
      options = [
        { key: "A", text: "正确" },
        { key: "B", text: "错误" }
      ];
    }

    const optionKeys = new Set(options.map((option) => option.key));
    const answerKeysValid =
      question.type === "judge" ? normalizedAnswer.every((item) => optionKeys.has(item)) : normalizedAnswer.every((item) => optionKeys.has(item));
    const brokenPlaceholder =
      /文本抽取不完整|请回看 PDF/.test(stem) ||
      normalizedAnswer.some((item) => /^见原 PDF$/.test(String(item)) || /^、\s*、/.test(String(item)));
    const validForExam =
      question.validForExam !== false &&
      stem &&
      normalizedAnswer.length > 0 &&
      !brokenPlaceholder &&
      answerKeysValid &&
      (question.type === "judge" || options.length >= 2) &&
      options.every((option) => option.key && option.text);
    const validForStudy =
      question.validForStudy !== false && Boolean(stem) && normalizedAnswer.length > 0 && !brokenPlaceholder;

    return {
      ...question,
      question: stem,
      answer: normalizedAnswer,
      options,
      validForExam,
      validForStudy
    };
  });

  return {
    meta: rawBank.meta || {
      examName: DEFAULT_EXAM_CONFIG.examName,
      totalQuestions: normalizedQuestions.length
    },
    questions: normalizedQuestions
  };
}

function loadCourses() {
  const savedCourses = readJson(STORAGE_KEYS.courses, null);
  if (!Array.isArray(savedCourses) || !savedCourses.length) {
    return DEFAULT_COURSES.map((course) => ({ ...course }));
  }

  const defaults = new Map(DEFAULT_COURSES.map((course) => [course.id, course]));
  const merged = savedCourses.map((course) => {
    const defaultCourse = defaults.get(course.id) || {};
    if (course.id === "demo_extra" && course.name === "示例扩展科目") {
      return { ...course, ...defaultCourse };
    }
    return { ...defaultCourse, ...course };
  });
  DEFAULT_COURSES.forEach((course) => {
    if (!merged.some((item) => item.id === course.id)) {
      merged.push({ ...course });
    }
  });
  return merged;
}

function saveCourses(courses) {
  localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(courses));
  markLocalChanged();
}

function loadCourseBanks() {
  const rawBanks = readJson(STORAGE_KEYS.courseBanks, {});
  return Object.entries(rawBanks || {}).reduce((banks, [courseId, bank]) => {
    try {
      banks[courseId] = normalizeBank(bank);
    } catch {
      banks[courseId] = createEmptyBank(getCourseById(courseId));
    }
    return banks;
  }, {});
}

function saveCourseBanks(banks) {
  localStorage.setItem(STORAGE_KEYS.courseBanks, JSON.stringify(banks));
}

function loadCourseDocs() {
  const docs = readJson(STORAGE_KEYS.courseDocs, []);
  return Array.isArray(docs) ? docs : [];
}

function saveCourseDocs(docs) {
  localStorage.setItem(STORAGE_KEYS.courseDocs, JSON.stringify(docs));
}

function loadActiveCourseId() {
  const savedCourseId = localStorage.getItem(STORAGE_KEYS.activeCourseId);
  if (savedCourseId && state.courses.some((course) => course.id === savedCourseId)) {
    return savedCourseId;
  }
  return state.courses.some((course) => course.id === DEFAULT_ACTIVE_COURSE_ID)
    ? DEFAULT_ACTIVE_COURSE_ID
    : state.courses[0]?.id || DEFAULT_ACTIVE_COURSE_ID;
}

function saveActiveCourseId(courseId) {
  localStorage.setItem(STORAGE_KEYS.activeCourseId, courseId);
  markLocalChanged();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

function getCourseById(courseId) {
  return state.courses.find((course) => course.id === courseId) || DEFAULT_COURSES.find((course) => course.id === courseId) || DEFAULT_COURSES[0];
}

function getActiveCourse() {
  return getCourseById(state.activeCourseId);
}

function syncActiveCourseBank() {
  const course = getActiveCourse();
  const bank = state.courseBanks[course.id] || createEmptyBank(course);
  state.bank = normalizeBank(bank);
  state.questions = state.bank.questions;
}

function createEmptyBank(course = DEFAULT_COURSES[0]) {
  return {
    meta: {
      examName: `${course.name}模拟考试`,
      totalQuestions: 0
    },
    questions: []
  };
}

function switchCourse(courseId) {
  if (!state.courses.some((course) => course.id === courseId)) {
    return;
  }
  state.activeCourseId = courseId;
  saveActiveCourseId(courseId);
  syncActiveCourseBank();
  state.confirmClear = false;
  state.message = `已切换到：${getActiveCourse().name}`;
  renderDashboard();
}

function getCourseRecords(courseId) {
  return state.records.filter((record) => (record.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId);
}

function getCourseDocs(courseId) {
  return state.courseDocs.filter((doc) => doc.courseId === courseId);
}

function getCourseWrongQuestionIds(courseId) {
  return unique(Object.values(state.wrongPool)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId)
    .map((item) => item.questionId));
}

function getQuestionStorageKey(courseId, questionId, store = {}) {
  const scopedKey = `${courseId}::${questionId}`;
  if (store[scopedKey]) {
    return scopedKey;
  }
  if (courseId === DEFAULT_ACTIVE_COURSE_ID && store[questionId]) {
    return questionId;
  }
  return scopedKey;
}

function getCourseProgress(course) {
  const bank = state.courseBanks[course.id] || (course.id === state.activeCourseId ? state.bank : createEmptyBank(course));
  const records = getCourseRecords(course.id);
  const questionIds = unique(records.flatMap((record) => record.questionResults.map((item) => item.questionId)));
  const totalAnswered = records.reduce((sum, record) => sum + record.totalQuestions, 0);
  const totalCorrect = records.reduce((sum, record) => sum + record.correctCount, 0);
  const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const scores = records.map((record) => record.score);
  const lastMockScore = records.at(-1)?.score;
  const bestMockScore = scores.length ? Math.max(...scores) : undefined;
  const readinessScore = calculateReadinessScore(course, bank, accuracy, questionIds.length, getCourseWrongQuestionIds(course.id).length, lastMockScore);

  return {
    courseId: course.id,
    totalQuestions: bank.questions?.length || 0,
    practicedQuestions: questionIds.length,
    wrongQuestions: getCourseWrongQuestionIds(course.id).length,
    unlearnedQuestions: buildUnlearnedQuestionIds(course.id).length,
    forgetFragileQuestions: buildForgetRepairQuestionIds(course.id).length,
    accuracy,
    weakChapters: aggregateChapterAccuracy(records).slice(0, 3).map((item) => item.chapter),
    lastMockScore,
    bestMockScore,
    readinessScore
  };
}

function buildCourseBarrierProfile(course) {
  const buildBarrierProfile = window.LearningBarriers?.buildBarrierProfile;
  if (typeof buildBarrierProfile !== "function") {
    return {
      courseId: course.id,
      items: [],
      primary: {
        code: "insufficient_data",
        label: "样本不足",
        confidence: "样本不足",
        evidence: "学习壁垒模块未加载，请刷新页面。",
        action: "刷新页面后先做 3 道题。",
        basis: "检索练习",
        basisUrl: "https://doi.org/10.1126/science.1152408",
        recommendedMode: "答案先行记题"
      },
      secondary: []
    };
  }

  const records = getCourseRecords(course.id);
  const questionResults = records.flatMap((record) =>
    (record.questionResults || []).map((result) => ({
      ...result,
      createdAt: result.createdAt || record.submittedAt || record.startedAt,
      mode: record.mode
    }))
  );
  const practicedQuestions = new Set(questionResults.map((result) => result.questionId).filter(Boolean)).size;
  const totalQuestions = (getCourseBank(course.id).questions || []).filter((question) => question.validForExam !== false).length;
  const masteryItems = Object.values(state.mastery).filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === course.id);
  const wrongPoolItems = Object.values(state.wrongPool).filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === course.id);

  return buildBarrierProfile({
    courseId: course.id,
    now: new Date(),
    totalQuestions,
    practicedQuestions,
    events: getCourseBehaviorEvents(course.id),
    questionResults,
    masteryItems,
    wrongPoolItems
  });
}

function buildCourseDailyResearch(course, barrierProfile) {
  const buildDailyResearch = window.LearningBarriers?.buildDailyResearch;
  if (typeof buildDailyResearch !== "function") {
    return {
      noData: true,
      summary: "今天没有新的学习数据，无法更新判断。",
      hypothesis: "先完成一次真实学习动作，再看证据。",
      experiment: "做 3 道当前课程题并如实标记不会、眼熟或会选但说不出。",
      falsifier: "没有新数据时，不对学习状态下结论。"
    };
  }

  const today = getLocalDateKey();
  const records = getCourseRecords(course.id);
  const todayResults = records.flatMap((record) =>
    (record.questionResults || [])
      .filter((result) => getLocalDateKey(new Date(result.createdAt || record.submittedAt || record.startedAt)) === today)
      .map((result) => ({
        ...result,
        createdAt: result.createdAt || record.submittedAt || record.startedAt,
        mode: record.mode
      }))
  );
  const todayEvents = getCourseBehaviorEvents(course.id).filter((event) => isEventOnLocalDate(event, today));

  return buildDailyResearch({
    profile: barrierProfile,
    now: new Date(),
    todayEvents,
    todayResults
  });
}

function buildCourseLearningStatus(course) {
  const bank = state.courseBanks[course.id] || (course.id === state.activeCourseId ? state.bank : createEmptyBank(course));
  const records = getCourseRecords(course.id);
  const practicedQuestions = unique(records.flatMap((record) => (record.questionResults || []).map((item) => item.questionId))).length;
  const masteryCounts = Object.values(state.mastery)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === course.id)
    .reduce((counts, item) => {
      const status = item.status || "未学";
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
  const totalQuestions = (bank.questions || []).filter((question) => question.validForExam !== false).length;

  return window.LearningEstimates.buildLearningStatus({
    course,
    events: state.behaviorEvents,
    records,
    totalQuestions,
    practicedQuestions,
    masteryCounts,
    highRiskCount: getCourseWrongQuestionIds(course.id).length
  });
}

function calculateReadinessScore(course, bank, accuracy, practicedCount, wrongCount, lastScore) {
  if (!bank.questions?.length && !lastScore) {
    return 0;
  }
  const practiceRatio = bank.questions?.length ? Math.min(1, practicedCount / bank.questions.length) : 0;
  const scoreBase = lastScore ?? accuracy;
  const riskPenalty = Math.min(25, wrongCount * 3) + (course.isRetake ? 6 : 0);
  return clamp(Math.round(scoreBase * 0.55 + practiceRatio * 25 + accuracy * 0.2 - riskPenalty), 0, 100);
}

function buildPriorityPlan() {
  return state.courses
    .map((course) => {
      const progress = getCourseProgress(course);
      const days = daysUntilExam(course);
      const closeness = course.examDate ? clamp((14 - Math.max(days, 0)) / 14, 0, 1) : 0.2;
      const accuracyRisk = progress.accuracy ? clamp((80 - progress.accuracy) / 80, 0.15, 1) : 0.85;
      const difficultyRisk = clamp((course.difficulty || 3) / 5, 0, 1);
      const retakeRisk = course.isRetake || course.name.includes("补") ? 1 : course.priority === "P0" ? 0.45 : 0;
      const score = Math.round(closeness * 40 + accuracyRisk * 30 + difficultyRisk * 20 + retakeRisk * 10);
      return {
        course,
        progress,
        score,
        reason: buildPriorityReason(course, progress, days)
      };
    })
    .sort((a, b) => b.score - a.score || priorityRank(a.course.priority) - priorityRank(b.course.priority));
}

function buildPriorityReason(course, progress, days) {
  const parts = [];
  if (course.isRetake || course.name.includes("补")) parts.push("补考");
  if (course.examDate) parts.push(days <= 0 ? "今天考试" : `${days}天后`);
  else parts.push("时间待补");
  if (progress.unlearnedQuestions) parts.push(`${progress.unlearnedQuestions}题未学`);
  if (progress.forgetFragileQuestions) parts.push(`${progress.forgetFragileQuestions}题秒忘`);
  if (!progress.accuracy) parts.push("未模拟");
  else if (progress.accuracy < 60) parts.push(`正确率${progress.accuracy}%`);
  else parts.push(`安全度${progress.readinessScore}`);
  return parts.join(" / ");
}

function priorityRank(priority) {
  return { P0: 0, P1: 1, P2: 2 }[priority] ?? 3;
}

function daysUntilExam(course) {
  if (!course.examDate) {
    return 99;
  }
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(`${course.examDate}T00:00:00`).getTime();
  return Math.ceil((target - start) / 86400000);
}

function renderCourseCard(course) {
  const progress = getCourseProgress(course);
  const status = buildCourseLearningStatus(course);
  const isActive = course.id === state.activeCourseId;
  const dateLabel = course.examDate ? `${course.examDate.slice(5).replace("-", "/")} ${course.examTime || ""}` : "时间待补";
  const seatLabel = course.examSeat ? `${course.location} · ${course.examSeat}号座` : (course.location || course.examType);
  return `
    <button class="course-card ${isActive ? "active" : ""}" data-course-id="${escapeHtml(course.id)}">
      <span class="course-priority ${escapeHtml(course.priority)}">${escapeHtml(course.priority)}</span>
      <strong>${escapeHtml(course.name)}</strong>
      <span>${escapeHtml(dateLabel)}｜${escapeHtml(seatLabel)}</span>
      <span class="course-countdown" data-exam-countdown-course="${escapeHtml(course.id)}">${escapeHtml(status.countdown.label)}</span>
      <small class="course-study-status">${status.reviewedToday ? "今日已复习" : "今日未复习"}｜${escapeHtml(renderCoursePassEstimate(status.passEstimate))}</small>
      <small>${progress.totalQuestions}题｜正确率 ${progress.accuracy || "-"}%｜安全度 ${progress.readinessScore}</small>
    </button>
  `;
}

function renderCourseDocs(courseId) {
  const docs = getCourseDocs(courseId);
  if (!docs.length) {
    return "<li><span>暂无资料，先把通知单、题库或复习文档放进来。</span></li>";
  }
  return docs
    .slice(-6)
    .reverse()
    .map(
      (doc) => `
        <li>
          <div>
            <strong>${escapeHtml(doc.name)}</strong>
            <span>${escapeHtml(doc.kind)}｜${formatBytes(doc.size)}｜${escapeHtml(formatLocalDate(doc.uploadedAt))}</span>
          </div>
        </li>
      `
    )
    .join("");
}

function renderDashboard() {
  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.study = null;
  state.guided = null;
  state.instantDrill = null;

  const stats = buildDashboardStats();
  const activeCourse = getActiveCourse();
  const learningStatus = buildCourseLearningStatus(activeCourse);
  const barrierProfile = buildCourseBarrierProfile(activeCourse);
  const dailyResearch = buildCourseDailyResearch(activeCourse, barrierProfile);
  const cramFlow = getCramFlowForToday();
  const todayPlan = buildTodayActionPlan(activeCourse, stats, barrierProfile, learningStatus, cramFlow);
  const priorityPlan = buildPriorityPlan();
  const behaviorModel = buildBehaviorModel(activeCourse.id);
  const attentionLog = getTodayAttentionLog();
  const needsFoundation = shouldStartWithFoundation(stats) && !cramFlow;
  const examEligibleCount = getEligibleQuestions().length;
  const instantDrillCount = buildInstantDrillEligibleQuestions().length;
  const guidedPracticeReady = canStartGuidedPractice(activeCourse.id);
  const standardMockCount = Math.min(DEFAULT_EXAM_CONFIG.targetQuestionCount, examEligibleCount);
  const weakChapters = stats.weakChapters.length
    ? stats.weakChapters
        .map(
          (item) => `
            <li>
              <span>${escapeHtml(item.chapter)}</span>
              <strong>${item.accuracy}%</strong>
            </li>
          `
        )
        .join("")
    : "<li><span>暂无考试记录</span><strong>-</strong></li>";

  const deferMock = shouldDeferMockAfterGuided(activeCourse.id);
  const resumableGuided = getResumableGuidedSession(activeCourse.id, null, "batch");

  app.className = "app-shell dashboard-view";
  app.innerHTML = `
    <section class="topbar">
      <div>
        <p class="eyebrow">多科上机考试训练</p>
        <h1>${escapeHtml(activeCourse.name)}</h1>
      </div>
      <div class="topbar-actions ${resumableGuided ? "guided-continue-actions" : ""}">
        ${
          resumableGuided
            ? `
              <button id="resumeTodayGuided" class="primary today-continue">${escapeHtml(formatGuidedResumeLabel(resumableGuided))}</button>
              <button id="freshTodayGuided" class="secondary">新开始</button>
            `
            : `<button id="startTodayContinue" class="primary today-continue" ${todayPlan.disabled ? "disabled" : ""}>${escapeHtml(todayPlan.buttonLabel)}</button>`
        }
      </div>
    </section>

    ${state.message ? `<div class="notice">${escapeHtml(state.message)}</div>` : ""}
    ${needsFoundation ? renderFoundationNotice(activeCourse, stats) : ""}

    <section class="course-strip">
      ${state.courses.map((course) => renderCourseCard(course)).join("")}
    </section>

    <section class="main-grid dashboard-primary">
      ${renderLearningStatusPanel(activeCourse, learningStatus)}
      ${renderTodayMissionCard(todayPlan)}
      ${renderLearningBarrierPanel(barrierProfile, dailyResearch, todayPlan)}
    </section>

    ${renderCloudSyncPanel()}

    <details class="more-training">
      <summary>我非要换方式</summary>
      <div class="more-training-body">
        <section class="dashboard-grid">
          ${metricCard("最近一次模拟考试分数", stats.lastScore)}
          ${metricCard("低能量可做", stats.microTaskCount)}
          ${metricCard("最高分", stats.highScore)}
          ${metricCard("平均分", stats.averageScore)}
          ${metricCard("本课程模拟次数", stats.examCount)}
          ${metricCard("距离及格还差", stats.scoreGap)}
          ${metricCard("高危错题数量", stats.highRiskCount)}
          ${metricCard("今日到期复述", stats.recallDueCount)}
          ${metricCard("未学待补", stats.unlearnedCount)}
          ${metricCard("秒忘待加固", stats.forgetFragileCount)}
          ${metricCard("浅层熟悉题", stats.shallowCount)}
          ${metricCard("多选题正确率", `${stats.multipleAccuracy}%`)}
          ${metricCard("判断题正确率", `${stats.judgeAccuracy}%`)}
        </section>

        <div class="panel more-training-actions">
          <div class="section-title">
            <h2>手动选练法</h2>
            <span>默认请用顶部「今日继续」</span>
          </div>
          <div class="topbar-actions">
            <button id="startGuidedPractice" ${guidedPracticeReady ? "" : "disabled"}>答案先行（全题库·进阶）</button>
            <button id="startInstantDrill" ${instantDrillCount ? "" : "disabled"}>即时刷题（先选再看）</button>
            <button id="startFoundation" ${stats.memorizeCount ? "" : "disabled"}>题眼背题</button>
            <button id="startOneQuestion" ${stats.microTaskCount ? "" : "disabled"}>1题启动</button>
            <button id="startMicroReview" ${stats.microTaskCount ? "" : "disabled"}>12分钟小复习</button>
            <button id="startExam" ${examEligibleCount && !deferMock ? "" : "disabled"} title="${deferMock ? "铺底阶段请先多做几组答案先行" : ""}">随机模拟（${standardMockCount}题）</button>
            <button id="startFullExam" ${examEligibleCount && !deferMock ? "" : "disabled"} title="${deferMock ? "铺底阶段请先多做几组答案先行" : ""}">全题随机模拟</button>
            <button id="startSprint">考前冲刺</button>
            <button id="startActiveRecall" ${stats.recallDueCount ? "" : "disabled"}>闭卷复述</button>
            <button id="startUnlearned" ${stats.unlearnedCount ? "" : "disabled"}>未学补基础</button>
            <button id="startForgetRepair" ${stats.forgetFragileCount ? "" : "disabled"}>秒忘加固</button>
            <button id="startWrongPractice" ${stats.highRiskCount ? "" : "disabled"}>错题重练</button>
            <button id="startRepair" ${stats.repairCandidateCount ? "" : "disabled"}>浅层修复训练</button>
            <button id="startDemoTopStudy">示例科目 A高频题眼</button>
            <button id="clearData" class="${state.confirmClear ? "danger" : ""}">${state.confirmClear ? "确认清空记录" : "清空记录"}</button>
          </div>
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>考试配置</h2>
            <span>${escapeHtml(activeCourse.examDate || "时间待补")} ${escapeHtml(activeCourse.examTime || "")}</span>
          </div>
          <dl class="config-list">
            <div><dt>准考证</dt><dd>${escapeHtml(EXAM_VENUE.admissionTicket)}</dd></div>
            <div><dt>考点</dt><dd>${escapeHtml(EXAM_VENUE.name)} · ${escapeHtml(EXAM_VENUE.address)} ${escapeHtml(EXAM_VENUE.building)}</dd></div>
            <div><dt>地点</dt><dd>${escapeHtml(activeCourse.location || "待补充")}${activeCourse.examSeat ? ` · ${activeCourse.examSeat}号座` : ""}${activeCourse.paperNo ? ` · 试卷 ${activeCourse.paperNo}` : ""}</dd></div>
            <div><dt>方式</dt><dd>${escapeHtml(activeCourse.examType)}</dd></div>
            <div><dt>随机标准卷</dt><dd>${standardMockCount} 题｜题型不足时自动补题</dd></div>
            <div><dt>全题随机模拟</dt><dd>${examEligibleCount} 题｜当前课程全部可考试题</dd></div>
            <div><dt>及格线</dt><dd>${DEFAULT_EXAM_CONFIG.passingScore} 分</dd></div>
            <div><dt>考试中答案</dt><dd>不显示</dd></div>
            <div><dt>快捷键</dt><dd>A/B/C/D 选项，←/→ 翻题，M 标记，X 我不会，Enter 下一题，Ctrl+Enter 交卷</dd></div>
          </dl>
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>最弱章节 Top 3</h2>
            <span>按历史正确率</span>
          </div>
          <ul class="rank-list">${weakChapters}</ul>
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>当前课程题库</h2>
            <span>${state.questions.length} 题</span>
          </div>
          <dl class="config-list">
            <div><dt>可抽单选</dt><dd>${stats.validCounts.single || 0} / ${stats.counts.single || 0}</dd></div>
            <div><dt>可抽多选</dt><dd>${stats.validCounts.multiple || 0} / ${stats.counts.multiple || 0}</dd></div>
            <div><dt>可抽判断</dt><dd>${stats.validCounts.judge || 0} / ${stats.counts.judge || 0}</dd></div>
          </dl>
          <label class="file-import">
            <input id="bankImport" type="file" accept=".json,application/json" />
            给当前课程导入题库 JSON
          </label>
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>文件入口</h2>
            <span>${getCourseDocs(activeCourse.id).length} 个资料</span>
          </div>
          <dl class="config-list">
            <div><dt>归档课程</dt><dd>${escapeHtml(activeCourse.name)}</dd></div>
            <div><dt>可放</dt><dd>通知单、PDF、Word、Markdown、文本、题库 JSON</dd></div>
          </dl>
          <label id="docDropZone" class="file-import file-drop">
            <input id="docImport" type="file" multiple accept=".json,.md,.txt,.pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,application/json,text/plain,text/markdown,application/pdf" />
            <span>选择或拖入课程资料</span>
            <small>支持 PDF、Word、Markdown、文本、图片、题库 JSON</small>
          </label>
          <ul class="doc-list">${renderCourseDocs(activeCourse.id)}</ul>
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>今日优先级</h2>
            <span>按考试风险</span>
          </div>
          <ol class="priority-list">
            ${priorityPlan.slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.course.name)}</strong><span>${item.score}｜${escapeHtml(item.reason)}</span></li>`).join("")}
          </ol>
        </div>

        ${renderBehaviorModelPanel(behaviorModel)}
        ${renderAttentionLogPanel(attentionLog)}
      </div>
    </details>
  `;

  app.querySelectorAll(".course-card").forEach((button) => {
    button.addEventListener("click", () => switchCourse(button.dataset.courseId));
  });
  if (resumableGuided) {
    document.getElementById("resumeTodayGuided").addEventListener("click", () => {
      startGuidedPractice(null, { resume: true });
    });
    document.getElementById("freshTodayGuided").addEventListener("click", () => {
      startGuidedPractice(null, { fresh: true });
    });
  } else {
    document.getElementById("startTodayContinue").addEventListener("click", () => startTodayContinue(todayPlan));
  }
  document.getElementById("startGuidedPractice")?.addEventListener("click", () => {
    if (window.confirm(`全题库模式题量很大，容易只浏览不记住。建议先用顶部「今日继续」每组 ${GUIDED_BATCH_SIZE} 题。仍要全库？`)) {
      startGuidedPractice(null, { fresh: true, full: true });
    }
  });
  document.getElementById("startInstantDrill")?.addEventListener("click", startInstantDrill);
  document.getElementById("startFoundation").addEventListener("click", () => startUnlearnedStudy(buildMemorizeQuestionIds(activeCourse.id), "题眼背题"));
  document.getElementById("startOneQuestion").addEventListener("click", () => startMicroReview(1));
  document.getElementById("startMicroReview").addEventListener("click", () => startMicroReview(3));
  document.getElementById("startExam").addEventListener("click", () => startExam("mock"));
  document.getElementById("startFullExam").addEventListener("click", () => startExam("full"));
  document.getElementById("startSprint").addEventListener("click", () => startExam("sprint"));
  document.getElementById("startActiveRecall").addEventListener("click", () => startActiveRecall());
  document.getElementById("startUnlearned").addEventListener("click", () => startUnlearnedStudy());
  document.getElementById("startForgetRepair").addEventListener("click", () => startForgetRepair());
  document.getElementById("startWrongPractice").addEventListener("click", () => {
    startPractice(getCourseWrongQuestionIds(activeCourse.id), "高危错题重练");
  });
  document.getElementById("startRepair").addEventListener("click", () => startRepairTraining());
  document.getElementById("startDemoTopStudy")?.addEventListener("click", startDemoTopStudy);
  bindCloudSyncPanel();
  bindGuidedMissPanel(activeCourse.id);
  document.getElementById("clearData").addEventListener("click", handleClearData);
  document.getElementById("bankImport").addEventListener("change", handleBankImport);
  document.getElementById("docImport").addEventListener("change", handleDocImport);
  bindAttentionLogPanel();
  bindDocDropZone();
  startDashboardCountdown();
  state.message = "";
}

function handleClearData() {
  if (!state.confirmClear) {
    state.confirmClear = true;
    state.message = "再点一次「确认清空记录」会删除本地考试记录和错题池。";
    renderDashboard();
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.records);
  localStorage.removeItem(STORAGE_KEYS.wrongPool);
  localStorage.removeItem(STORAGE_KEYS.shallowRecords);
  localStorage.removeItem(STORAGE_KEYS.mastery);
  localStorage.removeItem(STORAGE_KEYS.behaviorEvents);
  localStorage.removeItem(STORAGE_KEYS.attentionLogs);
  localStorage.removeItem(STORAGE_KEYS.guidedRounds);
  localStorage.removeItem(STORAGE_KEYS.guidedProgress);
  state.records = [];
  state.wrongPool = {};
  state.shallowRecords = [];
  state.mastery = {};
  state.behaviorEvents = [];
  state.attentionLogs = [];
  state.guidedRounds = [];
  state.guided = null;
  state.instantDrill = null;
  state.confirmClear = false;
  state.message = "本地考试记录和错题池已清空。";
  markLocalChanged();
  renderDashboard();
}

function bindCloudSyncPanel() {
  const saveButton = document.getElementById("saveSyncKey");
  const syncNowButton = document.getElementById("syncNow");
  if (!saveButton || !syncNowButton) {
    return;
  }
  saveButton.addEventListener("click", saveSyncKeyFromInput);
  syncNowButton.addEventListener("click", () => {
    if (state.syncConflict) {
      state.syncStatus = "存在冲突时「立即同步」不会自动选边。请点「采用本机」上传，或「采用云端」/「拉取云端」下载。";
      renderDashboard();
      return;
    }
    queueAutoCloudSync("manual", { immediate: true });
  });
  document.getElementById("pullCloudSync")?.addEventListener("click", downloadCloudSync);
  document.getElementById("useLocalSync")?.addEventListener("click", resolveSyncConflictWithLocal);
  document.getElementById("useCloudSync")?.addEventListener("click", resolveSyncConflictWithCloud);
}

function saveSyncKeyFromInput() {
  const key = readSyncKeyInput();
  if (!key) {
    return;
  }
  state.syncConflict = null;
  state.syncStatus = "自动同步已开启，正在检查云端进度...";
  renderDashboard();
  queueAutoCloudSync("sync-key-saved", { immediate: true });
}

async function uploadCloudSync() {
  const key = state.syncKey || readSyncKeyInput();
  if (!key) {
    return;
  }
  state.syncBusy = true;
  state.syncStatus = "正在上传本机进度...";
  refreshDashboardIfIdle();

  try {
    const syncedAt = await pushCloudSnapshot(key);
    state.syncStatus = `已自动同步：${formatLocalDate(syncedAt)}。`;
  } catch (error) {
    state.syncStatus = `上传失败：${getSyncErrorMessage(error)}`;
  } finally {
    state.syncBusy = false;
    refreshDashboardIfIdle();
  }
}

async function downloadCloudSync() {
  const key = state.syncKey || readSyncKeyInput();
  if (!key) {
    return;
  }
  if (hasLocalProgress() && !window.confirm("下载云端进度会覆盖本机进度。确定继续吗？")) {
    return;
  }
  state.syncConflict = null;
  state.syncBusy = true;
  state.syncStatus = "正在下载云端进度...";
  refreshDashboardIfIdle();

  try {
    const result = await requestCloudSync(`?key=${encodeURIComponent(key)}`);
    if (!result.exists) {
      state.syncStatus = "云端还没有这个同步码的数据，已等待本机自动上传。";
      return;
    }
    applyCloudSnapshot(result.snapshot, result.updatedAt);
    state.syncStatus = `已下载云端进度：${formatLocalDate(result.updatedAt || new Date().toISOString())}。${formatSyncProgressSummary()}`;
  } catch (error) {
    state.syncStatus = `下载失败：${getSyncErrorMessage(error)}`;
  } finally {
    state.syncBusy = false;
    refreshAfterSync();
  }
}

function queueAutoCloudSync(reason = "auto", options = {}) {
  if (!state.syncKey || state.syncConflict) {
    return;
  }
  if (!isCloudSyncSupported()) {
    if (options.force) {
      state.syncStatus = "自动同步只在 Netlify 公网版本可用。";
      refreshDashboardIfIdle();
    }
    return;
  }
  if (state.syncBusy) {
    state.syncPending = true;
    return;
  }
  clearTimeout(state.syncTimerId);
  state.syncTimerId = window.setTimeout(() => {
    runAutoCloudSync(reason, options);
  }, options.immediate ? 0 : AUTO_SYNC_DEBOUNCE_MS);
}

function buildSyncFingerprint(storage = {}) {
  return SYNC_STORAGE_FIELDS.map(([name]) => {
    const value = storage[name];
    return typeof value === "string" ? `${name}:${value}` : `${name}:`;
  }).join("\n");
}

function buildLocalSyncFingerprint() {
  return buildSyncFingerprint(
    Object.fromEntries(SYNC_STORAGE_FIELDS.map(([name, key]) => [name, localStorage.getItem(key)]))
  );
}

function buildRemoteSyncFingerprint(snapshot) {
  return buildSyncFingerprint(snapshot?.storage || {});
}

function formatSyncProgressSummary() {
  return formatSyncProgressSummaryFromStorage(
    Object.fromEntries(SYNC_STORAGE_FIELDS.map(([name, key]) => [name, localStorage.getItem(key)]))
  );
}

function parseSyncStorageJson(raw, fallback) {
  if (typeof raw !== "string" || !raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function formatSyncProgressSummaryFromStorage(storage = {}) {
  const behaviorEvents = parseSyncStorageJson(storage.behaviorEvents, []);
  const records = parseSyncStorageJson(storage.records, []);
  const wrongPool = parseSyncStorageJson(storage.wrongPool, {});
  const mastery = parseSyncStorageJson(storage.mastery, {});
  const guidedProgress = parseSyncStorageJson(storage.guidedProgress, {});
  return `行为 ${behaviorEvents.length} 条｜模拟 ${records.length} 次｜错题 ${Object.keys(wrongPool).length}｜掌握 ${Object.keys(mastery).length}｜答案先行进度 ${Object.keys(guidedProgress).length} 组`;
}

function syncProgressScore(storage = {}) {
  const behaviorEvents = parseSyncStorageJson(storage.behaviorEvents, []);
  const records = parseSyncStorageJson(storage.records, []);
  const wrongPool = parseSyncStorageJson(storage.wrongPool, {});
  const mastery = parseSyncStorageJson(storage.mastery, {});
  const guidedProgress = parseSyncStorageJson(storage.guidedProgress, {});
  return (
    behaviorEvents.length * 2 +
    records.length * 50 +
    Object.keys(wrongPool).length * 3 +
    Object.keys(mastery).length * 2 +
    Object.keys(guidedProgress).length * 100
  );
}

function buildSyncConflictHint(conflict) {
  if (!conflict?.localSummary || !conflict?.remoteSummary) {
    return "进度多、有答案先行断点的那一边通常更完整。";
  }
  const localScore = syncProgressScore(conflict.localSummary);
  const remoteScore = syncProgressScore(conflict.remoteSummary);
  if (remoteScore > localScore * 1.2) {
    return "建议本机点「采用云端」或「拉取云端」——云端进度更完整。";
  }
  if (localScore > remoteScore * 1.2) {
    return "建议本机点「采用本机」——本机进度更完整，会覆盖云端。";
  }
  return "两边差不多，选你刚练过、更信任的那一边。";
}

function renderSyncWorkflowGuide() {
  return `
    <details class="sync-guide" open>
      <summary>双端刷题怎么同步？</summary>
      <ol class="sync-guide-steps">
        <li><strong>在哪台练完</strong> → 回首页点「立即同步」（或等 2 秒自动上传），直到没有「待上传」。</li>
        <li><strong>换到另一台</strong> → 打开同一网址，点「拉取云端」，再点「今日继续」或「答案先行」。</li>
        <li><strong>出现冲突</strong> → 看上面数字：练得多的那台点「采用本机」，另一台点「采用云端」。</li>
      </ol>
      <p class="sync-guide-note">同步码两边必须完全一致（例如 <code>my-sync-key-abc123</code>，注意开头是 lx）。换设备前手动同步一次最稳妥。</p>
    </details>
  `;
}

function refreshAfterSync() {
  reloadLocalStateAfterSync();
  if (!state.exam && !state.practice && !state.repair && !state.study && !state.guided && !state.instantDrill) {
    renderDashboard();
    return;
  }
  refreshDashboardIfIdle();
}

async function runAutoCloudSync(reason = "auto", options = {}) {
  const key = state.syncKey;
  if (!key || state.syncBusy || state.syncConflict || !isCloudSyncSupported()) {
    return;
  }

  state.syncBusy = true;
  state.syncPending = false;
  state.syncStatus = reason === "startup" ? "正在自动检查云端进度..." : "正在自动同步...";
  refreshDashboardIfIdle();

  try {
    const remote = await requestCloudSync(`?key=${encodeURIComponent(key)}`);
    const localFingerprint = buildLocalSyncFingerprint();
    const remoteFingerprint = remote.exists ? buildRemoteSyncFingerprint(remote.snapshot) : "";
    const contentDiffers = remote.exists && remoteFingerprint !== localFingerprint;
    const localChanged = hasUnsyncedLocalChanges();

    if (remote.exists && contentDiffers) {
      if (localChanged) {
        const localStorageSnapshot = Object.fromEntries(
          SYNC_STORAGE_FIELDS.map(([name, key]) => [name, localStorage.getItem(key)])
        );
        state.syncConflict = {
          updatedAt: remote.updatedAt,
          snapshot: remote.snapshot,
          localSummary: localStorageSnapshot,
          remoteSummary: remote.snapshot?.storage || {}
        };
        state.syncStatus = `发现同步冲突：本机 ${formatSyncProgressSummary()}；云端（${formatLocalDate(remote.updatedAt)}）${formatSyncProgressSummaryFromStorage(remote.snapshot?.storage)}。${buildSyncConflictHint(state.syncConflict)}`;
        return;
      }
      applyCloudSnapshot(remote.snapshot, remote.updatedAt);
      state.syncStatus = `已从云端更新：${formatLocalDate(remote.updatedAt)}。${formatSyncProgressSummary()}`;
      return;
    }

    if (localChanged || !remote.exists) {
      const syncedAt = await pushCloudSnapshot(key);
      state.syncStatus = `已上传到云端：${formatLocalDate(syncedAt)}。${formatSyncProgressSummary()}`;
      return;
    }

    if (remote.exists) {
      if (hasUnsyncedLocalChanges()) {
        state.syncStatus = `云端已是最新（${formatLocalDate(remote.updatedAt)}），但本机还有未上传的练习进度，请点「立即同步」。${formatSyncProgressSummary()}`;
      } else {
        state.syncStatus = `云端与本机一致：${formatLocalDate(remote.updatedAt)}。${formatSyncProgressSummary()}`;
      }
    } else {
      state.syncStatus = "云端暂无进度；开始做题后会自动上传。";
    }
  } catch (error) {
    state.syncStatus = `自动同步失败：${getSyncErrorMessage(error)}`;
  } finally {
    state.syncBusy = false;
    refreshAfterSync();
    if (state.syncPending) {
      queueAutoCloudSync("pending", { immediate: true });
    }
  }
}

async function resolveSyncConflictWithLocal() {
  const key = state.syncKey || readSyncKeyInput();
  if (!key) {
    return;
  }
  state.syncConflict = null;
  state.syncBusy = true;
  state.syncStatus = "正在用本机进度覆盖云端...";
  refreshDashboardIfIdle();
  try {
    const syncedAt = await pushCloudSnapshot(key);
    state.syncStatus = `已采用本机进度：${formatLocalDate(syncedAt)}。${formatSyncProgressSummary()}`;
  } catch (error) {
    state.syncStatus = `同步失败：${getSyncErrorMessage(error)}`;
  } finally {
    state.syncBusy = false;
    refreshAfterSync();
  }
}

function resolveSyncConflictWithCloud() {
  if (!state.syncConflict) {
    return;
  }
  const conflict = state.syncConflict;
  state.syncConflict = null;
  try {
    applyCloudSnapshot(conflict.snapshot, conflict.updatedAt);
    state.syncStatus = `已采用云端进度：${formatLocalDate(conflict.updatedAt)}。${formatSyncProgressSummary()}`;
  } catch (error) {
    state.syncStatus = `应用云端失败：${getSyncErrorMessage(error)}`;
  }
  refreshAfterSync();
}

async function pushCloudSnapshot(key) {
  const snapshot = buildSyncSnapshot();
  const result = await requestCloudSync("", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, snapshot })
  });
  const syncedAt = result.updatedAt || new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.lastCloudSyncAt, syncedAt);
  const localUpdatedAt = localStorage.getItem(STORAGE_KEYS.localUpdatedAt);
  if (!localUpdatedAt || Date.parse(localUpdatedAt) <= Date.parse(snapshot.exportedAt)) {
    localStorage.setItem(STORAGE_KEYS.localUpdatedAt, syncedAt);
  }
  return syncedAt;
}

function applyCloudSnapshot(snapshot, updatedAt) {
  state.isApplyingSync = true;
  try {
    applySyncSnapshot(snapshot);
    const syncedAt = updatedAt || new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.lastCloudSyncAt, syncedAt);
    localStorage.setItem(STORAGE_KEYS.localUpdatedAt, syncedAt);
    reloadLocalStateAfterSync();
  } finally {
    state.isApplyingSync = false;
  }
}

function markLocalChanged() {
  if (state.isApplyingSync) {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.localUpdatedAt, new Date().toISOString());
  queueAutoCloudSync("local-change");
}

function hasUnsyncedLocalChanges() {
  const localUpdatedAt = Date.parse(localStorage.getItem(STORAGE_KEYS.localUpdatedAt) || "");
  const lastCloudSyncAt = Date.parse(localStorage.getItem(STORAGE_KEYS.lastCloudSyncAt) || "");
  return Number.isFinite(localUpdatedAt) && (!Number.isFinite(lastCloudSyncAt) || localUpdatedAt > lastCloudSyncAt + 500);
}

function hasRemoteChanged(updatedAt) {
  const remoteUpdatedAt = Date.parse(updatedAt || "");
  const lastCloudSyncAt = Date.parse(localStorage.getItem(STORAGE_KEYS.lastCloudSyncAt) || "");
  return Number.isFinite(remoteUpdatedAt) && (!Number.isFinite(lastCloudSyncAt) || remoteUpdatedAt > lastCloudSyncAt + 500);
}

function hasLocalSyncPayload() {
  return SYNC_STORAGE_FIELDS.some(([, key]) => localStorage.getItem(key) !== null);
}

function isCloudSyncSupported() {
  return location.protocol !== "file:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1";
}

function refreshDashboardIfIdle() {
  if (!state.exam && !state.practice && !state.repair && !state.study && app.classList.contains("dashboard-view")) {
    renderDashboard();
  }
}

function readSyncKeyInput() {
  const input = document.getElementById("syncKeyInput");
  const key = normalizeSyncKey(input?.value || state.syncKey);
  if (!key) {
    state.syncStatus = "同步码需要 6-64 位，只能用英文、数字、短横线或下划线。不要用姓名或手机号。";
    renderDashboard();
    return "";
  }
  state.syncKey = key;
  localStorage.setItem(STORAGE_KEYS.syncKey, key);
  return key;
}

function normalizeSyncKey(value) {
  const key = String(value || "").trim();
  return /^[A-Za-z0-9_-]{6,64}$/.test(key) ? key : "";
}

function defaultSyncFieldValue(name) {
  if (name === "activeCourseId") {
    return DEFAULT_ACTIVE_COURSE_ID;
  }
  if (name === "courses") {
    return JSON.stringify(DEFAULT_COURSES.map((course) => ({ ...course })));
  }
  if (["records", "shallowRecords", "behaviorEvents", "attentionLogs", "guidedRounds"].includes(name)) {
    return "[]";
  }
  return "{}";
}

function buildSyncSnapshot() {
  const storage = {};
  SYNC_STORAGE_FIELDS.forEach(([name, key]) => {
    const value = localStorage.getItem(key);
    storage[name] = value !== null ? value : defaultSyncFieldValue(name);
  });
  return {
    version: 1,
    app: "exam-trainer",
    exportedAt: new Date().toISOString(),
    storage
  };
}

function applySyncSnapshot(snapshot) {
  if (!snapshot || snapshot.app !== "exam-trainer" || !snapshot.storage || typeof snapshot.storage !== "object") {
    throw new Error("云端数据格式不对。");
  }
  SYNC_STORAGE_FIELDS.forEach(([name, key]) => {
    const value = snapshot.storage[name];
    if (typeof value === "string") {
      localStorage.setItem(key, value);
      return;
    }
    if (value === null) {
      return;
    }
    localStorage.removeItem(key);
  });
}

async function flushCloudSyncOnExit() {
  if (!state.syncKey || !isCloudSyncSupported() || state.syncConflict) {
    return;
  }
  if (!hasUnsyncedLocalChanges()) {
    return;
  }
  const body = JSON.stringify({
    key: state.syncKey,
    snapshot: buildSyncSnapshot()
  });
  try {
    await fetch(CLOUD_SYNC_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store"
    });
  } catch {
    // Best effort only — page may already be closing.
  }
}

function reloadLocalStateAfterSync() {
  state.courses = loadCourses();
  state.courseBanks = loadCourseBanks();
  state.courseDocs = loadCourseDocs();
  state.activeCourseId = loadActiveCourseId();
  state.records = loadRecords();
  state.wrongPool = loadWrongPool();
  state.shallowRecords = loadShallowRecords();
  state.mastery = loadMastery();
  state.behaviorEvents = loadBehaviorEvents();
  state.attentionLogs = loadAttentionLogs();
  state.guidedRounds = loadGuidedRounds();
  state.syncKey = loadSyncKey();
  syncActiveCourseBank();
}

async function requestCloudSync(query = "", options = {}) {
  const response = await fetch(`${CLOUD_SYNC_ENDPOINT}${query}`, {
    cache: "no-store",
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

function getSyncErrorMessage(error) {
  if (location.hostname === "localhost" || location.protocol === "file:") {
    return "本地预览没有云函数。请用手机/电脑打开 Netlify 公网网址（见 your-site.netlify.app）。";
  }
  return error.message || "网络异常";
}

function hasLocalProgress() {
  return Boolean(
    state.records.length ||
      Object.keys(state.wrongPool).length ||
      state.shallowRecords.length ||
      Object.keys(state.mastery).length ||
      state.behaviorEvents.length ||
      state.attentionLogs.length ||
      state.guidedRounds.length ||
      Object.keys(loadGuidedProgressStore()).length
  );
}

function metricCard(label, value) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function renderCoursePassEstimate(estimate) {
  if (!estimate.available) {
    return "预计通过：证据不足";
  }
  return `预计通过 ${estimate.low}%-${estimate.high}%`;
}

function renderLearningStatusPanel(course, learningStatus) {
  const progress = getCourseProgress(course);
  const estimate = learningStatus.passEstimate;
  const evidence = estimate.available
    ? `可信度${estimate.confidence}｜高危错题 ${progress.wrongQuestions} 题`
    : "先完成一套模拟考试，系统才会给出保守估计。";
  return `
    <div class="panel wide learning-status">
      <div class="section-title">
        <h2>${escapeHtml(course.name)}学习状态</h2>
        <span data-exam-countdown-course="${escapeHtml(course.id)}">${escapeHtml(learningStatus.countdown.label)}</span>
      </div>
      <div class="learning-status-grid">
        <div><span>今天</span><strong>${learningStatus.reviewedToday ? "已复习" : "未复习"}</strong></div>
        <div><span>近 7 天</span><strong>${learningStatus.studyDaysLast7}/7 天</strong></div>
        <div><span>题库覆盖</span><strong>${Math.round(learningStatus.coverage * 100)}%</strong></div>
        <div><span>预计通过</span><strong>${escapeHtml(renderCoursePassEstimate(estimate))}</strong><small>${escapeHtml(evidence)}</small></div>
      </div>
    </div>
  `;
}

function renderLearningBarrierPanel(barrierProfile, dailyResearch, todayPlan = {}) {
  const primary = barrierProfile.primary || {};
  const secondary = (barrierProfile.secondary || [])
    .map((item) => `${item.label}（${item.confidence}）`)
    .join("、");
  const entryGapNote = primary.code === "entry_gap"
    ? `<p class="sync-hint sync-warning">主断点「没印象」：别只滑答案。每组 ${GUIDED_BATCH_SIZE} 题必须「看→遮→测」闭环。</p>`
    : "";

  return `
    <section class="panel wide learning-barrier">
      <div class="section-title">
        <h2>你的学习断点</h2>
        <span>${escapeHtml(primary.confidence || "样本不足")}</span>
      </div>
      ${entryGapNote}
      <p class="barrier-arranged">已为你安排：<strong>${escapeHtml(todayPlan.modeLabel || "答案先行记题")}</strong> — ${escapeHtml(todayPlan.reason || primary.evidence || "")}</p>
      <div class="barrier-grid">
        <div>
          <span>当前主断点</span>
          <strong>${escapeHtml(primary.label || "样本不足")}</strong>
          <small>${escapeHtml(primary.evidence || "")}</small>
        </div>
        <div>
          <span>下一步</span>
          <strong>10 分钟</strong>
          <small>${escapeHtml(primary.action || todayPlan.reason || "")}</small>
        </div>
        <div>
          <span>学习依据</span>
          <a data-learning-basis href="${escapeHtml(primary.basisUrl || "#")}" target="_blank" rel="noreferrer">${escapeHtml(primary.basis || "检索练习")}</a>
        </div>
      </div>
      ${secondary ? `<p class="barrier-secondary">同时观察到：${escapeHtml(secondary)}</p>` : ""}
      <div class="daily-research">
        <h3>今日研究</h3>
        <p><strong>今天看到了什么：</strong>${escapeHtml(dailyResearch.summary || "")}</p>
        <p><strong>当前假设：</strong>${escapeHtml(dailyResearch.hypothesis || "")}</p>
        <p><strong>下一次验证什么：</strong>${escapeHtml(dailyResearch.experiment || "")}</p>
        <p><strong>什么结果会推翻它：</strong>${escapeHtml(dailyResearch.falsifier || "")}</p>
      </div>
    </section>
  `;
}

function isEventOnLocalDate(event, dateKey = getLocalDateKey()) {
  if (!event?.createdAt) {
    return false;
  }
  return getLocalDateKey(new Date(event.createdAt)) === dateKey;
}

function countTodayPracticeActions(courseId = state.activeCourseId) {
  const today = getLocalDateKey();
  const practiceTypes = new Set([
    "guided_learn_view",
    "guided_reveal",
    "guided_recall_correct",
    "guided_recall_wrong",
    "guided_quiz_correct",
    "guided_quiz_wrong",
    "guided_unknown",
    "practice_correct",
    "practice_wrong",
    "repair_correct",
    "repair_wrong",
    "study_remembered",
    "study_unlearned",
    "active_recall",
    "instant_drill_remembered",
    "instant_drill_forgot"
  ]);
  return getCourseBehaviorEvents(courseId).filter((event) => isEventOnLocalDate(event, today) && practiceTypes.has(event.type)).length;
}

function buildTodayRouterStats(courseId) {
  const bank = getCourseBank(courseId);
  const questionCount = (bank.questions || []).filter((question) => question.validForExam !== false).length;
  const records = getCourseRecords(courseId);
  const lastScore = records.length ? records[records.length - 1].score : "-";
  const learningStatus = buildCourseLearningStatus(getCourseById(courseId));
  return {
    questionCount,
    guidedPracticeReady: canStartGuidedPractice(courseId),
    memorizeCount: buildMemorizeQuestionIds(courseId).length,
    instantDrillCount: buildInstantDrillEligibleQuestions().length,
    examEligibleCount: (bank.questions || []).filter((question) => question.validForExam !== false).length,
    repairCandidateCount: buildRepairQuestionIds().length,
    forgetFragileCount: buildForgetRepairQuestionIds(courseId).length,
    recallDueCount: buildActiveRecallQuestionIds(courseId).length,
    highRiskCount: getCourseWrongQuestionIds(courseId).length,
    unlearnedCount: buildUnlearnedQuestionIds(courseId).length,
    examCount: records.length,
    lastScore,
    microTaskCount: buildMicroReviewQuestionIds(courseId).length,
    coverage: learningStatus.coverage || 0,
    todayProgress: countTodayPracticeActions(courseId)
  };
}

function buildTodayActionPlan(course, stats, barrierProfile, learningStatus, cramFlow) {
  const planCourseId = cramFlow?.focusCourseId || course.id;
  const planCourse = getCourseById(planCourseId) || course;
  const activeCourseId = planCourse.id;
  const routerStats = planCourseId !== course.id ? buildTodayRouterStats(planCourseId) : {
    questionCount: (getCourseBank(activeCourseId).questions || []).filter((question) => question.validForExam !== false).length,
    guidedPracticeReady: canStartGuidedPractice(activeCourseId),
    memorizeCount: buildMemorizeQuestionIds(activeCourseId).length,
    instantDrillCount: buildInstantDrillEligibleQuestions().length,
    examEligibleCount: getEligibleQuestions().length,
    repairCandidateCount: stats.repairCandidateCount,
    forgetFragileCount: buildForgetRepairQuestionIds(activeCourseId).length,
    recallDueCount: buildActiveRecallQuestionIds(activeCourseId).length,
    highRiskCount: getCourseWrongQuestionIds(activeCourseId).length,
    unlearnedCount: buildUnlearnedQuestionIds(activeCourseId).length,
    examCount: getCourseRecords(activeCourseId).length,
    lastScore: getCourseRecords(activeCourseId).slice(-1)[0]?.score ?? stats.lastScore,
    microTaskCount: buildMicroReviewQuestionIds(activeCourseId).length,
    coverage: buildCourseLearningStatus(planCourse).coverage || 0,
    todayProgress: countTodayPracticeActions(activeCourseId)
  };
  const todayProgress = routerStats.todayProgress;
  const resolve = window.TodayRouter?.resolveTodayPrimaryAction;
  const routerInput = {
    courseId: activeCourseId,
    courseName: planCourse.name,
    cramFlow,
    barrierProfile: planCourseId === course.id ? barrierProfile : buildCourseBarrierProfile(planCourse),
    showTop50: cramFlow?.showTop50 || activeCourseId === "demo_a",
    stats: routerStats
  };

  if (!resolve) {
    return {
      action: "guided",
      courseId: activeCourseId,
      courseName: course.name,
      modeLabel: "答案先行记题",
      buttonLabel: "今日继续 · 答案先行",
      reason: "系统正在加载，请刷新后重试。",
      progressLabel: buildProgressLabelFallback(todayProgress, cramFlow?.minQuestions || 0),
      disabled: false,
      steps: cramFlow?.steps || [],
      evening: cramFlow?.evening || "",
      badge: cramFlow?.badge || "自动安排",
      title: cramFlow?.title || "今日任务",
      examsToday: cramFlow?.examsToday || []
    };
  }

  const plan = resolve(routerInput);
  if (cramFlow) {
    plan.title = cramFlow.title;
  }
  return plan;
}

function buildProgressLabelFallback(todayProgress, minQuestions) {
  if (!minQuestions) {
    return todayProgress ? `本日已练 ${todayProgress} 题` : "今天还没开始";
  }
  return `本日 ${todayProgress}/${minQuestions} 题`;
}

function formatGuidedBrowseWarning(summary) {
  if (!summary?.viewed || summary.viewed < 3) {
    return "";
  }
  if (summary.recallAttempted >= Math.max(1, summary.viewed - 1)) {
    return "";
  }
  return "你在浏览答案，还没开始「遮住自己答」。每组必须点「遮住答案」才算记住。";
}

function renderABStudyGuide() {
  if (!getCramFlowForToday()) {
    return "";
  }
  return `
    <div class="memory-loop-guide ab-study-guide">
      <p class="memory-loop-title">A / B 分流（遮住前 5 秒判断）</p>
      <ul class="ab-study-list">
        <li><strong>B · 题眼不懂</strong> → 点「题眼背题」，答案开着看，不遮答</li>
        <li><strong>A · 题眼懂但想不起</strong> → 点「今日继续」，同一题可遮 2～3 遍</li>
      </ul>
    </div>
  `;
}

function renderExamVenueBanner(examsToday = []) {
  if (!examsToday.length) {
    return "";
  }
  return `<p class="sync-hint cram-venue">考点：${escapeHtml(EXAM_VENUE.address)} ${escapeHtml(EXAM_VENUE.building)}｜准考证 ${escapeHtml(EXAM_VENUE.admissionTicket)}｜必带身份证 + 考试通知单</p>`;
}

function formatExamRow(exam) {
  const seat = exam.seat ? ` · ${escapeHtml(exam.seat)}` : "";
  return `<li><strong>${escapeHtml(exam.time)}</strong><span>${escapeHtml(exam.name)} · ${escapeHtml(exam.room)}${seat}</span></li>`;
}

function renderPracticeExitButton(id = "practiceExitTop") {
  return `<button type="button" id="${id}" class="practice-exit-top">← 回首页</button>`;
}

function renderMemoryLoopGuide(courseId) {
  const summary = getTodayGuidedPracticeSummary(courseId);
  const warning = formatGuidedBrowseWarning(summary);
  return `
    <div class="memory-loop-guide">
      <p class="memory-loop-title">记住题的三步（每组 ${GUIDED_BATCH_SIZE} 题）</p>
      <ol class="memory-loop-steps">
        <li><strong>看</strong> 第 1 题答案 + 题眼</li>
        <li><strong>遮</strong> 自己回忆再选</li>
        <li><strong>测</strong> 立刻小测这题，再做下一题（每组 ${GUIDED_BATCH_SIZE} 题）</li>
      </ol>
      ${
        summary.viewed || summary.quizCorrect
          ? `<p class="today-mission-guided-stats">今日：遮住答对 ${summary.recallCorrect}｜只看不遮 ${Math.max(0, summary.viewed - summary.recallAttempted)}｜小测对 ${summary.quizCorrect}</p>`
          : ""
      }
      ${warning ? `<p class="sync-hint sync-warning">${escapeHtml(warning)}</p>` : ""}
    </div>
  `;
}

function renderTodayMissionCard(plan) {
  const courseId = plan.courseId || state.activeCourseId;
  const examRows = (plan.examsToday || []).map(formatExamRow).join("");
  const guidedSummary = formatGuidedPracticeSummary(getTodayGuidedPracticeSummary(courseId));
  const resumeSaved = getResumableGuidedSession(courseId, null, "batch");
  const resumeLabel = resumeSaved ? formatGuidedResumeLabel(resumeSaved) : "";

  return `
    <section class="panel wide today-mission">
      <div class="section-title">
        <h2>${escapeHtml(plan.title || "今日任务")}</h2>
        <span>${escapeHtml(plan.badge || "自动安排")}</span>
      </div>
      ${renderABStudyGuide()}
      ${renderMemoryLoopGuide(courseId)}
      <p class="today-mission-progress">${escapeHtml(plan.progressLabel || "")}</p>
      ${guidedSummary ? `<p class="today-mission-guided-stats">${escapeHtml(guidedSummary)}</p>` : ""}
      ${resumeLabel ? `<p class="today-mission-guided-stats">未完成进度：<strong>${escapeHtml(resumeLabel)}</strong>，点顶部「继续」或「新开始」。</p>` : ""}
      ${renderTodayGuidedMissList(plan.courseId || state.activeCourseId)}
      <p class="today-mission-reason">${escapeHtml(plan.reason || "")}</p>
      ${
        examRows
          ? `
            ${renderExamVenueBanner(plan.examsToday)}
            <ul class="cram-exam-list">
              ${examRows}
            </ul>
          `
          : ""
      }
      <ol class="flow-list">
        ${(plan.steps || []).map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></li>`).join("")}
      </ol>
      ${plan.evening ? `<p class="sync-hint cram-evening">${escapeHtml(plan.evening)}</p>` : ""}
      <p class="today-mission-hint">${resumeLabel ? "点顶部 <strong>继续</strong> 或 <strong>新开始</strong>。" : "点顶部 <strong>今日继续</strong> 即可，不用自己选练法。"}</p>
    </section>
  `;
}

function startTodayContinue(plan) {
  if (!plan) {
    return;
  }
  if (plan.disabled) {
    alert(plan.reason || "当前还没有可练题目。");
    return;
  }
  if (plan.courseId && plan.courseId !== state.activeCourseId) {
    state.activeCourseId = plan.courseId;
    saveActiveCourseId(plan.courseId);
    syncActiveCourseBank();
  }
  switch (plan.action) {
    case "guided":
      startGuidedPracticeWithChoice(null);
      return;
    case "foundation":
      startUnlearnedStudy(buildMemorizeQuestionIds(state.activeCourseId), "题眼背题");
      return;
    case "memorize-top50":
      startDemoTopStudy();
      return;
    case "instant-drill":
      startInstantDrill();
      return;
    case "wrong":
      startPractice(getCourseWrongQuestionIds(state.activeCourseId).slice(0, 10), "高危错题重练");
      return;
    case "repair":
      startRepairTraining();
      return;
    case "forget":
      startForgetRepair();
      return;
    case "recall":
      startActiveRecall();
      return;
    case "micro":
      startMicroReview(3);
      return;
    case "one":
      startMicroReview(1);
      return;
    case "sprint":
      startExam("sprint");
      return;
    case "mock":
      startExam("mock");
      return;
    case "import":
      document.getElementById("bankImport")?.click();
      return;
    default:
      startGuidedPracticeWithChoice(null);
  }
}

function buildDashboardStats() {
  const counts = countQuestions(state.questions);
  const validCounts = countQuestions(getEligibleQuestions());
  const activeCourse = getActiveCourse();
  const records = getCourseRecords(activeCourse.id);
  const last = records[records.length - 1];
  const scores = records.map((record) => record.score);
  const highScore = scores.length ? Math.max(...scores) : "-";
  const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : "-";
  const lastScore = last ? last.score : "-";
  const scoreGap = last ? Math.max(0, DEFAULT_EXAM_CONFIG.passingScore - last.score) : DEFAULT_EXAM_CONFIG.passingScore;
  const typeStats = aggregateTypeAccuracy(records);
  const shallowCount = Object.values(state.mastery).filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === activeCourse.id && item.status === "浅层熟悉").length;
  const repairCandidateCount = buildRepairQuestionIds().length;
  const unlearnedCount = buildUnlearnedQuestionIds(activeCourse.id).length;
  const memorizeCount = buildMemorizeQuestionIds(activeCourse.id).length;
  const forgetFragileCount = buildForgetRepairQuestionIds(activeCourse.id).length;
  const recallDueCount = buildActiveRecallQuestionIds(activeCourse.id).length;
  const microTaskCount = buildMicroReviewQuestionIds(activeCourse.id).length;

  return {
    counts,
    validCounts,
    lastScore,
    highScore,
    averageScore,
    examCount: records.length,
    scoreGap,
    highRiskCount: getCourseWrongQuestionIds(activeCourse.id).length,
    memorizeCount,
    microTaskCount,
    recallDueCount,
    unlearnedCount,
    forgetFragileCount,
    shallowCount,
    repairCandidateCount,
    multipleAccuracy: typeStats.multiple,
    judgeAccuracy: typeStats.judge,
    weakChapters: aggregateChapterAccuracy(records).slice(0, 3)
  };
}

function shouldStartWithFoundation(stats) {
  return stats.unlearnedCount > 0 && (stats.examCount === 0 || stats.lastScore === "-" || Number(stats.lastScore) < 60);
}

function renderFoundationNotice(course, stats) {
  return `
    <div class="notice foundation-notice">
      <strong>${escapeHtml(course.name)}：先别硬刷模拟。</strong>
      <span>当前还有 ${stats.unlearnedCount} 题没铺底，先点“题眼背题”：看题、看答案、抓关键词，再判断自己是否记住。等能连续认出一批题，再上模拟考试。</span>
    </div>
  `;
}

function renderCloudSyncPanel() {
  const lastSyncAt = localStorage.getItem(STORAGE_KEYS.lastCloudSyncAt);
  const localUpdatedAt = localStorage.getItem(STORAGE_KEYS.localUpdatedAt);
  const unsyncedLocal = hasUnsyncedLocalChanges();
  const syncStatus = state.syncStatus || (state.syncKey
    ? state.syncConflict
      ? "发现同步冲突：请选「采用本机」或「采用云端」。"
      : unsyncedLocal
        ? `自动同步已开启｜本机有未上传进度（${formatLocalDate(localUpdatedAt || new Date().toISOString())}）`
        : lastSyncAt
          ? `自动同步已开启｜上次同步：${formatLocalDate(lastSyncAt)}`
          : "自动同步已开启，等待首次云端同步。"
    : "手机电脑用同一个同步码，进度自动对齐。");
  return `
    <section class="panel wide sync-panel dashboard-sync">
      <div class="section-title">
        <h2>手机 / 电脑同步</h2>
        <span>${state.syncBusy ? "同步中" : state.syncConflict ? "冲突" : unsyncedLocal ? "待上传" : state.syncKey ? "自动" : "未开启"}</span>
      </div>
      <div class="sync-controls">
        <label>
          <span>同步码</span>
          <input id="syncKeyInput" type="text" value="${escapeHtml(state.syncKey)}" placeholder="例如 my-sync-key-abc123" autocomplete="off" />
        </label>
        <button id="saveSyncKey" class="primary" ${state.syncBusy ? "disabled" : ""}>开启自动同步</button>
        <button id="syncNow" ${state.syncBusy || !state.syncKey ? "disabled" : ""}>立即同步</button>
        <button id="pullCloudSync" ${state.syncBusy || !state.syncKey ? "disabled" : ""}>拉取云端</button>
      </div>
      <p class="sync-status">${escapeHtml(syncStatus)}</p>
      ${state.syncKey ? `<p class="sync-summary">${escapeHtml(formatSyncProgressSummary())}</p>` : ""}
      ${
        unsyncedLocal && !state.syncBusy && !state.syncConflict
          ? `<p class="sync-hint sync-warning">本机刚练过题但可能还没传上云端。切走页面前请点「立即同步」，或等 2 秒自动上传。</p>`
          : ""
      }
      ${
        state.syncConflict
          ? `
            <div class="sync-conflict">
              <strong>发现冲突：本机和云端都有新进度。</strong>
              <p class="sync-conflict-detail">本机：${escapeHtml(formatSyncProgressSummaryFromStorage(state.syncConflict.localSummary || {}))}</p>
              <p class="sync-conflict-detail">云端（${escapeHtml(formatLocalDate(state.syncConflict.updatedAt))}）：${escapeHtml(formatSyncProgressSummaryFromStorage(state.syncConflict.remoteSummary || {}))}</p>
              <p class="sync-hint sync-warning">${escapeHtml(buildSyncConflictHint(state.syncConflict))}</p>
              <div>
                <button id="useLocalSync" class="primary">采用本机</button>
                <button id="useCloudSync">采用云端</button>
              </div>
            </div>
          `
          : ""
      }
      <p class="sync-hint">两台设备填<strong>同一个同步码</strong>，并打开<strong>同一个网址</strong>（${escapeHtml(location.hostname || "当前站点")}）。同步进度、错题、掌握状态、答案先行断点；不上传 PDF、Word、图片。${localUpdatedAt ? `本机最近变更：${escapeHtml(formatLocalDate(localUpdatedAt))}` : ""}</p>
      ${state.syncKey ? renderSyncWorkflowGuide() : ""}
    </section>
  `;
}

function getCramFlowForToday(dateKey = getLocalDateKey()) {
  const planApi = window.ExamCramPlan;
  if (!planApi?.isActiveCramDate?.(dateKey)) {
    return null;
  }
  return planApi.buildCramFlow(planApi.getDailyPlan(dateKey));
}

function buildTodayFlow(stats, foundationFirst = false) {
  const cramFlow = getCramFlowForToday();
  if (cramFlow) {
    return cramFlow;
  }
  if (!state.questions.length) {
    return {
      title: "今日通关流程",
      badge: "先接题库",
      action: "import",
      actionLabel: "导入题库",
      reason: "当前课程还没有可用题目，先把题库接进来。",
      steps: [
        ["选课程", "确认当前正在处理的考试科目。"],
        ["导入题库", "把 JSON 题库接到当前课程。"],
        ["先铺底", "用题眼背题认出基本考点。"],
        ["再模拟", "有基础后再进入限时考试。"],
        ["压错题", "错题进入重练和浅层修复。"]
      ]
    };
  }
  if (foundationFirst) {
    return {
      title: "今日通关流程",
      badge: `${stats.unlearnedCount} 题先铺底`,
      action: "foundation",
      actionLabel: "开始题眼背题",
      reason: "这门课还没铺底，先别硬刷模拟。",
      steps: [
        ["先看答案", "这一步不是考试，先知道题目考什么。"],
        ["抓题眼", "只圈能触发答案的关键词。"],
        ["遮住再说", "用一句话说出答案和判断规则。"],
        ["标记状态", "会就出池，不会就进错题池。"],
        ["再开模拟", "认出一批题后再做限时考试。"]
      ]
    };
  }
  if (stats.highRiskCount >= 6) {
    return {
      title: "今日通关流程",
      badge: `${stats.highRiskCount} 道高危错题`,
      action: "wrong",
      actionLabel: "开始错题重练",
      reason: "错题池已经够多，先把会错的题压下来。",
      steps: [
        ["先做错题", "只练本课程高危错题。"],
        ["必须选错因", "区分没学过、概念混淆、手滑和反应慢。"],
        ["看判题路径", "题眼、考点、干扰项都过一遍。"],
        ["答对再出池", "不要只看解析就跳过。"],
        ["回模拟考", "错题下降后再测整套节奏。"]
      ]
    };
  }
  if (stats.repairCandidateCount >= 3) {
    return {
      title: "今日通关流程",
      badge: `${stats.repairCandidateCount} 题浅层修复`,
      action: "repair",
      actionLabel: "开始浅层修复",
      reason: "你现在更需要练判题路径，不是继续盲刷。",
      steps: [
        ["找题眼", "先判断题干真正问什么。"],
        ["定位考点", "把题目放回具体知识点。"],
        ["排除干扰项", "说明为什么不选其他选项。"],
        ["重新作答", "再选一次，训练触发路径。"],
        ["同类迁移", "把相近概念一起区分。"]
      ]
    };
  }
  if (stats.forgetFragileCount >= 3) {
    return {
      title: "今日通关流程",
      badge: `${stats.forgetFragileCount} 题秒忘`,
      action: "forget",
      actionLabel: "开始秒忘加固",
      reason: "这些题不是没见过，是提取不稳。",
      steps: [
        ["先遮答案", "不要一上来读解析。"],
        ["主动回忆", "逼自己说出关键词。"],
        ["看关系卡", "把相近知识点区分开。"],
        ["标记稳定度", "还秒忘就继续留池。"],
        ["短间隔再测", "今天稍后再抽一次。"]
      ]
    };
  }
  if (stats.recallDueCount >= 3) {
    return {
      title: "今日通关流程",
      badge: `${stats.recallDueCount} 题到期`,
      action: "recall",
      actionLabel: "开始闭卷复述",
      reason: "到期题要先主动提取，避免下一秒忘。",
      steps: [
        ["看题闭卷", "先不看解析。"],
        ["写出答案", "能写关键词就够。"],
        ["显示解析", "对照缺口。"],
        ["打复习标签", "会了、半会、不会分开。"],
        ["进入下一轮", "标签决定下次出现时间。"]
      ]
    };
  }
  return {
    title: "今日通关流程",
    badge: stats.lastScore === "-" ? "先测一轮" : `最近 ${stats.lastScore} 分`,
    action: "exam",
    actionLabel: stats.lastScore === "-" ? "开始模拟考试" : "再做一轮模拟",
    reason: "基础和错题压力不高，进入限时考试测真实通过率。",
    steps: [
      ["限时模拟", "按上机节奏完整做一轮。"],
      ["标我不会", "眼熟但不会就按 X 或点我不会。"],
      ["统一交卷", "考试中不看答案。"],
      ["看报告", "分清假掌握、浅层熟悉和没学过。"],
      ["重练错题", "报告出来后立刻压错题。"]
    ]
  };
}

function startFlowAction(flowOrAction) {
  const flow = typeof flowOrAction === "string" ? { action: flowOrAction } : flowOrAction || {};
  const action = flow.action;
  if (action === "guided") {
    startCramGuidedPractice(flow.focusCourseId);
    return;
  }
  if (action === "memorize-top50") {
    startDemoTopStudy();
    return;
  }
  if (action === "foundation") {
    if (flow.focusCourseId && flow.focusCourseId !== state.activeCourseId) {
      state.activeCourseId = flow.focusCourseId;
      saveActiveCourseId(flow.focusCourseId);
      syncActiveCourseBank();
    }
    startUnlearnedStudy(buildMemorizeQuestionIds(state.activeCourseId), "题眼背题");
    return;
  }
  if (action === "wrong") {
    startPractice(getCourseWrongQuestionIds(state.activeCourseId), "高危错题重练");
    return;
  }
  if (action === "repair") {
    startRepairTraining();
    return;
  }
  if (action === "forget") {
    startForgetRepair();
    return;
  }
  if (action === "recall") {
    startActiveRecall();
    return;
  }
  if (action === "import") {
    document.getElementById("bankImport")?.click();
    return;
  }
  startExam("mock");
}

function startCramGuidedPractice(courseId = state.activeCourseId) {
  if (courseId && courseId !== state.activeCourseId) {
    state.activeCourseId = courseId;
    saveActiveCourseId(courseId);
    syncActiveCourseBank();
  }
  startGuidedPractice();
}

function startDemoTopStudy() {
  const ids = window.ExamCramPlan?.DEMO_TOP_IDS || [];
  if (!ids.length) {
    alert("抢救计划模块未加载，请刷新页面后重试。");
    return;
  }
  if (state.activeCourseId !== "demo_a") {
    state.activeCourseId = "demo_a";
    saveActiveCourseId("demo_a");
    syncActiveCourseBank();
  }
  const available = ids.filter((id) => findQuestionForCourse("demo_a", id));
  if (!available.length) {
    alert("高频 50 题清单加载失败。");
    return;
  }
  startUnlearnedStudy(available, "高频题眼");
}

function renderDailyMemoryFlow(flow) {
  const examRows = (flow.examsToday || []).map(formatExamRow).join("");
  const focusLine = flow.focusCourseName
    ? `<p class="cram-focus">今日主攻：<strong>${escapeHtml(flow.focusCourseName)}</strong>${flow.minQuestions ? `｜底线 ${flow.minQuestions} 题` : ""}${flow.secondaryCourseName ? `｜副科 ${escapeHtml(flow.secondaryCourseName)}` : ""}</p>`
    : "";
  const eveningLine = flow.evening ? `<p class="sync-hint cram-evening">${escapeHtml(flow.evening)}</p>` : "";
  const top50Button = flow.showTop50
    ? `<button id="startDemoTopStudy" class="cram-top50">示例科目 A高频题眼</button>`
    : "";

  return `
    <section class="panel wide today-flow cram-flow">
      <div class="section-title">
        <h2>${escapeHtml(flow.title)}</h2>
        <span>${escapeHtml(flow.badge)}</span>
      </div>
      ${renderABStudyGuide()}
      ${focusLine}
      <div class="next-action">
        <div>
          <strong>${escapeHtml(flow.actionLabel)}</strong>
          <span>${escapeHtml(flow.reason)}</span>
        </div>
        <div class="cram-flow-actions">
          <button id="startFlowAction" class="primary">${escapeHtml(flow.actionLabel)}</button>
          ${top50Button}
        </div>
      </div>
      ${
        examRows
          ? `
            ${renderExamVenueBanner(flow.examsToday)}
            <ul class="cram-exam-list">
              ${examRows}
            </ul>
          `
          : ""
      }
      <ol class="flow-list">
        ${flow.steps.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></li>`).join("")}
      </ol>
      ${eveningLine}
    </section>
  `;
}

function buildBehaviorModel(courseId = state.activeCourseId) {
  const records = getCourseRecords(courseId);
  const events = getCourseBehaviorEvents(courseId);
  const masteryItems = Object.values(state.mastery).filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId);
  const wrongItems = Object.values(state.wrongPool).filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId);
  const reasonCounts = countBy(wrongItems, (item) => item.lastReason || "未标注");
  const statusCounts = countBy(masteryItems, (item) => item.status || "未学");
  const unlearnedCount = buildUnlearnedQuestionIds(courseId).length;
  const recallDueCount = buildActiveRecallQuestionIds(courseId).length;
  const lastRecords = records.slice(-3);
  const slowCount = lastRecords.flatMap((record) => record.questionResults || []).filter((item) => (item.timeSpentSeconds || 0) >= 45).length;
  const recentEvents = events.slice(-80);
  const model = {
    courseId,
    eventCount: events.length,
    dominantReason: "暂无数据",
    riskScore: 0,
    diagnoses: [],
    actions: []
  };

  addDiagnosis(model, {
    score: Math.min(60, unlearnedCount * 2) + (statusCounts["未学"] || 0) * 8 + (reasonCounts["没学过"] || 0) * 12,
    title: "基础没铺开",
    evidence: `${unlearnedCount} 题待补基础，${reasonCounts["没学过"] || 0} 题标过没学过`,
    action: "先点“未学补基础”，不要直接硬刷模拟。"
  });
  addDiagnosis(model, {
    score: Math.min(45, recallDueCount * 3),
    title: "间隔复习到期",
    evidence: `${recallDueCount} 题需要闭卷复述或重新提取`,
    action: "点“闭卷复述”，先写/说答案，再显示解析打标签。"
  });
  addDiagnosis(model, {
    score: (statusCounts["秒忘"] || 0) * 14 + (reasonCounts["下一秒忘"] || 0) * 16,
    title: "提取路径太弱",
    evidence: `${statusCounts["秒忘"] || 0} 题秒忘，${reasonCounts["下一秒忘"] || 0} 次错因是下一秒忘`,
    action: "点“秒忘加固”，先遮答案主动回忆，再看标签和关系卡。"
  });
  addDiagnosis(model, {
    score: (statusCounts["假掌握"] || 0) * 14 + (reasonCounts["假掌握"] || 0) * 12,
    title: "以为会但会错",
    evidence: `${statusCounts["假掌握"] || 0} 题是假掌握`,
    action: "做错题重练，先说出题眼再选答案。"
  });
  addDiagnosis(model, {
    score: (statusCounts["概念混淆"] || 0) * 12 + (reasonCounts["概念混淆"] || 0) * 12,
    title: "相近概念混在一起",
    evidence: `${statusCounts["概念混淆"] || 0} 题概念混淆`,
    action: "做浅层修复训练，把题眼、考点、干扰项分开。"
  });
  addDiagnosis(model, {
    score: slowCount * 6 + (reasonCounts["会但反应慢"] || 0) * 10 + (reasonCounts["考试节奏问题"] || 0) * 10,
    title: "反应慢或节奏不稳",
    evidence: `${slowCount} 道题耗时偏长`,
    action: "用考前冲刺做短时限训练，先保证会的题快速拿分。"
  });

  if (!model.diagnoses.length && records.length) {
    addDiagnosis(model, {
      score: 10,
      title: "暂时没有明显单点问题",
      evidence: "数据还少，继续做一轮模拟或补基础会更准",
      action: "今天先完成一轮未学补基础或模拟考试。"
    });
  }

  if (!model.diagnoses.length) {
    addDiagnosis(model, {
      score: 5,
      title: "还没有学习行为数据",
      evidence: "系统还没记录到本课程的作答、错因或补基础行为",
      action: "先导入题库，然后做“未学补基础”。"
    });
  }

  model.diagnoses.sort((a, b) => b.score - a.score);
  model.dominantReason = model.diagnoses[0]?.title || "暂无数据";
  model.riskScore = clamp(Math.round(model.diagnoses.slice(0, 3).reduce((sum, item) => sum + item.score, 0)), 0, 100);
  model.actions = model.diagnoses.slice(0, 3).map((item) => item.action);
  model.recentSummary = summarizeRecentBehavior(recentEvents);
  return model;
}

function addDiagnosis(model, diagnosis) {
  if (diagnosis.score <= 0) {
    return;
  }
  model.diagnoses.push(diagnosis);
}

function renderBehaviorModelPanel(model) {
  const rows = model.diagnoses
    .slice(0, 4)
    .map(
      (item) => `
        <li>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <span>${escapeHtml(item.evidence)}</span>
            <em>${escapeHtml(item.action)}</em>
          </div>
        </li>
      `
    )
    .join("");
  return `
    <div class="panel wide">
      <div class="section-title">
        <h2>行为模型诊断</h2>
        <span>风险 ${model.riskScore}｜${escapeHtml(model.dominantReason)}</span>
      </div>
      <ul class="model-list">${rows}</ul>
      <div class="behavior-summary">
        <span>已记录 ${model.eventCount} 个行为事件</span>
        <span>${escapeHtml(model.recentSummary)}</span>
      </div>
    </div>
  `;
}

function renderAttentionLogPanel(log) {
  const entries = ATTENTION_LOG_FIELDS.map(([field, label]) => {
    const value = log?.[field] || "";
    return `
      <label class="attention-check">
        <input type="checkbox" data-attention-field="${field}" ${value === "yes" ? "checked" : ""} />
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }).join("");
  return `
    <div class="panel wide">
      <div class="section-title">
        <h2>7天注意力记录</h2>
        <span>只记录，不诊断</span>
      </div>
      <div class="attention-grid">${entries}</div>
      <label class="attention-note">
        <span>一句话复盘</span>
        <input id="attentionNote" type="text" value="${escapeHtml(log?.note || "")}" placeholder="今天做了几题，最容易忘什么，明天先复习什么" />
      </label>
      <button id="saveAttentionLog" class="primary">保存今天状态</button>
    </div>
  `;
}

function bindAttentionLogPanel() {
  const saveButton = document.getElementById("saveAttentionLog");
  if (!saveButton) {
    return;
  }
  saveButton.addEventListener("click", saveTodayAttentionLog);
}

function saveTodayAttentionLog() {
  const today = getLocalDateKey();
  const nextLog = {
    date: today,
    note: document.getElementById("attentionNote")?.value.trim() || "",
    updatedAt: new Date().toISOString()
  };
  app.querySelectorAll("[data-attention-field]").forEach((input) => {
    nextLog[input.dataset.attentionField] = input.checked ? "yes" : "no";
  });
  state.attentionLogs = [
    ...state.attentionLogs.filter((item) => item.date !== today),
    nextLog
  ].slice(-14);
  saveAttentionLogs(state.attentionLogs);
  state.message = "今天的注意力记录已保存。";
  renderDashboard();
}

function summarizeRecentBehavior(events) {
  if (!events.length) {
    return "暂无最近行为";
  }
  const counts = countBy(events, (event) => event.type);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${formatBehaviorType(type)} ${count}`)
    .join(" / ");
}

function formatBehaviorType(type) {
  const labels = {
    exam_submit: "模拟",
    study_remembered: "记住",
    study_unlearned: "仍不会",
    forget_stable: "秒忘稳住",
    forget_unstable: "秒忘未稳",
    practice_correct: "错题答对",
    practice_wrong: "错题答错",
    repair_correct: "修复答对",
    repair_wrong: "修复仍错",
    active_recall: "闭卷复述",
    guided_learn_view: "引导看答案",
    guided_reveal: "引导遮答",
    guided_recall_correct: "引导记住",
    guided_recall_wrong: "引导没记住",
    guided_quiz_correct: "引导小测答对",
    guided_quiz_wrong: "引导小测答错",
    guided_unknown: "引导不会",
    expression_gap_report: "会选但说不出",
    expression_gap_clear: "取消会选说不出",
    instant_drill_remembered: "刷题记住了",
    instant_drill_forgot: "刷题没记住"
  };
  return labels[type] || type;
}

function logLearningEvent(type, payload = {}) {
  const event = {
    id: makeEventId(),
    type,
    courseId: payload.courseId || state.activeCourseId,
    createdAt: new Date().toISOString(),
    ...payload
  };
  state.behaviorEvents = [...state.behaviorEvents, event].slice(-1200);
  saveBehaviorEvents(state.behaviorEvents);
}

function toggleExpressionGap(context, session, question) {
  if (!session || !question) {
    return;
  }
  if (!session.expressionGaps) {
    session.expressionGaps = {};
  }
  const selected = !session.expressionGaps[question.id];
  session.expressionGaps[question.id] = selected;
  logLearningEvent(selected ? "expression_gap_report" : "expression_gap_clear", {
    courseId: session.courseId || state.activeCourseId,
    questionId: question.id,
    sessionId: session.id,
    context
  });
  if (context === "exam") {
    renderExam();
    return;
  }
  if (context === "practice") {
    renderPractice();
    return;
  }
  if (context === "repair") {
    renderRepairTraining();
  }
}

function getCourseBehaviorEvents(courseId) {
  return state.behaviorEvents.filter((event) => (event.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId);
}

function startExam(mode, options = {}) {
  const isSprint = mode === "sprint";
  const isFull = mode === "full";
  const rescueMode = Boolean(options.rescueMode);
  const activeCourse = getActiveCourse();
  const questions = isSprint ? buildSprintQuestions() : isFull ? buildFullMockExamQuestions() : buildMockExamQuestions();
  const config = isSprint
    ? { ...SPRINT_CONFIG, examName: `${activeCourse.name}考前冲刺` }
    : isFull
      ? {
          ...DEFAULT_EXAM_CONFIG,
          examName: `${activeCourse.name}全题随机模拟`,
          durationMinutes: calculateFullMockDuration(questions.length),
          targetQuestionCount: questions.length
        }
      : {
          ...DEFAULT_EXAM_CONFIG,
          examName: rescueMode ? `${activeCourse.name}模拟（答案先行后）` : `${activeCourse.name}随机模拟考试`,
          targetQuestionCount: questions.length
        };
  if (!questions.length) {
    alert("题库中没有可用题目。");
    return;
  }

  state.exam = {
    id: makeExamId(),
    mode,
    courseId: activeCourse.id,
    courseName: activeCourse.name,
    config,
    questions,
    currentIndex: 0,
    answers: {},
    marked: {},
    familiar: {},
    unknown: {},
    expressionGaps: {},
    assist: null,
    rescueMode,
    revealed: {},
    rescueWasUnknown: {},
    rescueCorrect: {},
    timeSpent: {},
    questionStartedAt: Date.now(),
    startedAt: new Date().toISOString(),
    endsAt: Date.now() + config.durationMinutes * 60 * 1000
  };

  state.guided = null;
  state.instantDrill = null;
  renderExam();
  startTimer();
}

function buildMockExamQuestions() {
  const eligible = getEligibleQuestions();
  const targetCount = Math.min(DEFAULT_EXAM_CONFIG.targetQuestionCount, eligible.length);
  const selected = [];
  const used = new Set();
  const quotas = {
    single: DEFAULT_EXAM_CONFIG.singleChoiceCount,
    multiple: DEFAULT_EXAM_CONFIG.multipleChoiceCount,
    judge: DEFAULT_EXAM_CONFIG.judgeCount
  };

  Object.entries(quotas).forEach(([type, quota]) => {
    sample(
      eligible.filter((question) => question.type === type && !used.has(question.id)),
      quota
    ).forEach((question) => {
      selected.push(question);
      used.add(question.id);
    });
  });

  if (selected.length < targetCount) {
    sample(
      eligible.filter((question) => !used.has(question.id)),
      targetCount - selected.length
    ).forEach((question) => selected.push(question));
  }

  return DEFAULT_EXAM_CONFIG.randomOrder ? shuffle(selected) : selected;
}

function buildFullMockExamQuestions() {
  const eligible = getEligibleQuestions();
  return DEFAULT_EXAM_CONFIG.randomOrder ? shuffle(eligible) : eligible;
}

function calculateFullMockDuration(questionCount) {
  return Math.max(DEFAULT_EXAM_CONFIG.durationMinutes, Math.ceil(questionCount * 1.2));
}

function buildSprintQuestions() {
  const eligible = getEligibleQuestions();
  const byId = new Map(eligible.map((question) => [question.id, question]));
  const records = getCourseRecords(state.activeCourseId).slice(-3);
  const priorityIds = [];

  records.forEach((record) => {
    record.questionResults
      .filter((item) => !item.isCorrect)
      .forEach((item) => priorityIds.push(item.questionId));
  });
  records.forEach((record) => {
    record.questionResults
      .filter((item) => !item.isCorrect && item.confidence === "确定")
      .forEach((item) => priorityIds.push(item.questionId));
  });
  records.forEach((record) => {
    record.questionResults
      .filter((item) => !item.isCorrect && item.questionType === "multiple")
      .forEach((item) => priorityIds.push(item.questionId));
  });
  eligible
    .filter((question) => HIGH_RISK_CHAPTERS.some((chapter) => question.chapter.includes(chapter)))
    .forEach((question) => priorityIds.push(question.id));
  eligible
    .filter((question) => Number(question.difficulty) >= 4)
    .forEach((question) => priorityIds.push(question.id));

  const selected = [];
  const used = new Set();
  priorityIds.forEach((id) => {
    if (byId.has(id) && !used.has(id) && selected.length < 25) {
      selected.push(byId.get(id));
      used.add(id);
    }
  });

  if (selected.length < 25) {
    sample(
      eligible.filter((question) => !used.has(question.id)),
      25 - selected.length
    ).forEach((question) => selected.push(question));
  }

  return shuffle(selected);
}

function renderExam() {
  const exam = state.exam;
  if (exam.assist) {
    renderExamAssist();
    return;
  }
  if (exam.rescueMode) {
    renderRescueExam();
    return;
  }
  const question = exam.questions[exam.currentIndex];
  const answer = exam.answers[question.id] || [];
  const answeredCount = exam.questions.filter((item) => (exam.answers[item.id] || []).length > 0).length;
  const markedCount = Object.values(exam.marked).filter(Boolean).length;
  const unknownCount = Object.values(exam.unknown || {}).filter(Boolean).length;
  const optionButtons = question.options
    .map((option) => {
      const selected = answer.includes(option.key);
      return `
        <button class="option ${selected ? "selected" : ""}" data-key="${escapeHtml(option.key)}">
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");
  const gridButtons = exam.questions
    .map((item, index) => {
      const status = getQuestionStatus(item, index);
      return `<button class="question-pill ${status}" data-index="${index}">${index + 1}</button>`;
    })
    .join("");

  app.className = "app-shell exam-view";
  app.innerHTML = `
    <section class="exam-header">
      <div>
        <p class="eyebrow">${escapeHtml(TYPE_LABELS[question.type])}</p>
        <h1>${escapeHtml(exam.config.examName)}</h1>
      </div>
      <div class="exam-stats">
        <span>倒计时 <strong id="timer">${formatRemaining()}</strong></span>
        <span>当前 ${exam.currentIndex + 1}/${exam.questions.length}</span>
        <span>已答 ${answeredCount}</span>
        <span>标记 ${markedCount}</span>
        <span>不会 ${unknownCount}</span>
      </div>
    </section>

    <section class="exam-layout">
      <article class="question-panel">
        <div class="question-meta">
          <span>${escapeHtml(question.chapter)}</span>
          <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
        </div>
        <h2>${escapeHtml(question.question)}</h2>
        <div class="options">${optionButtons}</div>
      </article>

      <aside class="number-card" aria-label="题号卡片">
        ${gridButtons}
      </aside>
    </section>

    <footer class="exam-actions">
      <button id="prevQuestion" ${exam.currentIndex === 0 ? "disabled" : ""}>上一题</button>
      <button id="nextQuestion">${exam.currentIndex === exam.questions.length - 1 ? "完成" : "下一题"}</button>
      <button id="unknownQuestion" class="${exam.unknown?.[question.id] ? "danger" : ""}">我不会</button>
      <button id="markQuestion" class="${exam.marked[question.id] ? "warning" : ""}">标记不确定</button>
      <button id="familiarQuestion" class="${exam.familiar[question.id] ? "warning" : ""}">眼熟但不会</button>
      <button id="expressionGapQuestion" class="${exam.expressionGaps?.[question.id] ? "warning" : ""}">会选但说不出</button>
      <button id="submitExam" class="danger">交卷</button>
    </footer>
  `;

  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(question, button.dataset.key));
  });
  app.querySelectorAll(".question-pill").forEach((button) => {
    button.addEventListener("click", () => goToQuestion(Number(button.dataset.index)));
  });
  document.getElementById("prevQuestion").addEventListener("click", () => goToQuestion(exam.currentIndex - 1));
  document.getElementById("nextQuestion").addEventListener("click", () => {
    if (exam.currentIndex === exam.questions.length - 1) {
      submitExam("manual");
    } else {
      goToQuestion(exam.currentIndex + 1);
    }
  });
  document.getElementById("unknownQuestion").addEventListener("click", toggleUnknown);
  document.getElementById("markQuestion").addEventListener("click", toggleMark);
  document.getElementById("familiarQuestion").addEventListener("click", startExamAssist);
  document.getElementById("expressionGapQuestion")?.addEventListener("click", () => toggleExpressionGap("exam", exam, question));
  document.getElementById("submitExam").addEventListener("click", () => submitExam("manual"));
  updateTimerLabel();
}

function renderRescueExam() {
  const exam = state.exam;
  const question = exam.questions[exam.currentIndex];
  const answer = exam.answers[question.id] || [];
  const revealResult = Boolean(exam.revealed[question.id]);
  const wasUnknown = Boolean(exam.rescueWasUnknown[question.id]);
  const isCorrect = Boolean(exam.rescueCorrect[question.id]);
  const path = buildReasoningPath(question);
  const optionButtons = question.options
    .map((option) => {
      const selected = answer.includes(option.key);
      const correct = revealResult && question.answer.includes(option.key);
      const wrong = revealResult && selected && !correct;
      return `
        <button class="option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" data-key="${escapeHtml(option.key)}" ${revealResult ? "disabled" : ""}>
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitRescueExam")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">答案先行后模拟</p>
        <h1>${escapeHtml(exam.config.examName)}</h1>
      </div>
      <div class="exam-stats">
        <span>倒计时 <strong id="timer">${formatRemaining()}</strong></span>
        <span>题号 ${exam.currentIndex + 1}/${exam.questions.length}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="options">${optionButtons}</div>
      ${
        revealResult
          ? `
            <div class="feedback ${wasUnknown || !isCorrect ? "wrong" : "correct"}">
              <strong>${wasUnknown ? "这题先记为不会" : isCorrect ? "答对了" : "答错了"}</strong>
              <p>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</p>
              <p>题眼：${escapeHtml(path.keyClue)}</p>
              <p>下次判断：${escapeHtml(path.nextTimeRule)}</p>
            </div>
          `
          : ""
      }
    </article>

    <footer class="exam-actions guided-actions">
      ${
        revealResult
          ? `<button id="nextRescueExam" class="primary">${exam.currentIndex === exam.questions.length - 1 ? "交卷" : "下一题"}</button>`
          : `
            <button id="rescueExamUnknown" class="warning">不会，查看答案题眼</button>
            <button id="checkRescueExam" class="primary">检查答案</button>
          `
      }
    </footer>
  `;

  document.getElementById("exitRescueExam").addEventListener("click", exitRescueExamToHome);
  if (revealResult) {
    document.getElementById("nextRescueExam").addEventListener("click", advanceRescueExam);
    updateTimerLabel();
    return;
  }
  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(question, button.dataset.key));
  });
  document.getElementById("rescueExamUnknown").addEventListener("click", revealRescueExamUnknown);
  document.getElementById("checkRescueExam").addEventListener("click", checkRescueExamAnswer);
  updateTimerLabel();
}

function exitRescueExamToHome() {
  if (state.exam && !window.confirm("模拟还没做完，确认回首页吗？")) {
    return;
  }
  clearTimer();
  state.exam = null;
  renderDashboard();
}

function checkRescueExamAnswer() {
  const exam = state.exam;
  const question = exam.questions[exam.currentIndex];
  const answer = exam.answers[question.id] || [];
  if (!answer.length) {
    alert("请先选择答案。");
    return;
  }
  exam.revealed[question.id] = true;
  exam.rescueWasUnknown[question.id] = false;
  exam.rescueCorrect[question.id] = sameAnswer(answer, question.answer);
  if (exam.rescueCorrect[question.id]) {
    updateWrongPoolFromPractice(question.id, true);
  } else {
    updateWrongPoolFromPractice(question.id, false, "概念混淆");
  }
  renderExam();
}

function revealRescueExamUnknown() {
  const exam = state.exam;
  const question = exam.questions[exam.currentIndex];
  exam.revealed[question.id] = true;
  exam.rescueWasUnknown[question.id] = true;
  exam.rescueCorrect[question.id] = false;
  exam.unknown[question.id] = true;
  delete exam.answers[question.id];
  updateWrongPoolFromPractice(question.id, false, "没学过");
  renderExam();
}

function advanceRescueExam() {
  const exam = state.exam;
  if (exam.currentIndex >= exam.questions.length - 1) {
    submitExam("manual");
    return;
  }
  goToQuestion(exam.currentIndex + 1);
}

function startExamAssist() {
  const exam = state.exam;
  const question = exam.questions[exam.currentIndex];
  const firstAnswer = exam.answers[question.id] || [];
  exam.familiar[question.id] = {
    questionId: question.id,
    clickedFamiliarButUnsure: true,
    firstAnswer,
    finalAnswer: firstAnswer,
    clueFound: false,
    conceptLocated: false,
    startedAt: new Date().toISOString()
  };
  exam.assist = {
    questionId: question.id,
    step: 0,
    clueChoice: "",
    conceptChoice: "",
    eliminationChoice: "",
    finalAnswer: firstAnswer
  };
  renderExamAssist();
}

function renderExamAssist() {
  const exam = state.exam;
  const assist = exam.assist;
  const question = exam.questions.find((item) => item.id === assist.questionId);
  const steps = ["找题眼", "定位考点", "排除干扰项", "重新作答"];
  const stepTitle = steps[assist.step] || "重新作答";
  const body = renderAssistStep(question, assist);

  app.className = "app-shell exam-view";
  app.innerHTML = `
    <section class="exam-header">
      <div>
        <p class="eyebrow">眼熟但不会</p>
        <h1>${escapeHtml(stepTitle)}</h1>
      </div>
      <div class="exam-stats">
        <span>倒计时 <strong id="timer">${formatRemaining()}</strong></span>
        <span>当前 ${exam.currentIndex + 1}/${exam.questions.length}</span>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
        <span>第 ${assist.step + 1} / 4 步</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      ${body}
    </article>

    <footer class="exam-actions">
      <button id="cancelAssist">回到本题</button>
      <button id="nextAssist" class="primary">${assist.step === 3 ? "保存并回到考试" : "下一步"}</button>
    </footer>
  `;

  app.querySelectorAll(".assist-choice").forEach((button) => {
    button.addEventListener("click", () => selectAssistChoice(button.dataset.field, button.dataset.value));
  });
  app.querySelectorAll(".assist-answer").forEach((button) => {
    button.addEventListener("click", () => selectAssistFinalAnswer(question, button.dataset.key));
  });
  document.getElementById("cancelAssist").addEventListener("click", cancelExamAssist);
  document.getElementById("nextAssist").addEventListener("click", advanceExamAssist);
  updateTimerLabel();
}

function renderAssistStep(question, assist) {
  if (assist.step === 0) {
    return renderChoiceGrid(
      "这道题的题眼是哪一个？",
      buildClueChoices(question),
      "clueChoice",
      assist.clueChoice,
      "先抓最能决定答案的词，不要只看熟悉名词。"
    );
  }
  if (assist.step === 1) {
    return renderChoiceGrid(
      "这道题考的是哪个知识点？",
      buildConceptChoices(question),
      "conceptChoice",
      assist.conceptChoice,
      "把题眼落到章节里的具体考点。"
    );
  }
  if (assist.step === 2) {
    return `
      ${renderChoiceGrid("先选一个最像干扰项的选项", buildEliminationChoices(question), "eliminationChoice", assist.eliminationChoice, "考试中先排除和题眼不匹配的项，再处理相近项。")}
      <div class="hint-box">
        <strong>排除提示</strong>
        <p>对每个选项问一句：它是在回答题眼，还是只是在同章节里眼熟？眼熟但没有命中题眼的选项先降权。</p>
      </div>
    `;
  }

  const optionButtons = question.options
    .map((option) => {
      const selected = assist.finalAnswer.includes(option.key);
      return `
        <button class="option assist-answer ${selected ? "selected" : ""}" data-key="${escapeHtml(option.key)}">
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");
  return `
    <div class="hint-box">
      <strong>重新作答</strong>
      <p>按“题眼 → 考点 → 排除”的路径再选一次。这里仍不显示答案。</p>
    </div>
    <div class="options">${optionButtons}</div>
  `;
}

function renderChoiceGrid(title, choices, field, selectedValue, hint) {
  return `
    <div class="training-step">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(hint)}</p>
      <div class="choice-grid">
        ${choices
          .map(
            (choice) => `
              <button class="assist-choice ${selectedValue === choice.value ? "selected" : ""}" data-field="${escapeHtml(field)}" data-value="${escapeHtml(choice.value)}">
                ${escapeHtml(choice.label)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function selectAssistChoice(field, value) {
  state.exam.assist[field] = value;
  renderExamAssist();
}

function selectAssistFinalAnswer(question, key) {
  const assist = state.exam.assist;
  if (question.type === "multiple") {
    assist.finalAnswer = assist.finalAnswer.includes(key)
      ? assist.finalAnswer.filter((item) => item !== key)
      : sortAnswer([...assist.finalAnswer, key]);
  } else {
    assist.finalAnswer = [key];
  }
  renderExamAssist();
}

function advanceExamAssist() {
  const exam = state.exam;
  const assist = exam.assist;
  const question = exam.questions.find((item) => item.id === assist.questionId);
  if (assist.step === 0 && !assist.clueChoice) {
    alert("先选一个题眼。");
    return;
  }
  if (assist.step === 1 && !assist.conceptChoice) {
    alert("先定位一个考点。");
    return;
  }
  if (assist.step === 2 && !assist.eliminationChoice) {
    alert("先选一个干扰项。");
    return;
  }
  if (assist.step < 3) {
    assist.step += 1;
    renderExamAssist();
    return;
  }
  if (!assist.finalAnswer.length) {
    alert("请重新作答后再回到考试。");
    return;
  }

  exam.answers[question.id] = sortAnswer(assist.finalAnswer);
  exam.familiar[question.id] = {
    ...exam.familiar[question.id],
    finalAnswer: sortAnswer(assist.finalAnswer),
    clueFound: Boolean(assist.clueChoice),
    conceptLocated: Boolean(assist.conceptChoice),
    clueChoice: assist.clueChoice,
    conceptChoice: assist.conceptChoice,
    eliminationChoice: assist.eliminationChoice,
    completedAt: new Date().toISOString()
  };
  exam.assist = null;
  renderExam();
}

function cancelExamAssist() {
  state.exam.assist = null;
  renderExam();
}

function getQuestionStatus(question, index) {
  if (index === state.exam.currentIndex) {
    return "current";
  }
  if (state.exam.marked[question.id]) {
    return "marked";
  }
  if (state.exam.unknown?.[question.id]) {
    return "unknown";
  }
  if ((state.exam.answers[question.id] || []).length > 0) {
    return "answered";
  }
  return "empty";
}

function selectAnswer(question, key) {
  if (state.exam?.rescueMode && state.exam.revealed[question.id]) {
    return;
  }
  const current = state.exam.answers[question.id] || [];
  delete state.exam.unknown[question.id];
  if (question.type === "multiple") {
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    state.exam.answers[question.id] = sortAnswer(next);
  } else {
    state.exam.answers[question.id] = [key];
  }
  renderExam();
}

function goToQuestion(index) {
  const exam = state.exam;
  if (!exam || index < 0 || index >= exam.questions.length) {
    return;
  }
  commitQuestionTime();
  exam.currentIndex = index;
  exam.questionStartedAt = Date.now();
  renderExam();
}

function toggleMark() {
  const question = state.exam.questions[state.exam.currentIndex];
  state.exam.marked[question.id] = !state.exam.marked[question.id];
  renderExam();
}

function toggleUnknown() {
  const question = state.exam.questions[state.exam.currentIndex];
  const next = !state.exam.unknown?.[question.id];
  state.exam.unknown[question.id] = next;
  if (next) {
    delete state.exam.answers[question.id];
    delete state.exam.marked[question.id];
    delete state.exam.familiar[question.id];
  }
  renderExam();
}

function startTimer() {
  clearTimer();
  state.timerId = window.setInterval(() => {
    updateTimerLabel();
    if (remainingMs() <= 0) {
      submitExam("timeout");
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
  clearDashboardCountdown();
}

function clearDashboardCountdown() {
  if (state.dashboardTimerId) {
    window.clearInterval(state.dashboardTimerId);
    state.dashboardTimerId = null;
  }
}

function startDashboardCountdown() {
  clearDashboardCountdown();
  updateDashboardCountdowns();
  state.dashboardTimerId = window.setInterval(updateDashboardCountdowns, 60000);
}

function updateDashboardCountdowns() {
  app.querySelectorAll("[data-exam-countdown-course]").forEach((element) => {
    const course = getCourseById(element.dataset.examCountdownCourse);
    element.textContent = buildCourseLearningStatus(course).countdown.label;
  });
}

function updateTimerLabel() {
  const timer = document.getElementById("timer");
  if (!timer || !state.exam) {
    return;
  }
  timer.textContent = formatRemaining();
  timer.classList.toggle("urgent", remainingMs() < 5 * 60 * 1000);
}

function formatRemaining() {
  const seconds = Math.max(0, Math.ceil(remainingMs() / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function remainingMs() {
  return state.exam ? state.exam.endsAt - Date.now() : 0;
}

function commitQuestionTime() {
  const exam = state.exam;
  if (!exam) {
    return;
  }
  const question = exam.questions[exam.currentIndex];
  const elapsed = Math.max(0, Math.round((Date.now() - exam.questionStartedAt) / 1000));
  exam.timeSpent[question.id] = (exam.timeSpent[question.id] || 0) + elapsed;
}

function submitExam(source) {
  const exam = state.exam;
  if (!exam) {
    return;
  }
  const unansweredCount = exam.questions.filter((question) => (exam.answers[question.id] || []).length === 0 && !exam.unknown?.[question.id]).length;
  if (source === "manual" && unansweredCount > 0) {
    const confirmed = window.confirm(`还有 ${unansweredCount} 道题未答，确认交卷吗？`);
    if (!confirmed) {
      return;
    }
  }

  commitQuestionTime();
  clearTimer();
  const report = gradeExam(exam, source);
  state.records = [...state.records, report.record].slice(-50);
  saveRecords(state.records);
  updateWrongPoolFromExam(report.record);
  appendShallowRecordsFromExam(report.record);
  updateMasteryFromExam(report.record);
  logLearningEvent("exam_submit", {
    courseId: report.record.courseId,
    examId: report.record.id,
    mode: report.record.mode,
    score: report.record.score,
    totalQuestions: report.record.totalQuestions,
    wrongCount: report.record.wrongCount,
    unknownCount: report.record.unknownCount,
    unansweredCount: report.record.unansweredCount
  });
  renderReport(report);
}

function gradeExam(exam, source) {
  const submittedAt = new Date().toISOString();
  const questionResults = exam.questions.map((question, index) => {
    const userAnswer = exam.answers[question.id] || [];
    const familiar = exam.familiar[question.id] || null;
    const unknown = Boolean(exam.unknown?.[question.id]);
    const confidence = unknown ? "我不会" : familiar ? "眼熟但不会" : exam.marked[question.id] ? "不确定" : "确定";
    const unanswered = userAnswer.length === 0 && !unknown;
    const isCorrect = !unanswered && !unknown && sameAnswer(userAnswer, question.answer);
    const wrongReason = isCorrect
      ? familiar
        ? "浅层熟悉"
        : ""
      : unknown
        ? "没学过"
        : unanswered
          ? "考试节奏问题"
          : confidence === "确定"
            ? "假掌握"
            : confidence === "眼熟但不会"
              ? "浅层熟悉"
              : "不确定答错";

    return {
      questionId: question.id,
      order: index + 1,
      chapter: question.chapter,
      questionType: question.type,
      questionText: question.question,
      userAnswer,
      correctAnswer: question.answer,
      confidence,
      clickedUnknown: unknown,
      clickedFamiliarButUnsure: Boolean(familiar),
      firstAnswer: familiar?.firstAnswer || [],
      finalAnswer: familiar?.finalAnswer || userAnswer,
      conceptLocated: Boolean(familiar?.conceptLocated),
      clueFound: Boolean(familiar?.clueFound),
      isCorrect,
      unanswered,
      wrongReason,
      timeSpentSeconds: exam.timeSpent[question.id] || 0
    };
  });

  const correctCount = questionResults.filter((item) => item.isCorrect).length;
  const wrongCount = questionResults.length - correctCount;
  const score = Math.round((correctCount / questionResults.length) * 100);
  const typeStats = buildTypeStats(questionResults);
  const chapterStats = buildChapterStats(questionResults);
  const chapterWeakness = buildChapterWeakness(questionResults);
  const wrongQuestions = questionResults.filter((item) => !item.isCorrect);
  const certainWrong = wrongQuestions.filter((item) => item.confidence === "确定" && !item.unanswered);
  const uncertainCorrect = questionResults.filter((item) => item.isCorrect && item.confidence === "不确定");
  const shallowFamiliar = questionResults.filter((item) => item.clickedFamiliarButUnsure);
  const unknownQuestions = questionResults.filter((item) => item.clickedUnknown);
  const unanswered = wrongQuestions.filter((item) => item.unanswered);
  const knowledgeAnalysis = buildKnowledgeLayerAnalysis(questionResults);

  const record = {
    id: exam.id,
    mode: exam.mode,
    courseId: exam.courseId || state.activeCourseId,
    courseName: exam.courseName || getActiveCourse().name,
    examName: exam.config.examName,
    startedAt: exam.startedAt,
    submittedAt,
    submitSource: source,
    durationSeconds: Math.round((Date.parse(submittedAt) - Date.parse(exam.startedAt)) / 1000),
    score,
    passingScore: exam.config.passingScore,
    totalQuestions: questionResults.length,
    correctCount,
    wrongCount,
    unansweredCount: unanswered.length,
    unknownCount: unknownQuestions.length,
    typeStats,
    chapterStats,
    chapterWeakness,
    knowledgeAnalysis,
    questionResults
  };

  return {
    record,
    wrongQuestions,
    certainWrong,
    uncertainCorrect,
    shallowFamiliar,
    unknownQuestions,
    unanswered,
    reportJson: {
      examId: record.id,
      courseId: record.courseId,
      courseName: record.courseName,
      score,
      totalQuestions: record.totalQuestions,
      correctCount,
      wrongCount,
      unknownCount: unknownQuestions.length,
      chapterWeakness,
      knowledgeAnalysis,
      llmAnalysisPayload: buildLlmAnalysisPayload(record, questionResults, knowledgeAnalysis),
      wrongQuestions: wrongQuestions.map((item) => ({
        questionId: item.questionId,
        chapter: item.chapter,
        questionType: item.questionType,
        userAnswer: item.userAnswer.join(""),
        correctAnswer: item.correctAnswer.join(""),
        confidence: item.confidence,
        wrongReason: item.wrongReason,
        clickedUnknown: item.clickedUnknown,
        reasoningPath: buildReasoningPath(exam.questions.find((question) => question.id === item.questionId))
      })),
      shallowFamiliarQuestions: shallowFamiliar.map((item) => ({
        questionId: item.questionId,
        firstAnswer: item.firstAnswer.join(""),
        finalAnswer: item.finalAnswer.join(""),
        clueFound: item.clueFound,
        conceptLocated: item.conceptLocated
      }))
    }
  };
}

function renderReport(report) {
  const record = report.record;
  const typeCards = Object.entries(record.typeStats)
    .map(([type, item]) => metricCard(`${TYPE_LABELS[type]}正确率`, `${item.accuracy}%`))
    .join("");
  const weakRows = report.record.chapterWeakness.length
    ? report.record.chapterWeakness
        .slice(0, 5)
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.chapter)}</td>
              <td>${item.accuracy}%</td>
              <td>${item.wrongCount}</td>
            </tr>
          `
        )
        .join("")
    : '<tr><td colspan="3">本次没有薄弱章节。</td></tr>';

  app.className = "app-shell report-view";
  app.innerHTML = `
    <section class="topbar">
      <div>
        <p class="eyebrow">交卷报告</p>
        <h1>${escapeHtml(record.examName)}</h1>
      </div>
      <div class="topbar-actions">
        <button id="retryWrong" ${report.wrongQuestions.length ? "" : "disabled"}>本次错题重练</button>
        <button id="repairReport" ${report.wrongQuestions.length || report.shallowFamiliar.length || report.unknownQuestions.length ? "" : "disabled"}>浅层修复训练</button>
        <button id="newExam" class="primary">再来一套</button>
        <button id="backHome">回首页</button>
      </div>
    </section>

    <section class="dashboard-grid">
      ${metricCard("总分", record.score)}
      ${metricCard("正确率", `${Math.round((record.correctCount / record.totalQuestions) * 100)}%`)}
      ${metricCard("答对", record.correctCount)}
      ${metricCard("答错/未答", record.wrongCount)}
      ${metricCard("确定但答错", report.certainWrong.length)}
      ${metricCard("不确定但答对", report.uncertainCorrect.length)}
      ${metricCard("眼熟但不会", report.shallowFamiliar.length)}
      ${metricCard("我不会", report.unknownQuestions.length)}
      ${metricCard("没答", report.unanswered.length)}
      ${metricCard("及格线", record.passingScore)}
      ${typeCards}
    </section>

    <section class="main-grid">
      <div class="panel wide">
        <div class="section-title">
          <h2>薄弱章节</h2>
          <span>优先补洞</span>
        </div>
        <table>
          <thead><tr><th>章节</th><th>正确率</th><th>错题数</th></tr></thead>
          <tbody>${weakRows}</tbody>
        </table>
      </div>

      ${renderKnowledgeAnalysisPanel(record.knowledgeAnalysis)}
      ${reportList("错题列表", report.wrongQuestions)}
      ${reportList("我不会：底层没铺开", report.unknownQuestions)}
      ${reportList("确定但答错：假掌握", report.certainWrong)}
      ${reportList("不确定但答对：需要巩固", report.uncertainCorrect)}
      ${reportList("眼熟但不会：浅层熟悉", report.shallowFamiliar)}

      <details class="panel wide">
        <summary>错题报告 JSON</summary>
        <pre>${escapeHtml(JSON.stringify(report.reportJson, null, 2))}</pre>
      </details>
    </section>
  `;

  document.getElementById("retryWrong").addEventListener("click", () => {
    startPractice(report.wrongQuestions.map((item) => item.questionId), "本次错题重练");
  });
  document.getElementById("repairReport").addEventListener("click", () => {
    startRepairTraining([...report.wrongQuestions, ...report.shallowFamiliar, ...report.unknownQuestions].map((item) => item.questionId));
  });
  document.getElementById("newExam").addEventListener("click", () => startExam(record.mode === "full" ? "full" : "mock"));
  document.getElementById("backHome").addEventListener("click", renderDashboard);
}

function buildKnowledgeLayerAnalysis(questionResults) {
  const riskItems = questionResults.filter(
    (item) => !item.isCorrect || item.clickedUnknown || item.clickedFamiliarButUnsure || item.confidence !== "确定" || (item.timeSpentSeconds || 0) >= 45
  );
  const byChapter = new Map();

  riskItems.forEach((item) => {
    const chapter = item.chapter || "未标注章节";
    const entry = byChapter.get(chapter) || {
      chapter,
      total: 0,
      wrong: 0,
      unknown: 0,
      fakeMastery: 0,
      shallow: 0,
      uncertain: 0,
      slow: 0,
      types: {},
      clues: []
    };
    entry.total += 1;
    if (!item.isCorrect) entry.wrong += 1;
    if (item.clickedUnknown) entry.unknown += 1;
    if (item.wrongReason === "假掌握") entry.fakeMastery += 1;
    if (item.clickedFamiliarButUnsure || item.wrongReason === "浅层熟悉") entry.shallow += 1;
    if (item.confidence === "不确定") entry.uncertain += 1;
    if ((item.timeSpentSeconds || 0) >= 45) entry.slow += 1;
    entry.types[item.questionType] = (entry.types[item.questionType] || 0) + 1;
    const question = findQuestion(item.questionId);
    if (question) entry.clues.push(extractQuestionClue(question));
    byChapter.set(chapter, entry);
  });

  const topGaps = [...byChapter.values()]
    .map((item) => {
      const severity = item.unknown * 4 + item.wrong * 3 + item.fakeMastery * 3 + item.shallow * 2 + item.uncertain + item.slow;
      return {
        ...item,
        severity,
        mainCause: inferKnowledgeCause(item),
        nextAction: inferKnowledgeAction(item),
        clues: unique(item.clues).slice(0, 5),
        types: Object.entries(item.types)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => `${TYPE_LABELS[type] || type}${count}`)
          .join(" / ")
      };
    })
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 5);
  const typeGaps = buildTypeLayerGaps(questionResults);

  const totals = {
    totalQuestions: questionResults.length,
    correctCount: questionResults.filter((item) => item.isCorrect).length,
    wrongCount: questionResults.filter((item) => !item.isCorrect).length,
    correctRate: questionResults.length ? Math.round((questionResults.filter((item) => item.isCorrect).length / questionResults.length) * 100) : 0,
    riskCount: riskItems.length,
    unknownCount: questionResults.filter((item) => item.clickedUnknown).length,
    fakeMasteryCount: questionResults.filter((item) => item.wrongReason === "假掌握").length,
    shallowCount: questionResults.filter((item) => item.clickedFamiliarButUnsure || item.wrongReason === "浅层熟悉").length,
    paceCount: questionResults.filter((item) => item.unanswered || item.wrongReason === "考试节奏问题").length,
    slowCount: questionResults.filter((item) => (item.timeSpentSeconds || 0) >= 45).length
  };
  const learningState = classifyLearningState(totals, topGaps, typeGaps);

  return {
    summary: buildKnowledgeSummary(totals, topGaps),
    totals,
    learningState,
    layers: buildLearningLayers(totals, topGaps, typeGaps, learningState),
    topGaps,
    typeGaps,
    nextRoundPlan: buildNextRoundPlan(totals, topGaps)
  };
}

function buildTypeLayerGaps(questionResults) {
  const byType = new Map();
  questionResults.forEach((item) => {
    const type = item.questionType || "unknown";
    const entry = byType.get(type) || {
      type,
      total: 0,
      risk: 0,
      wrong: 0,
      unknown: 0,
      fakeMastery: 0,
      shallow: 0,
      slow: 0
    };
    entry.total += 1;
    if (!item.isCorrect || item.clickedUnknown || item.clickedFamiliarButUnsure || item.confidence !== "确定" || (item.timeSpentSeconds || 0) >= 45) entry.risk += 1;
    if (!item.isCorrect) entry.wrong += 1;
    if (item.clickedUnknown) entry.unknown += 1;
    if (item.wrongReason === "假掌握") entry.fakeMastery += 1;
    if (item.clickedFamiliarButUnsure || item.wrongReason === "浅层熟悉") entry.shallow += 1;
    if ((item.timeSpentSeconds || 0) >= 45) entry.slow += 1;
    byType.set(type, entry);
  });
  return [...byType.values()]
    .map((item) => ({
      ...item,
      label: TYPE_LABELS[item.type] || item.type,
      riskCount: item.risk,
      riskRate: item.total ? Math.round((item.risk / item.total) * 100) : 0
    }))
    .sort((a, b) => b.riskRate - a.riskRate || b.riskCount - a.riskCount);
}

function classifyLearningState(totals, topGaps, typeGaps) {
  const topChapter = topGaps[0];
  const topType = typeGaps[0];
  const unknownRate = totals.totalQuestions ? totals.unknownCount / totals.totalQuestions : 0;

  if (!totals.totalQuestions) {
    return makeLearningState("L0", "暂无诊断", "还没有本次考试数据。", "先做题眼背题");
  }
  if (totals.correctRate < 30 && (unknownRate >= 0.35 || totals.unknownCount >= 8)) {
    return makeLearningState("L4", "整门底层没铺开", "不是某一道题的问题，当前更像整门课还没形成基本题感。", "题眼背题");
  }
  if (topChapter && (topChapter.unknown >= 3 || topChapter.wrong >= 5)) {
    return makeLearningState("L3", "章节底层断层", `${topChapter.chapter} 这一块集中暴露，不是单题问题。`, "按章节题眼背题");
  }
  if (topType && topType.total >= 4 && topType.riskRate >= 60) {
    return makeLearningState("L2", "题型/同类题没掌握", `${topType.label} 风险率 ${topType.riskRate}%，说明同类题识别路径不稳。`, "同类题连刷");
  }
  if (totals.fakeMasteryCount >= 2) {
    return makeLearningState("L2", "假掌握偏多", "你以为确定但答错，说明记忆线索和真实答案对不上。", "错题重练");
  }
  if (totals.shallowCount >= 2) {
    return makeLearningState("L1", "浅层熟悉偏多", "题目眼熟，但题眼到答案的通路还没压实。", "浅层修复训练");
  }
  if (totals.wrongCount <= 3 && totals.unknownCount === 0 && totals.correctRate >= 70) {
    return makeLearningState("L1", "单题错漏", "主要是个别题没记牢，可以用错题重练解决。", "错题重练");
  }
  if (totals.correctRate >= 80 && totals.riskCount <= 3) {
    return makeLearningState("L0", "基本可模拟", "这轮整体可用，下一步适合限时模拟巩固。", "模拟考试");
  }
  return makeLearningState("L2", "混合薄弱", "有错题、浅层熟悉或节奏问题混在一起，需要先分层压题。", "题眼背题 + 错题重练");
}

function makeLearningState(level, name, description, recommendedMode) {
  return { level, name, description, recommendedMode };
}

function buildLearningLayers(totals, topGaps, typeGaps, learningState) {
  const topChapter = topGaps[0];
  const topType = typeGaps[0];
  const wholeCourseRisk = totals.correctRate < 30 || totals.unknownCount >= 8;
  return [
    {
      level: "L1",
      name: "单题层",
      status: learningState.level === "L1" ? "当前重点" : totals.wrongCount ? "有暴露" : "暂稳",
      evidence: `${totals.wrongCount} 题错/不会，${totals.fakeMasteryCount} 题假掌握`,
      action: "错题重练，背“题眼 → 答案”。"
    },
    {
      level: "L2",
      name: "同类/题型层",
      status: learningState.level === "L2" ? "当前重点" : topType?.riskRate >= 50 ? "有风险" : "暂稳",
      evidence: topType ? `${topType.label}：${topType.wrong}/${topType.total} 错，风险率 ${topType.riskRate}%` : "暂无题型风险",
      action: "同类题连续刷，直到看到题型能直接出判断路径。"
    },
    {
      level: "L3",
      name: "章节层",
      status: learningState.level === "L3" ? "当前重点" : topChapter?.severity >= 8 ? "有风险" : "暂稳",
      evidence: topChapter ? `${topChapter.chapter}：${topChapter.wrong} 错，${topChapter.unknown} 题不会` : "暂无集中章节缺口",
      action: "只刷这一章的题眼，不展开做长笔记。"
    },
    {
      level: "L4",
      name: "整门底层",
      status: learningState.level === "L4" ? "当前重点" : wholeCourseRisk ? "有风险" : "暂稳",
      evidence: `正确率 ${totals.correctRate}%，直接不会 ${totals.unknownCount} 题`,
      action: "先题眼背题，不做完整模拟。"
    }
  ];
}

function inferKnowledgeCause(item) {
  if (item.unknown >= Math.max(2, item.fakeMastery + item.shallow)) return "底层没学过";
  if (item.fakeMastery >= 2) return "假掌握";
  if (item.shallow >= 2 || item.uncertain >= 2) return "浅层熟悉";
  if (item.slow >= 2) return "反应慢";
  return "局部薄弱";
}

function inferKnowledgeAction(item) {
  const cause = inferKnowledgeCause(item);
  if (cause === "底层没学过") return "先题眼背题，不要直接模拟。";
  if (cause === "假掌握") return "做错题重练，强制写出为什么原答案错。";
  if (cause === "浅层熟悉") return "做浅层修复训练：题眼、考点、干扰项分开练。";
  if (cause === "反应慢") return "同类题连续刷 5 题，把识别时间压到 30 秒内。";
  return "补 10 题同章题，记录题眼到答案。";
}

function buildKnowledgeSummary(totals, topGaps) {
  if (!totals.riskCount) return "本次没有明显底层风险，下一步可以做限时模拟。";
  const lead = topGaps[0]?.chapter ? `最先补 ${topGaps[0].chapter}` : "先补本次错题";
  const parts = [];
  if (totals.unknownCount) parts.push(`${totals.unknownCount} 题直接不会`);
  if (totals.fakeMasteryCount) parts.push(`${totals.fakeMasteryCount} 题假掌握`);
  if (totals.shallowCount) parts.push(`${totals.shallowCount} 题浅层熟悉`);
  if (totals.paceCount) parts.push(`${totals.paceCount} 题节奏问题`);
  return `${lead}；本次暴露：${parts.join("，") || "局部薄弱"}。`;
}

function buildNextRoundPlan(totals, topGaps) {
  const chapters = topGaps.slice(0, 3).map((item) => item.chapter).join("、") || "本次错题章节";
  if (totals.unknownCount >= 3) return `下一轮先做“题眼背题”20 题，优先章节：${chapters}。`;
  if (totals.fakeMasteryCount >= 2) return `下一轮先做“错题重练”，每题说出错因，优先章节：${chapters}。`;
  if (totals.shallowCount >= 2) return `下一轮做“浅层修复训练”，只练题眼和干扰项，优先章节：${chapters}。`;
  if (totals.paceCount >= 2 || totals.slowCount >= 4) return "下一轮做 15 分钟小测，目标是先做会做的题，卡住就点“我不会”。";
  return `下一轮补 10 题同章题，优先章节：${chapters}。`;
}

function buildLlmAnalysisPayload(record, questionResults, knowledgeAnalysis) {
  return {
    role: "learning_diagnosis_coach",
    task: "根据一次模拟考试记录，诊断学习者的底层知识缺口，并生成下一轮刷题计划。",
    learnerPreference: "题库驱动、反复见题、少笔记、重题眼和错题压缩",
    course: record.courseName,
    exam: {
      id: record.id,
      mode: record.mode,
      score: record.score,
      totalQuestions: record.totalQuestions,
      correctCount: record.correctCount,
      wrongCount: record.wrongCount,
      unknownCount: record.unknownCount,
      durationSeconds: record.durationSeconds
    },
    localAnalysis: knowledgeAnalysis,
    diagnosticScale: {
      L1: "单题没掌握",
      L2: "同类题/题型没掌握",
      L3: "章节没掌握",
      L4: "整门底层没铺开"
    },
    evidence: questionResults.map((item) => ({
      questionId: item.questionId,
      chapter: item.chapter,
      type: item.questionType,
      isCorrect: item.isCorrect,
      confidence: item.confidence,
      wrongReason: item.wrongReason,
      timeSpentSeconds: item.timeSpentSeconds,
      clue: findQuestion(item.questionId) ? extractQuestionClue(findQuestion(item.questionId)) : ""
    })),
    expectedOutput: {
      learnerState: ["判断用户属于 L1/L2/L3/L4 哪一类"],
      bottomKnowledgeGaps: ["按章节/知识点列出底层缺口"],
      nextPracticePlan: ["下一轮刷哪些题、刷多少、用什么模式"],
      memorizationHooks: ["题眼到答案的一句话钩子"],
      stopDoing: ["暂时不要做的低收益动作"]
    }
  };
}

function renderKnowledgeAnalysisPanel(analysis) {
  const layerRows = analysis.layers
    .map(
      (item) => `
        <li>
          <div>
            <strong>${escapeHtml(item.level)} ${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.evidence)}</span>
          </div>
          <em class="${item.status === "当前重点" ? "danger-text" : ""}">${escapeHtml(item.status)}｜${escapeHtml(item.action)}</em>
        </li>
      `
    )
    .join("");
  const rows = analysis.topGaps.length
    ? analysis.topGaps
        .map(
          (item) => `
            <li>
              <div>
                <strong>${escapeHtml(item.chapter)}</strong>
                <span>${escapeHtml(item.mainCause)}｜${escapeHtml(item.types || "综合")}｜题眼：${escapeHtml(item.clues.join("、") || "-")}</span>
              </div>
              <em>${escapeHtml(item.nextAction)}</em>
            </li>
          `
        )
        .join("")
    : "<li><span>暂无明显底层缺口</span></li>";
  return `
    <div class="panel wide">
      <div class="section-title">
        <h2>底层知识层分析</h2>
        <span>${escapeHtml(analysis.learningState.level)}｜${escapeHtml(analysis.learningState.name)}</span>
      </div>
      <div class="state-card">
        <strong>${escapeHtml(analysis.learningState.name)}</strong>
        <span>${escapeHtml(analysis.learningState.description)}</span>
        <em>适合你下一步：${escapeHtml(analysis.learningState.recommendedMode)}</em>
      </div>
      <div class="hint-box">
        <strong>${escapeHtml(analysis.summary)}</strong>
        <p>${escapeHtml(analysis.nextRoundPlan)}</p>
      </div>
      <ul class="model-list knowledge-list layer-list">${layerRows}</ul>
      <ul class="model-list knowledge-list">${rows}</ul>
    </div>
  `;
}

function reportList(title, items) {
  const rows = items.length
    ? items
        .slice(0, 12)
        .map((item) => {
          const question = findQuestion(item.questionId);
          const path = question ? buildReasoningPath(question) : null;
          const similar = question ? recommendSimilarQuestions(question, 3) : [];
          return `
            <li class="result-card">
              <div class="result-summary">
                <strong>${escapeHtml(item.questionId)}</strong>
                <span>${escapeHtml(item.chapter)}｜${escapeHtml(TYPE_LABELS[item.questionType])}｜${escapeHtml(item.wrongReason || "答对但不确定")}</span>
              </div>
              ${path ? renderReasoningPath(path, question, item) : ""}
              ${renderSimilarQuestions(similar)}
            </li>
          `;
        })
        .join("")
    : "<li><span>暂无</span></li>";
  return `
    <div class="panel">
      <div class="section-title">
        <h2>${escapeHtml(title)}</h2>
        <span>${items.length}</span>
      </div>
      <ul class="result-list">${rows}</ul>
    </div>
  `;
}

function startActiveRecall(questionIds = buildActiveRecallQuestionIds(state.activeCourseId)) {
  const items = unique(questionIds)
    .map((id) => findQuestionForCourse(state.activeCourseId, id))
    .filter(Boolean)
    .filter(isStudyQuestion)
    .slice(0, 12)
    .map((question) => ({
      question,
      recallText: "",
      revealed: false,
      tag: ""
    }));

  if (!items.length) {
    alert("当前课程暂无可复述题。先导入题库，或完成未学补基础/错题重练后再复述。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.guided = null;
  state.instantDrill = null;
  state.study = {
    courseId: state.activeCourseId,
    mode: "recall",
    title: "闭卷复述",
    items,
    currentIndex: 0
  };
  renderActiveRecall();
}

function startMicroReview(limit = 1) {
  const questionIds = buildMicroReviewQuestionIds(state.activeCourseId).slice(0, limit);
  startActiveRecall(questionIds);
  if (state.study) {
    state.study.mode = "micro";
    state.study.title = limit === 1 ? "1题启动" : "12分钟小复习";
    state.study.targetMinutes = limit === 1 ? 3 : 12;
    renderActiveRecall();
  }
}

function renderActiveRecall() {
  const study = state.study;
  if (study.currentIndex >= study.items.length) {
    renderActiveRecallComplete();
    return;
  }

  const item = study.items[study.currentIndex];
  const question = item.question;
  const path = buildReasoningPath(question);

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitRecall")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">${study.mode === "micro" ? "低能量模式" : "主动回忆"}</p>
        <h1>${escapeHtml(study.title)}</h1>
      </div>
      <div class="exam-stats">
        <span>当前 ${study.currentIndex + 1}/${study.items.length}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
        <span>下次：${escapeHtml(formatReviewDue(getQuestionMastery(study.courseId, question.id)?.nextReviewAt))}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="hint-box">
        <strong>${study.mode === "micro" ? "只守住这一题" : "先闭卷复述"}</strong>
        <p>${study.mode === "micro" ? "写一个关键词也算完成。目标不是学完，是让系统记录状态并把下一步排出来。" : "不要先看答案。先写：概念是什么、容易和谁混、题目会怎么问、上机可能怎么用。"}</p>
      </div>
      <textarea id="recallText" class="recall-input" rows="6" ${item.revealed ? "disabled" : ""} placeholder="在这里写你的闭卷复述，或口头说完后写关键词。">${escapeHtml(item.recallText)}</textarea>
      ${
        item.revealed
          ? `
            <div class="feedback correct">
              <strong>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</strong>
              <p>${escapeHtml(question.explanation || "暂无解析")}</p>
            </div>
            ${renderMemoryMap(question, path)}
            ${renderReasoningPath(path, question)}
            ${renderRecallTagPicker(item.tag)}
          `
          : ""
      }
    </article>

    <footer class="exam-actions study-actions">
      ${
        item.revealed
          ? '<button id="saveRecall" class="primary">保存标签，下一题</button>'
          : '<button id="revealRecall" class="primary">显示答案并打标签</button>'
      }
    </footer>
  `;

  document.getElementById("exitRecall").addEventListener("click", renderDashboard);
  if (item.revealed) {
    app.querySelectorAll(".recall-tag").forEach((button) => {
      button.addEventListener("click", () => {
        item.tag = button.dataset.tag;
        renderActiveRecall();
      });
    });
    document.getElementById("saveRecall").addEventListener("click", advanceActiveRecall);
  } else {
    document.getElementById("revealRecall").addEventListener("click", () => {
      item.recallText = document.getElementById("recallText").value.trim();
      item.revealed = true;
      renderActiveRecall();
    });
  }
}

function renderRecallTagPicker(selectedTag) {
  return `
    <div class="reason-panel">
      <p>给这题打一个考试标签，系统会自动安排下次复习。</p>
      <div>
        ${RECALL_TAGS.map((tag) => `<button class="recall-tag ${selectedTag === tag ? "selected" : ""}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
      </div>
    </div>
  `;
}

function advanceActiveRecall() {
  const study = state.study;
  const item = study.items[study.currentIndex];
  if (!item.tag) {
    alert("先打一个标签，再进入下一题。");
    return;
  }
  saveActiveRecallOutcome(item);
  study.currentIndex += 1;
  renderActiveRecall();
}

function renderActiveRecallComplete() {
  const remaining = buildActiveRecallQuestionIds(state.study?.courseId || state.activeCourseId).length;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">闭卷复述完成</p>
      <h1>这一轮压实了</h1>
      <p>标签和下次复习日期已写入。当前课程还有 ${remaining} 题可复述。</p>
      <div class="topbar-actions">
        <button id="backHome" class="primary">回首页</button>
        <button id="recallAgain" ${remaining ? "" : "disabled"}>继续复述</button>
      </div>
    </section>
  `;
  document.getElementById("backHome").addEventListener("click", renderDashboard);
  document.getElementById("recallAgain").addEventListener("click", () => startActiveRecall());
}

function saveActiveRecallOutcome(item) {
  const courseId = state.study?.courseId || state.activeCourseId;
  const now = new Date().toISOString();
  const status = recallTagToStatus(item.tag);
  const result = {
    courseId,
    questionId: item.question.id,
    isCorrect: ["#会了", "#上机"].includes(item.tag),
    clickedFamiliarButUnsure: ["#半会", "#下一秒忘"].includes(item.tag),
    confidence: item.tag,
    statusOverride: status,
    unanswered: false
  };
  const key = getQuestionStorageKey(courseId, item.question.id, state.mastery);
  const current = state.mastery[key] || {};
  const nextMastery = buildNextMastery(current, result, now);
  state.mastery = {
    ...state.mastery,
    [key]: {
      ...nextMastery,
      tags: unique([...(nextMastery.tags || []), item.tag]),
      lastRecallText: item.recallText,
      nextReviewAt: calculateNextReviewAt(item.tag, now),
      recallCount: (nextMastery.recallCount || 0) + 1,
      recallHistory: [
        ...(nextMastery.recallHistory || []),
        { tag: item.tag, recallText: item.recallText, createdAt: now }
      ].slice(-8)
    }
  };
  saveMastery(state.mastery);

  if (["#不会", "#概念混淆", "#下一秒忘"].includes(item.tag)) {
    updateWrongPoolFromPractice(item.question.id, false, item.tag.replace("#", ""));
  } else if (item.tag === "#会了") {
    removeQuestionFromWrongPool(courseId, item.question.id);
  }

  logLearningEvent("active_recall", {
    courseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    tag: item.tag,
    nextReviewAt: state.mastery[key].nextReviewAt
  });
}

function getActiveDrillCourseId() {
  return state.instantDrill?.courseId || state.guided?.courseId || state.activeCourseId;
}

function buildInstantDrillEligibleQuestions() {
  return getEligibleQuestions().filter(
    (question) =>
      ["single", "multiple", "judge"].includes(question.type) &&
      Array.isArray(question.options) &&
      question.options.length >= 2
  );
}

function createInstantDrillItem(question) {
  return {
    question,
    answer: [],
    submitted: false,
    revealed: false,
    isCorrect: false,
    wasUnknown: false,
    marked: false,
    clickedFamiliar: false,
    remembered: null
  };
}

function getTodayInstantDrillSummary(courseId) {
  const today = getLocalDateKey();
  const events = getCourseBehaviorEvents(courseId).filter(
    (event) => isEventOnLocalDate(event, today) && event.phase === "instant"
  );
  return {
    attempted: events.length,
    correct: events.filter((event) => event.type === "guided_quiz_correct").length,
    unknown: events.filter((event) => event.type === "guided_unknown").length
  };
}

function canStartGuidedPractice(courseId = state.activeCourseId) {
  const bank = getCourseBank(courseId);
  const buildGuidedRound = window.GuidedPractice?.buildGuidedRound;
  if (typeof buildGuidedRound !== "function") {
    return false;
  }
  const round = buildGuidedRound({
    courseId,
    questions: bank.questions || [],
    masteryItems: Object.values(state.mastery),
    wrongPoolItems: Object.values(state.wrongPool),
    full: true
  });
  return Boolean(round.learnQuestionIds?.length && round.quizQuestionIds?.length);
}

function getTodayGuidedPracticeSummary(courseId) {
  const today = getLocalDateKey();
  const events = getCourseBehaviorEvents(courseId).filter(
    (event) => isEventOnLocalDate(event, today) && (event.phase === "learn" || event.phase === "quiz")
  );
  const recallWrongEvents = events.filter((event) => event.type === "guided_recall_wrong");

  return {
    viewed: events.filter((event) => event.type === "guided_learn_view").length,
    recallAttempted: events.filter((event) => event.type === "guided_reveal").length,
    recallCorrect: events.filter((event) => event.type === "guided_recall_correct").length,
    recallWrong: recallWrongEvents.length,
    recallFailed: recallWrongEvents.filter((event) => event.reason === "没记住" || !event.reason).length,
    recallGaveUp: recallWrongEvents.filter((event) => event.reason === "不会，查看答案题眼").length,
    quizCorrect: events.filter((event) => event.type === "guided_quiz_correct").length,
    quizWrong: events.filter((event) => event.type === "guided_quiz_wrong").length,
    quizUnknown: events.filter((event) => event.type === "guided_unknown").length
  };
}

function getTodayGuidedMissedQuestions(courseId, kinds = ["recallFailed", "recallGaveUp", "quizMiss"]) {
  const today = getLocalDateKey();
  const allowed = new Set(kinds);
  const events = getCourseBehaviorEvents(courseId).filter(
    (event) => isEventOnLocalDate(event, today) && (event.phase === "learn" || event.phase === "quiz")
  );
  const missed = new Map();

  events.forEach((event) => {
    let kind = "";
    if (event.type === "guided_recall_wrong") {
      kind = event.reason === "不会，查看答案题眼" ? "recallGaveUp" : "recallFailed";
    } else if (event.type === "guided_quiz_wrong" || event.type === "guided_unknown") {
      kind = "quizMiss";
    }
    if (!kind || !allowed.has(kind) || !event.questionId) {
      return;
    }
    const existing = missed.get(event.questionId);
    if (!existing || Date.parse(event.createdAt) > Date.parse(existing.lastAt)) {
      missed.set(event.questionId, {
        questionId: event.questionId,
        kind,
        reason: event.reason || "",
        chapter: event.chapter || "",
        lastAt: event.createdAt
      });
    }
  });

  return [...missed.values()]
    .map((entry) => ({
      ...entry,
      question: findQuestionForCourse(courseId, entry.questionId)
    }))
    .filter((entry) => entry.question)
    .sort((left, right) => Date.parse(right.lastAt) - Date.parse(left.lastAt));
}

function renderGuidedMissKindLabel(kind) {
  return (
    {
      recallFailed: "看了还错",
      recallGaveUp: "直接不会",
      quizMiss: "小测错"
    }[kind] || kind
  );
}

function renderTodayGuidedMissList(courseId) {
  const recallMisses = getTodayGuidedMissedQuestions(courseId, ["recallFailed"]);
  const allMisses = getTodayGuidedMissedQuestions(courseId);
  if (!allMisses.length) {
    return "";
  }

  const rows = allMisses
    .map((entry) => {
      const question = entry.question;
      const preview = String(question.question || "").replace(/\s+/g, " ").slice(0, 42);
      return `
        <li>
          <span class="guided-miss-kind">${escapeHtml(renderGuidedMissKindLabel(entry.kind))}</span>
          <strong>${escapeHtml(entry.questionId)}</strong>
          <span>${escapeHtml(entry.chapter || question.chapter || "")}</span>
          <span>${escapeHtml(preview)}${preview.length >= 42 ? "…" : ""}</span>
        </li>
      `;
    })
    .join("");

  return `
    <details class="guided-miss-list">
      <summary>今日错题 ${allMisses.length} 题（看了还错 ${recallMisses.length}）</summary>
      <ul class="guided-miss-items">${rows}</ul>
      <div class="guided-miss-actions">
        ${
          recallMisses.length
            ? `<button type="button" class="secondary" data-guided-miss-retry="recallFailed">专攻看了还错（${recallMisses.length}）</button>`
            : ""
        }
        <button type="button" class="secondary" data-guided-miss-retry="all">专攻全部今日错题（${allMisses.length}）</button>
      </div>
    </details>
  `;
}

function bindGuidedMissPanel(courseId) {
  document.querySelectorAll("[data-guided-miss-retry]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.guidedMissRetry;
      const kinds = mode === "recallFailed" ? ["recallFailed"] : ["recallFailed", "recallGaveUp", "quizMiss"];
      const questionIds = getTodayGuidedMissedQuestions(courseId, kinds).map((entry) => entry.questionId);
      if (!questionIds.length) {
        alert("今天还没有可重练的错题。");
        return;
      }
      if (courseId !== state.activeCourseId) {
        state.activeCourseId = courseId;
        saveActiveCourseId(courseId);
        syncActiveCourseBank();
      }
      startGuidedPracticeWithChoice(questionIds);
    });
  });
}

function formatGuidedPracticeSummary(summary) {
  if (!summary || (!summary.viewed && !summary.recallAttempted && !summary.quizCorrect && !summary.quizWrong)) {
    return "";
  }
  return `答案先行：遮住答对 ${summary.recallCorrect}｜看了还错 ${summary.recallFailed}｜直接不会 ${summary.recallGaveUp}｜小测对 ${summary.quizCorrect}｜小测错 ${summary.quizWrong + summary.quizUnknown}`;
}

function renderGuidedSessionStats(guided) {
  const today = getTodayGuidedPracticeSummary(guided.courseId);
  const sessionFailed = guided.learnedWrongCount || 0;
  const sessionQuizMiss = (guided.quizWrongCount || 0) + (guided.unknownCount || 0);
  return `
    <span>本局遮住答对 ${guided.learnedCorrectCount || 0}｜看了还错 ${sessionFailed}</span>
    <span>本日遮住答对 ${today.recallCorrect}｜看了还错 ${today.recallFailed}</span>
    <span>小测本局错 ${sessionQuizMiss}｜本日错 ${today.quizWrong + today.quizUnknown}</span>
  `;
}

function renderGuidedPracticeStartPanel(course) {
  const summary = getTodayGuidedPracticeSummary(course.id);
  const summaryText = formatGuidedPracticeSummary(summary) || "本日还没有记题记录。先看答案和题眼，再遮住自己答。";

  return `
    <section class="panel wide guided-start">
      <div>
        <p class="eyebrow">考前抢救 · 答案先行</p>
        <h2>先看答案，再遮住自己答</h2>
        <p>默认每组 ${GUIDED_BATCH_SIZE} 题：看答案和题眼 → 遮住自己答 → 同组小测。全题库模式在「我非要换方式」里。</p>
      </div>
      <div class="guided-start-summary">${escapeHtml(summaryText)}</div>
    </section>
  `;
}

function renderInstantDrillStartPanel(course) {
  const summary = getTodayInstantDrillSummary(course.id);
  const summaryText = summary.attempted
    ? `本日已刷 ${summary.attempted} 题｜对 ${summary.correct}｜不会 ${summary.unknown}`
    : "本日还没有刷题记录";

  return `
    <section class="panel wide guided-start">
      <div>
        <p class="eyebrow">即时刷题</p>
        <h2>选完立刻看答案</h2>
        <p>闭卷作答，选完马上看题眼；可标记不确定、眼熟但不会，并做同类题迁移。</p>
      </div>
      <div class="guided-start-summary">${escapeHtml(summaryText)}</div>
    </section>
  `;
}

function startInstantDrill() {
  const activeCourse = getActiveCourse();
  const questions = shuffle(buildInstantDrillEligibleQuestions());
  if (!questions.length) {
    alert("当前课程暂无可刷题目。可以先导入题库。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.study = null;
  state.guided = null;
  state.instantDrill = {
    courseId: activeCourse.id,
    items: questions.map(createInstantDrillItem),
    currentIndex: 0,
    attemptedCount: 0,
    correctCount: 0,
    unknownCount: 0,
    assist: null,
    startedAt: new Date().toISOString()
  };
  renderInstantDrill();
}

function renderInstantDrill() {
  const drill = state.instantDrill;
  if (!drill) {
    renderDashboard();
    return;
  }
  if (drill.assist) {
    renderInstantDrillAssist();
    return;
  }

  const item = drill.items[drill.currentIndex];
  if (!item) {
    exitInstantDrill();
    return;
  }

  const course = getCourseById(drill.courseId);
  const question = item.question;
  const path = buildReasoningPath(question);
  const revealResult = item.revealed;
  const isMultiple = question.type === "multiple";
  const similarQuestions = revealResult ? recommendSimilarQuestions(question, 3) : [];
  const needsRemember = revealResult && item.remembered === null;

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitInstantDrill")}
      <div class="exam-header-main">
      <div><h1>${escapeHtml(course.name)}</h1></div>
      <div class="exam-stats">
        <span>即时刷题</span>
        <span>本题 ${drill.currentIndex + 1}/${drill.items.length}</span>
        <span>已对 ${drill.correctCount}</span>
        <span>不会 ${drill.unknownCount}</span>
        ${item.marked ? "<span>已标记不确定</span>" : ""}
        ${item.clickedFamiliar ? "<span>眼熟但不会</span>" : ""}
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="options">${renderGuidedOptions(item, question, revealResult)}</div>
      ${
        revealResult
          ? `
            <div class="feedback ${item.wasUnknown ? "wrong" : item.isCorrect ? "correct" : "wrong"}">
              <strong>${item.wasUnknown ? "这题先记为不会" : item.isCorrect ? "答对了" : "答错了"}</strong>
              <p>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</p>
              <p>题眼：${escapeHtml(path.keyClue)}</p>
              <p>下次判断：${escapeHtml(path.nextTimeRule)}</p>
            </div>
            ${renderSimilarQuestions(similarQuestions)}
            ${
              needsRemember
                ? `
                  <div class="hint-box">
                    <strong>看完答案后，这题你记住了吗？</strong>
                    <p>诚实选一次，系统才知道下一轮该继续推同类题，还是放回未学池。</p>
                  </div>
                `
                : ""
            }
          `
          : ""
      }
    </article>

    <footer class="exam-actions study-actions">
      ${
        needsRemember
          ? `
            <button id="instantDrillForgot" class="warning">仍没记住</button>
            <button id="instantDrillRemembered" class="primary">我记住了</button>
          `
          : revealResult
            ? '<button id="nextInstantDrill" class="primary">下一题</button>'
            : `
              <button id="instantDrillUnknown" class="warning">我不会</button>
              <button id="instantDrillMark" class="${item.marked ? "warning" : ""}">标记不确定</button>
              <button id="instantDrillFamiliar" class="${item.clickedFamiliar ? "warning" : ""}">眼熟但不会</button>
              ${isMultiple ? '<button id="submitInstantDrill" class="primary">确认</button>' : ""}
            `
      }
    </footer>
  `;

  document.getElementById("exitInstantDrill").addEventListener("click", exitInstantDrill);
  if (needsRemember) {
    document.getElementById("instantDrillRemembered").addEventListener("click", () => saveInstantDrillRemembered(true));
    document.getElementById("instantDrillForgot").addEventListener("click", () => saveInstantDrillRemembered(false));
    return;
  }
  if (revealResult) {
    document.getElementById("nextInstantDrill").addEventListener("click", advanceInstantDrill);
    return;
  }
  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectInstantDrillAnswer(item, question, button.dataset.key));
  });
  document.getElementById("instantDrillUnknown")?.addEventListener("click", revealInstantDrillUnknown);
  document.getElementById("instantDrillMark")?.addEventListener("click", toggleInstantDrillMark);
  document.getElementById("instantDrillFamiliar")?.addEventListener("click", startInstantDrillAssist);
  document.getElementById("submitInstantDrill")?.addEventListener("click", submitInstantDrillAnswer);
}

function selectInstantDrillAnswer(item, question, key) {
  if (item.revealed) {
    return;
  }
  if (question.type === "multiple") {
    item.answer = item.answer.includes(key) ? item.answer.filter((value) => value !== key) : sortAnswer([...item.answer, key]);
    renderInstantDrill();
    return;
  }
  item.answer = [key];
  submitInstantDrillAnswer();
}

function toggleInstantDrillMark() {
  const item = state.instantDrill.items[state.instantDrill.currentIndex];
  item.marked = !item.marked;
  renderInstantDrill();
}

function startInstantDrillAssist() {
  const drill = state.instantDrill;
  const item = drill.items[drill.currentIndex];
  if (item.revealed) {
    return;
  }
  item.clickedFamiliar = true;
  drill.assist = {
    questionId: item.question.id,
    step: 0,
    clueChoice: "",
    conceptChoice: "",
    eliminationChoice: "",
    finalAnswer: [...item.answer]
  };
  renderInstantDrill();
}

function renderInstantDrillAssist() {
  const drill = state.instantDrill;
  const assist = drill.assist;
  const item = drill.items[drill.currentIndex];
  const question = item.question;
  const steps = ["找题眼", "定位考点", "排除干扰项", "重新作答"];
  const stepTitle = steps[assist.step] || "重新作答";

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header">
      <div>
        <p class="eyebrow">眼熟但不会</p>
        <h1>${escapeHtml(stepTitle)}</h1>
      </div>
      <div class="exam-stats">
        <span>即时刷题</span>
        <span>第 ${assist.step + 1} / 4 步</span>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      ${renderAssistStep(question, assist)}
    </article>

    <footer class="exam-actions">
      <button id="cancelInstantAssist">回到本题</button>
      <button id="nextInstantAssist" class="primary">${assist.step === 3 ? "提交并看答案" : "下一步"}</button>
    </footer>
  `;

  app.querySelectorAll(".assist-choice").forEach((button) => {
    button.addEventListener("click", () => {
      assist[button.dataset.field] = button.dataset.value;
      renderInstantDrill();
    });
  });
  app.querySelectorAll(".assist-answer").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.key;
      if (question.type === "multiple") {
        assist.finalAnswer = assist.finalAnswer.includes(key)
          ? assist.finalAnswer.filter((value) => value !== key)
          : sortAnswer([...assist.finalAnswer, key]);
      } else {
        assist.finalAnswer = [key];
      }
      renderInstantDrill();
    });
  });
  document.getElementById("cancelInstantAssist").addEventListener("click", () => {
    drill.assist = null;
    renderInstantDrill();
  });
  document.getElementById("nextInstantAssist").addEventListener("click", advanceInstantDrillAssist);
}

function advanceInstantDrillAssist() {
  const drill = state.instantDrill;
  const assist = drill.assist;
  const item = drill.items[drill.currentIndex];
  const question = item.question;

  if (assist.step === 0 && !assist.clueChoice) {
    alert("先选一个题眼。");
    return;
  }
  if (assist.step === 1 && !assist.conceptChoice) {
    alert("先定位一个考点。");
    return;
  }
  if (assist.step === 2 && !assist.eliminationChoice) {
    alert("先选一个干扰项。");
    return;
  }
  if (assist.step < 3) {
    assist.step += 1;
    renderInstantDrill();
    return;
  }
  if (!assist.finalAnswer.length) {
    alert("请重新作答后再提交。");
    return;
  }

  item.answer = sortAnswer(assist.finalAnswer);
  item.clickedFamiliar = true;
  drill.assist = null;
  submitInstantDrillAnswer();
}

function submitInstantDrillAnswer() {
  const drill = state.instantDrill;
  const item = drill.items[drill.currentIndex];
  if (!item.answer.length) {
    alert("请先选择答案。");
    return;
  }

  item.submitted = true;
  item.revealed = true;
  item.isCorrect = sameAnswer(item.answer, item.question.answer);
  drill.attemptedCount += 1;
  if (item.isCorrect) {
    drill.correctCount += 1;
    logGuidedEvent("guided_quiz_correct", item.question, "instant", {
      marked: item.marked,
      clickedFamiliar: item.clickedFamiliar
    });
  } else {
    logGuidedEvent("guided_quiz_wrong", item.question, "instant", {
      marked: item.marked,
      clickedFamiliar: item.clickedFamiliar
    });
  }
  renderInstantDrill();
}

function revealInstantDrillUnknown() {
  const drill = state.instantDrill;
  const item = drill.items[drill.currentIndex];
  item.wasUnknown = true;
  item.revealed = true;
  item.isCorrect = false;
  item.answer = [];
  drill.attemptedCount += 1;
  drill.unknownCount += 1;
  logGuidedEvent("guided_unknown", item.question, "instant", { marked: item.marked });
  renderInstantDrill();
}

function saveInstantDrillRemembered(remembered) {
  const drill = state.instantDrill;
  const item = drill.items[drill.currentIndex];
  item.remembered = remembered;

  saveGuidedMastery(item.question, {
    isCorrect: remembered && (item.isCorrect || item.wasUnknown),
    clickedFamiliarButUnsure: item.clickedFamiliar,
    confidence: item.wasUnknown ? "我不会" : item.marked ? "不确定" : remembered ? "确定" : "不确定",
    statusOverride: remembered ? "基本掌握" : item.wasUnknown ? "未学" : item.isCorrect ? "秒忘" : "概念混淆",
    unanswered: false
  });

  if (remembered) {
    updateWrongPoolFromPractice(item.question.id, true);
    logLearningEvent("instant_drill_remembered", {
      courseId: drill.courseId,
      questionId: item.question.id,
      chapter: item.question.chapter,
      questionType: item.question.type,
      phase: "instant",
      wasUnknown: item.wasUnknown,
      answeredCorrectly: item.isCorrect
    });
    advanceInstantDrill();
    return;
  }

  updateWrongPoolFromPractice(item.question.id, false, item.wasUnknown ? "没学过" : item.isCorrect ? "下一秒忘" : "概念混淆");
  logLearningEvent("instant_drill_forgot", {
    courseId: drill.courseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    phase: "instant",
    wasUnknown: item.wasUnknown,
    answeredCorrectly: item.isCorrect
  });
  renderInstantDrill();
}

function advanceInstantDrill() {
  const drill = state.instantDrill;
  const item = drill.items[drill.currentIndex];
  if (item.remembered === null) {
    alert("先选择这题是记住了，还是没记住。");
    return;
  }
  drill.currentIndex += 1;
  if (drill.currentIndex >= drill.items.length) {
    const questions = shuffle(buildInstantDrillEligibleQuestions());
    drill.items = questions.map(createInstantDrillItem);
    drill.currentIndex = 0;
  }
  renderInstantDrill();
}

function exitInstantDrill() {
  const drill = state.instantDrill;
  if (!drill || !drill.attemptedCount) {
    state.instantDrill = null;
    renderDashboard();
    return;
  }
  renderInstantDrillSummary();
}

function renderInstantDrillSummary() {
  const drill = state.instantDrill;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">本次刷题结束</p>
      <h1>${escapeHtml(getCourseById(drill.courseId).name)}</h1>
      <p>刷了 ${drill.attemptedCount} 题</p>
      <p>答对 ${drill.correctCount} 题</p>
      <p>不会 ${drill.unknownCount} 题</p>
      <div class="topbar-actions">
        <button id="drillContinue" class="primary">继续刷题</button>
        <button id="drillHome">回首页</button>
      </div>
    </section>
  `;
  document.getElementById("drillContinue").addEventListener("click", renderInstantDrill);
  document.getElementById("drillHome").addEventListener("click", () => {
    state.instantDrill = null;
    renderDashboard();
  });
}

function getGuidedSessionKey(courseId, questionIds = null, sessionMode = "batch") {
  if (Array.isArray(questionIds) && questionIds.length) {
    return `${courseId}:${questionIds.slice().sort().join("|")}`;
  }
  if (sessionMode === "full") {
    return `${courseId}:full`;
  }
  return `${courseId}:batch`;
}

function getGuidedSessionKeyForGuided(guided) {
  if (!guided) {
    return "";
  }
  if (guided.sessionMode === "custom" && Array.isArray(guided.questionIds) && guided.questionIds.length) {
    return getGuidedSessionKey(guided.courseId, guided.questionIds);
  }
  return getGuidedSessionKey(guided.courseId, null, guided.sessionMode || "batch");
}

function loadGuidedProgressStore() {
  const store = readJson(STORAGE_KEYS.guidedProgress, {});
  return store && typeof store === "object" ? store : {};
}

function saveGuidedProgressStore(store) {
  localStorage.setItem(STORAGE_KEYS.guidedProgress, JSON.stringify(store));
  markLocalChanged();
}

function serializeGuidedSession(guided) {
  const learnQuestionIds = (guided.learnItems || []).map((item) => item.question.id);
  const quizQuestionIds = (guided.quizItems || []).map((item) => item.question.id);
  const learnState = {};
  const quizState = {};

  (guided.learnItems || []).forEach((item, index) => {
    const touched =
      index <= guided.currentIndex ||
      item.viewLogged ||
      item.answer?.length ||
      item.answerVisible === false;
    if (!touched) {
      return;
    }
    learnState[item.question.id] = {
      answerVisible: Boolean(item.answerVisible),
      answer: item.answer || [],
      viewLogged: Boolean(item.viewLogged)
    };
  });

  (guided.quizItems || []).forEach((item, index) => {
    const interleaved = shouldInterleaveGuided(guided);
    const touched =
      (interleaved
        ? (guided.step === "quiz" && index === guided.currentIndex) || index < guided.currentIndex
        : guided.phase === "quiz" && index <= guided.currentIndex) ||
      item.submitted ||
      item.revealed ||
      item.wasUnknown ||
      item.answer?.length;
    if (!touched) {
      return;
    }
    quizState[item.question.id] = {
      answer: item.answer || [],
      submitted: Boolean(item.submitted),
      revealed: Boolean(item.revealed),
      isCorrect: Boolean(item.isCorrect),
      wasUnknown: Boolean(item.wasUnknown)
    };
  });

  return {
    v: 2,
    id: guided.id,
    courseId: guided.courseId,
    questionIds: guided.questionIds || null,
    sessionMode: guided.sessionMode || "batch",
    batchSize: guided.batchSize || GUIDED_BATCH_SIZE,
    step: guided.step || "learn",
    interleave: guided.interleave !== false,
    phase: guided.phase,
    currentIndex: guided.currentIndex,
    learnedCorrectCount: guided.learnedCorrectCount || 0,
    learnedWrongCount: guided.learnedWrongCount || 0,
    quizCorrectCount: guided.quizCorrectCount || 0,
    quizWrongCount: guided.quizWrongCount || 0,
    unknownCount: guided.unknownCount || 0,
    startedAt: guided.startedAt,
    updatedAt: new Date().toISOString(),
    learnQuestionIds,
    quizQuestionIds,
    learnState,
    quizState
  };
}

function buildGuidedLearnItem(question, state = {}) {
  return {
    question,
    answerVisible: state.answerVisible !== undefined ? Boolean(state.answerVisible) : true,
    answer: state.answer || [],
    viewLogged: Boolean(state.viewLogged)
  };
}

function buildGuidedQuizItem(question, state = {}) {
  return {
    question,
    answer: state.answer || [],
    submitted: Boolean(state.submitted),
    revealed: Boolean(state.revealed),
    isCorrect: Boolean(state.isCorrect),
    wasUnknown: Boolean(state.wasUnknown)
  };
}

function hydrateGuidedSession(saved) {
  if (!saved || saved.phase === "complete") {
    return null;
  }
  const bank = getCourseBank(saved.courseId);
  const byId = new Map((bank.questions || []).map((question) => [question.id, question]));
  let learnQuestionIds = [];
  let quizQuestionIds = [];
  let learnState = {};
  let quizState = {};

  if (saved.v === 2 || saved.learnQuestionIds?.length) {
    learnQuestionIds = saved.learnQuestionIds || [];
    quizQuestionIds = saved.quizQuestionIds || [];
    learnState = saved.learnState || {};
    quizState = saved.quizState || {};
  } else {
    learnQuestionIds = (saved.learnItems || []).map((item) => item.questionId).filter(Boolean);
    quizQuestionIds = (saved.quizItems || []).map((item) => item.questionId).filter(Boolean);
    (saved.learnItems || []).forEach((item) => {
      if (!item.questionId) {
        return;
      }
      learnState[item.questionId] = {
        answerVisible: Boolean(item.answerVisible),
        answer: item.answer || [],
        viewLogged: Boolean(item.viewLogged)
      };
    });
    (saved.quizItems || []).forEach((item) => {
      if (!item.questionId) {
        return;
      }
      quizState[item.questionId] = {
        answer: item.answer || [],
        submitted: Boolean(item.submitted),
        revealed: Boolean(item.revealed),
        isCorrect: Boolean(item.isCorrect),
        wasUnknown: Boolean(item.wasUnknown)
      };
    });
  }

  const learnItems = learnQuestionIds
    .map((questionId) => {
      const question = byId.get(questionId);
      return question ? buildGuidedLearnItem(question, learnState[questionId]) : null;
    })
    .filter(Boolean);
  const quizItems = quizQuestionIds
    .map((questionId) => {
      const question = byId.get(questionId);
      return question ? buildGuidedQuizItem(question, quizState[questionId]) : null;
    })
    .filter(Boolean);

  if (!learnItems.length || !quizItems.length) {
    return null;
  }

  const sessionMode = saved.sessionMode || (saved.questionIds?.length ? "custom" : "batch");
  const interleave = sessionMode === "batch" && saved.interleave !== false;
  let currentIndex = Number.isFinite(Number(saved.currentIndex)) ? Number(saved.currentIndex) : 0;

  if (interleave) {
    if (currentIndex >= learnItems.length) {
      return null;
    }
    return {
      id: saved.id || makeExamId(),
      courseId: saved.courseId,
      questionIds: saved.questionIds || null,
      sessionMode,
      batchSize: saved.batchSize || GUIDED_BATCH_SIZE,
      step: saved.step === "quiz" ? "quiz" : "learn",
      interleave: true,
      phase: "learn",
      currentIndex,
      learnItems,
      quizItems,
      learnedCorrectCount: saved.learnedCorrectCount || 0,
      learnedWrongCount: saved.learnedWrongCount || 0,
      quizCorrectCount: saved.quizCorrectCount || 0,
      quizWrongCount: saved.quizWrongCount || 0,
      unknownCount: saved.unknownCount || 0,
      startedAt: saved.startedAt || new Date().toISOString()
    };
  }

  const phase = saved.phase === "quiz" ? "quiz" : "learn";
  let activePhase = phase;
  if (activePhase === "learn" && currentIndex >= learnItems.length) {
    activePhase = "quiz";
    currentIndex = 0;
  }
  const total = activePhase === "quiz" ? quizItems.length : learnItems.length;
  if (currentIndex >= total) {
    return null;
  }

  return {
    id: saved.id || makeExamId(),
    courseId: saved.courseId,
    questionIds: saved.questionIds || null,
    sessionMode: saved.sessionMode || (saved.questionIds?.length ? "custom" : "batch"),
    batchSize: saved.batchSize || GUIDED_BATCH_SIZE,
    step: saved.step || "learn",
    interleave: saved.interleave !== false,
    phase: activePhase,
    currentIndex,
    learnItems,
    quizItems,
    learnedCorrectCount: saved.learnedCorrectCount || 0,
    learnedWrongCount: saved.learnedWrongCount || 0,
    quizCorrectCount: saved.quizCorrectCount || 0,
    quizWrongCount: saved.quizWrongCount || 0,
    unknownCount: saved.unknownCount || 0,
    startedAt: saved.startedAt || new Date().toISOString()
  };
}

function getResumableGuidedSession(courseId, questionIds = null, sessionMode = "batch") {
  const key = Array.isArray(questionIds) && questionIds.length
    ? getGuidedSessionKey(courseId, questionIds)
    : getGuidedSessionKey(courseId, null, sessionMode);
  const saved = loadGuidedProgressStore()[key];
  if (!saved) {
    return null;
  }
  return hydrateGuidedSession(saved) ? saved : null;
}

function findResumableGuidedSession(preferredCourseIds = []) {
  const tried = new Set();
  for (const courseId of preferredCourseIds) {
    if (!courseId || tried.has(courseId)) {
      continue;
    }
    tried.add(courseId);
    const saved = getResumableGuidedSession(courseId, null, "batch");
    if (saved) {
      return { saved, courseId };
    }
  }
  return null;
}

function formatGuidedResumeLabel(saved) {
  const interleave = saved.sessionMode === "batch" && saved.interleave !== false;
  const learnTotal = saved.learnQuestionIds?.length || saved.learnItems?.length || 0;
  const quizTotal = saved.quizQuestionIds?.length || saved.quizItems?.length || 0;
  let index = Number.isFinite(Number(saved.currentIndex)) ? Number(saved.currentIndex) : 0;
  if (interleave) {
    const step = saved.step === "quiz" ? "quiz" : "learn";
    const stepLabel = step === "quiz" ? "小测" : "记题";
    const batchHint = `本组 ${learnTotal || "?"}`;
    return `继续 · ${batchHint} · 第 ${Math.min(index + 1, learnTotal || 1)} 题${stepLabel}`;
  }
  let phase = saved.phase === "quiz" ? "quiz" : "learn";
  if (phase === "learn" && index >= learnTotal && quizTotal) {
    phase = "quiz";
    index = 0;
  }
  const total = phase === "quiz" ? quizTotal : learnTotal;
  const current = Math.min(index + 1, total || 1);
  const phaseLabel = phase === "quiz" ? "小测" : "记题";
  const batchHint = saved.sessionMode === "full" ? "全库" : `本组 ${total || "?"}`;
  return `继续 · ${batchHint} · ${phaseLabel} ${current}/${total || "?"}`;
}

function persistGuidedSession() {
  if (!state.guided || state.guided.phase === "complete") {
    return;
  }
  const key = getGuidedSessionKeyForGuided(state.guided);
  const store = loadGuidedProgressStore();
  store[key] = serializeGuidedSession(state.guided);
  saveGuidedProgressStore(store);
}

function clearGuidedProgressForGuided(guided) {
  if (!guided) {
    return;
  }
  const key = getGuidedSessionKeyForGuided(guided);
  const store = loadGuidedProgressStore();
  if (!store[key]) {
    return;
  }
  delete store[key];
  saveGuidedProgressStore(store);
}

function clearGuidedProgress(courseId, questionIds = null, sessionMode = "batch") {
  const key = Array.isArray(questionIds) && questionIds.length
    ? getGuidedSessionKey(courseId, questionIds)
    : getGuidedSessionKey(courseId, null, sessionMode);
  const store = loadGuidedProgressStore();
  if (!store[key]) {
    return;
  }
  delete store[key];
  saveGuidedProgressStore(store);
}

function ensureActiveCourseForGuided(courseId) {
  if (!courseId || courseId === state.activeCourseId) {
    return;
  }
  state.activeCourseId = courseId;
  saveActiveCourseId(courseId);
  syncActiveCourseBank();
}

function exitGuidedToHome() {
  persistGuidedSession();
  state.guided = null;
  renderDashboard();
}

function startGuidedPracticeWithChoice(questionIds = null) {
  const normalizedQuestionIds = Array.isArray(questionIds) && questionIds.length ? unique(questionIds) : null;
  const entry = normalizedQuestionIds
    ? { saved: getResumableGuidedSession(state.activeCourseId, normalizedQuestionIds), courseId: state.activeCourseId }
    : findResumableGuidedSession([state.activeCourseId]);
  const saved = entry?.saved;
  if (!saved) {
    startGuidedPractice(normalizedQuestionIds, { fresh: true });
    return;
  }
  const resumeIds = saved.sessionMode === "custom" ? saved.questionIds : null;
  renderGuidedPracticeChoice(saved, resumeIds);
}

function renderGuidedPracticeChoice(saved, questionIds = null) {
  const course = getCourseById(saved.courseId);
  const modeHint = saved.sessionMode === "full" ? "全题库" : `每组 ${saved.batchSize || GUIDED_BATCH_SIZE} 题`;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel guided-choice-panel">
      <p class="eyebrow">答案先行记题 · ${escapeHtml(modeHint)}</p>
      <h1>${escapeHtml(course.name)}</h1>
      <p>上次做到 <strong>${escapeHtml(formatGuidedResumeLabel(saved))}</strong>，你可以接着做，也可以从头新开始。</p>
      <div class="topbar-actions guided-continue-actions">
        <button id="guidedChoiceResume" class="primary">继续做到后面</button>
        <button id="guidedChoiceFresh" class="secondary">新开始</button>
        <button id="guidedChoiceBack">回首页</button>
      </div>
    </section>
  `;
  document.getElementById("guidedChoiceResume").addEventListener("click", () => {
    ensureActiveCourseForGuided(saved.courseId);
    startGuidedPractice(questionIds, {
      resume: true,
      full: saved.sessionMode === "full",
      sessionMode: saved.sessionMode || "batch"
    });
  });
  document.getElementById("guidedChoiceFresh").addEventListener("click", () => {
    ensureActiveCourseForGuided(saved.courseId);
    startGuidedPractice(questionIds, {
      fresh: true,
      full: saved.sessionMode === "full",
      sessionMode: saved.sessionMode || "batch"
    });
  });
  document.getElementById("guidedChoiceBack").addEventListener("click", renderDashboard);
}

function startGuidedPractice(questionIds = null, options = {}) {
  const { resume = false, fresh = false, full = false, sessionMode: preferredSessionMode = null } = options;
  const activeCourse = getActiveCourse();
  const normalizedQuestionIds = Array.isArray(questionIds) && questionIds.length ? unique(questionIds) : null;
  const sessionMode = full ? "full" : normalizedQuestionIds ? "custom" : preferredSessionMode || "batch";

  if (resume) {
    const saved = normalizedQuestionIds
      ? loadGuidedProgressStore()[getGuidedSessionKey(activeCourse.id, normalizedQuestionIds)]
      : getResumableGuidedSession(activeCourse.id, null, sessionMode);
    const hydrated = saved ? hydrateGuidedSession(saved) : null;
    if (hydrated) {
      clearTimer();
      state.exam = null;
      state.practice = null;
      state.repair = null;
      state.study = null;
      state.instantDrill = null;
      state.guided = hydrated;
      renderGuidedPractice();
      return;
    }
  }

  if (fresh) {
    clearGuidedProgress(activeCourse.id, normalizedQuestionIds, sessionMode);
  }

  const bank = getCourseBank(activeCourse.id);
  const byId = new Map((bank.questions || []).map((question) => [question.id, question]));
  let learnQuestionIds = [];
  let quizQuestionIds = [];

  if (Array.isArray(normalizedQuestionIds) && normalizedQuestionIds.length) {
    learnQuestionIds = normalizedQuestionIds.filter((id) => byId.has(id));
    quizQuestionIds = shuffle(learnQuestionIds.slice());
  } else {
    const buildGuidedRound = window.GuidedPractice?.buildGuidedRound;
    if (typeof buildGuidedRound !== "function") {
      alert("引导练习模块加载失败，请刷新页面后重试。");
      return;
    }
    const round = buildGuidedRound({
      courseId: activeCourse.id,
      questions: bank.questions || [],
      masteryItems: Object.values(state.mastery),
      wrongPoolItems: Object.values(state.wrongPool),
      full,
      learnCount: GUIDED_BATCH_SIZE,
      quizCount: GUIDED_BATCH_SIZE
    });
    learnQuestionIds = round.learnQuestionIds || [];
    quizQuestionIds = round.quizQuestionIds || [];
  }

  const learnItems = learnQuestionIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((question) => ({
      question,
      answerVisible: true,
      answer: [],
      answerShownAt: 0
    }));
  const quizItems = quizQuestionIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((question) => ({
      question,
      answer: [],
      submitted: false,
      revealed: false,
      isCorrect: false,
      wasUnknown: false
    }));

  if (!learnItems.length || !quizItems.length) {
    alert(full
      ? "当前课程暂无可开始的引导练习题。"
      : "本组题已刷完或暂无可学新题。可换科目，或在「我非要换方式」里试全题库模式。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.study = null;
  state.instantDrill = null;
  state.guided = {
    id: makeExamId(),
    courseId: activeCourse.id,
    questionIds: sessionMode === "custom" ? normalizedQuestionIds : sessionMode === "batch" ? learnQuestionIds : null,
    sessionMode,
    batchSize: full ? null : GUIDED_BATCH_SIZE,
    step: "learn",
    interleave: sessionMode === "batch",
    phase: "learn",
    currentIndex: 0,
    learnItems,
    quizItems,
    learnedCorrectCount: 0,
    learnedWrongCount: 0,
    quizCorrectCount: 0,
    quizWrongCount: 0,
    unknownCount: 0,
    startedAt: new Date().toISOString()
  };
  persistGuidedSession();
  renderGuidedPractice();
}

function shouldInterleaveGuided(guided) {
  return guided?.sessionMode === "batch";
}

function resetGuidedQuizItem(item) {
  item.answer = [];
  item.submitted = false;
  item.revealed = false;
  item.isCorrect = false;
  item.wasUnknown = false;
}

function goToInterleavedQuiz(guided) {
  guided.step = "quiz";
  resetGuidedQuizItem(guided.quizItems[guided.currentIndex]);
  persistGuidedSession();
  renderGuidedPractice();
}

function renderGuidedPractice() {
  const guided = state.guided;
  if (!guided) {
    renderDashboard();
    return;
  }

  if (shouldInterleaveGuided(guided)) {
    if (guided.currentIndex >= guided.learnItems.length) {
      completeGuidedPractice();
      return;
    }
    if (guided.step === "quiz") {
      renderGuidedQuiz();
      persistGuidedSession();
      return;
    }
    renderGuidedLearn();
    persistGuidedSession();
    return;
  }

  if (guided.phase === "learn") {
    if (guided.currentIndex >= guided.learnItems.length) {
      guided.phase = "quiz";
      guided.currentIndex = 0;
      persistGuidedSession();
      renderGuidedPractice();
      return;
    }
    renderGuidedLearn();
    persistGuidedSession();
    return;
  }
  if (guided.phase === "quiz") {
    if (guided.currentIndex >= guided.quizItems.length) {
      completeGuidedPractice();
      return;
    }
    renderGuidedQuiz();
    persistGuidedSession();
    return;
  }
  renderGuidedComplete();
}

function maybeLogGuidedLearnView(item) {
  if (!item.answerVisible || item.viewLogged) {
    return;
  }
  item.viewLogged = true;
  item.answerShownAt = Date.now();
  logGuidedEvent("guided_learn_view", item.question, "learn");
  persistGuidedSession();
}

function getGuidedRevealWaitMs(item) {
  if (!item?.answerVisible || !item.answerShownAt) {
    return 0;
  }
  return Math.max(0, GUIDED_ANSWER_MIN_VIEW_MS - (Date.now() - item.answerShownAt));
}

function renderGuidedLearn() {
  const guided = state.guided;
  const course = getCourseById(guided.courseId);
  const item = guided.learnItems[guided.currentIndex];
  maybeLogGuidedLearnView(item);
  const question = item.question;
  const path = buildReasoningPath(question);
  const batchLabel = guided.sessionMode === "full" ? "全库" : `本组 ${guided.learnItems.length} 题`;
  const stepLabel = shouldInterleaveGuided(guided)
    ? `第 ${guided.currentIndex + 1} 题 · ①看答案`
    : `记题 · ${batchLabel}`;
  const revealWaitMs = getGuidedRevealWaitMs(item);
  const revealReady = !item.answerVisible || revealWaitMs <= 0;
  const revealLabel = revealReady
    ? (shouldInterleaveGuided(guided) ? "遮住回忆 → 小测本题" : "下一步：遮住答案，自己答")
    : `先看 ${Math.ceil(revealWaitMs / 1000)} 秒再遮`;
  const interleaved = shouldInterleaveGuided(guided);

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitGuidedLearn")}
      <div class="exam-header-main">
      <div><h1>${escapeHtml(course.name)}</h1></div>
      <div class="exam-stats">
        <span>阶段：${escapeHtml(stepLabel)}</span>
        <span>题号 ${guided.currentIndex + 1}/${guided.learnItems.length}</span>
        ${renderGuidedSessionStats(guided)}
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      ${
        item.answerVisible
          ? `
            <div class="feedback correct">
              <strong>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</strong>
              <p>题眼：${escapeHtml(path.keyClue)}</p>
              <p class="sync-hint">先看清题眼，再点下方按钮遮住答案自己答。</p>
            </div>
          `
          : `
            <div class="hint-box">
              <strong>题眼：${escapeHtml(path.keyClue)}</strong>
              <p>答案已经遮住了，按题眼自己回忆，再选答案。</p>
            </div>
            <div class="options">${renderGuidedOptions(item, question, false)}</div>
          `
      }
    </article>

    <footer class="exam-actions guided-actions">
      ${
        item.answerVisible
          ? `
            <button id="revealGuidedLearn" class="primary" ${revealReady ? "" : "disabled"}>${escapeHtml(revealLabel)}</button>
            ${interleaved && item.recallFailed ? `<button id="skipToInterleavedQuiz" class="secondary">记不住了，先小测本题</button>` : ""}
          `
          : `
            <button id="guidedLearnUnknown" class="warning">不会，查看答案题眼</button>
            <button id="submitGuidedLearn" class="primary">检查记住了没</button>
          `
      }
    </footer>
  `;

  document.getElementById("exitGuidedLearn").addEventListener("click", exitGuidedToHome);
  if (item.answerVisible) {
    const revealButton = document.getElementById("revealGuidedLearn");
    revealButton.addEventListener("click", revealGuidedLearn);
    document.getElementById("skipToInterleavedQuiz")?.addEventListener("click", skipToInterleavedQuiz);
    if (!revealReady) {
      window.setTimeout(() => renderGuidedLearn(), revealWaitMs + 40);
    }
    return;
  }
  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectGuidedAnswer(item, question, button.dataset.key));
  });
  document.getElementById("guidedLearnUnknown").addEventListener("click", () => resetGuidedLearnItem("不会，查看答案题眼"));
  document.getElementById("submitGuidedLearn").addEventListener("click", submitGuidedLearn);
}

function revealGuidedLearn() {
  const guided = state.guided;
  const item = guided.learnItems[guided.currentIndex];
  item.answerVisible = false;
  item.answer = [];
  item.recallFailed = false;
  logGuidedEvent("guided_reveal", item.question, "learn");
  persistGuidedSession();
  renderGuidedPractice();
}

function skipToInterleavedQuiz() {
  const guided = state.guided;
  if (!shouldInterleaveGuided(guided)) {
    return;
  }
  logGuidedEvent("guided_skip_to_quiz", guided.learnItems[guided.currentIndex].question, "learn");
  goToInterleavedQuiz(guided);
}

function submitGuidedLearn() {
  const guided = state.guided;
  const item = guided.learnItems[guided.currentIndex];
  if (!item.answer.length) {
    alert("请先选择答案。");
    return;
  }
  if (!sameAnswer(item.answer, item.question.answer)) {
    resetGuidedLearnItem("没记住");
    return;
  }

  const currentMastery = getQuestionMastery(guided.courseId, item.question.id) || {};
  saveGuidedMastery(item.question, {
    isCorrect: true,
    clickedFamiliarButUnsure: false,
    confidence: "确定",
    unanswered: false
  }, {
    guidedRecallCorrectCount: (currentMastery.guidedRecallCorrectCount || 0) + 1
  });
  guided.learnedCorrectCount += 1;
  logGuidedEvent("guided_recall_correct", item.question, "learn");
  if (shouldInterleaveGuided(guided)) {
    goToInterleavedQuiz(guided);
    return;
  }
  guided.currentIndex += 1;
  persistGuidedSession();
  renderGuidedPractice();
}

function resetGuidedLearnItem(reason = "") {
  const guided = state.guided;
  const item = guided.learnItems[guided.currentIndex];
  saveGuidedMastery(item.question, {
    isCorrect: false,
    clickedFamiliarButUnsure: false,
    confidence: reason === "不会，查看答案题眼" ? "我不会" : "不确定",
    statusOverride: "未学",
    unanswered: false
  }, {
    guidedRecallCorrectCount: 0
  });
  item.answerVisible = true;
  item.answer = [];
  item.recallFailed = true;
  item.viewLogged = false;
  item.answerShownAt = 0;
  guided.learnedWrongCount = (guided.learnedWrongCount || 0) + 1;
  logGuidedEvent("guided_recall_wrong", item.question, "learn", { reason });
  persistGuidedSession();
  renderGuidedPractice();
}

function renderGuidedQuiz() {
  const guided = state.guided;
  const course = getCourseById(guided.courseId);
  const item = guided.quizItems[guided.currentIndex];
  const question = item.question;
  const path = buildReasoningPath(question);
  const revealResult = item.submitted || item.wasUnknown;
  const batchLabel = guided.sessionMode === "full" ? "全库" : `本组 ${guided.quizItems.length} 题`;
  const stepLabel = shouldInterleaveGuided(guided)
    ? `第 ${guided.currentIndex + 1} 题 · ②立刻小测`
    : `小测 · ${batchLabel}`;

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitGuidedQuiz")}
      <div class="exam-header-main">
      <div><h1>${escapeHtml(course.name)}</h1></div>
      <div class="exam-stats">
        <span>阶段：${escapeHtml(stepLabel)}</span>
        <span>题号 ${guided.currentIndex + 1}/${guided.quizItems.length}</span>
        ${renderGuidedSessionStats(guided)}
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="options">${renderGuidedOptions(item, question, revealResult)}</div>
      ${
        revealResult
          ? `
            <div class="feedback ${item.isCorrect ? "correct" : "wrong"}">
              <strong>${item.wasUnknown ? "这题先记为不会" : item.isCorrect ? "答对了" : "答错了"}</strong>
              <p>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</p>
              <p>题眼：${escapeHtml(path.keyClue)}</p>
              <p>下次判断：${escapeHtml(path.nextTimeRule)}</p>
            </div>
          `
          : ""
      }
    </article>

    <footer class="exam-actions guided-actions">
      ${
        revealResult
          ? `<button id="nextGuidedQuiz" class="primary">${guided.currentIndex === guided.quizItems.length - 1 ? "完成本轮" : "下一题"}</button>`
          : `
            <button id="guidedQuizUnknown" class="warning">不会，查看答案题眼</button>
            <button id="submitGuidedQuiz" class="primary">检查答案</button>
          `
      }
    </footer>
  `;

  document.getElementById("exitGuidedQuiz").addEventListener("click", exitGuidedToHome);
  if (revealResult) {
    document.getElementById("nextGuidedQuiz").addEventListener("click", advanceGuidedQuiz);
    return;
  }
  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectGuidedAnswer(item, question, button.dataset.key));
  });
  document.getElementById("guidedQuizUnknown").addEventListener("click", revealGuidedUnknown);
  document.getElementById("submitGuidedQuiz").addEventListener("click", submitGuidedQuiz);
}

function renderGuidedOptions(item, question, revealResult) {
  return question.options
    .map((option) => {
      const selected = item.answer.includes(option.key);
      const correct = revealResult && question.answer.includes(option.key);
      const wrong = revealResult && selected && !correct;
      return `
        <button class="option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" data-key="${escapeHtml(option.key)}" ${revealResult ? "disabled" : ""}>
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");
}

function selectGuidedAnswer(item, question, key) {
  if (question.type === "multiple") {
    item.answer = item.answer.includes(key) ? item.answer.filter((value) => value !== key) : sortAnswer([...item.answer, key]);
  } else {
    item.answer = [key];
  }
  renderGuidedPractice();
}

function submitGuidedQuiz() {
  const guided = state.guided;
  const item = guided.quizItems[guided.currentIndex];
  if (!item.answer.length) {
    alert("请先选择答案。");
    return;
  }

  item.submitted = true;
  item.revealed = true;
  item.isCorrect = sameAnswer(item.answer, item.question.answer);
  saveGuidedMastery(item.question, {
    isCorrect: item.isCorrect,
    clickedFamiliarButUnsure: false,
    confidence: "确定",
    unanswered: false
  });
  if (item.isCorrect) {
    guided.quizCorrectCount += 1;
    updateWrongPoolFromPractice(item.question.id, true);
    logGuidedEvent("guided_quiz_correct", item.question, "quiz");
  } else {
    guided.quizWrongCount = (guided.quizWrongCount || 0) + 1;
    updateWrongPoolFromPractice(item.question.id, false, "概念混淆");
    logGuidedEvent("guided_quiz_wrong", item.question, "quiz");
  }
  persistGuidedSession();
  renderGuidedPractice();
}

function revealGuidedUnknown() {
  const guided = state.guided;
  const item = guided.quizItems[guided.currentIndex];
  item.wasUnknown = true;
  item.revealed = true;
  item.isCorrect = false;
  item.answer = [];
  guided.unknownCount += 1;
  saveGuidedMastery(item.question, {
    isCorrect: false,
    clickedFamiliarButUnsure: false,
    confidence: "我不会",
    statusOverride: "未学",
    unanswered: false
  });
  updateWrongPoolFromPractice(item.question.id, false, "没学过");
  logGuidedEvent("guided_unknown", item.question, "quiz");
  persistGuidedSession();
  renderGuidedPractice();
}

function advanceGuidedQuiz() {
  const guided = state.guided;
  if (shouldInterleaveGuided(guided)) {
    guided.currentIndex += 1;
    guided.step = "learn";
    if (guided.currentIndex >= guided.learnItems.length) {
      completeGuidedPractice();
      return;
    }
    const nextLearn = guided.learnItems[guided.currentIndex];
    nextLearn.answerVisible = true;
    nextLearn.answer = [];
    nextLearn.recallFailed = false;
    nextLearn.viewLogged = false;
    nextLearn.answerShownAt = 0;
    persistGuidedSession();
    renderGuidedPractice();
    return;
  }
  if (guided.currentIndex >= guided.quizItems.length - 1) {
    completeGuidedPractice();
    return;
  }
  guided.currentIndex += 1;
  persistGuidedSession();
  renderGuidedPractice();
}

function completeGuidedPractice() {
  const guided = state.guided;
  if (!guided) {
    return;
  }
  if (!guided.completedAt) {
    guided.completedAt = new Date().toISOString();
    saveGuidedRound({
      id: guided.id,
      courseId: guided.courseId,
      startedAt: guided.startedAt,
      completedAt: guided.completedAt,
      learnedCount: guided.learnItems.length,
      learnedCorrectCount: guided.learnedCorrectCount,
      quizCount: guided.quizItems.length,
      quizCorrectCount: guided.quizCorrectCount,
      unknownCount: guided.unknownCount
    });
  }
  clearGuidedProgressForGuided(guided);

  if (guided.sessionMode === "full") {
    ensureActiveCourseForGuided(guided.courseId);
    state.guided = null;
    state.message = "全库答案先行完成，开始模拟（可查看题眼）。";
    startExam("mock", { rescueMode: true });
    return;
  }

  guided.phase = "complete";
  renderGuidedComplete();
}

function shouldDeferMockAfterGuided(courseId) {
  const profile = buildCourseBarrierProfile(getCourseById(courseId));
  const code = profile.primary?.code || "";
  return code === "entry_gap" || code === "insufficient_data" || code === "retrieval_gap";
}

function renderGuidedComplete() {
  const guided = state.guided;
  const deferMock = shouldDeferMockAfterGuided(guided.courseId);
  const isBatch = guided.sessionMode === "batch";
  const nextStep = guided.unknownCount > 0
    ? "先记住刚才不会的题，下一组会换新的。"
    : guided.quizCorrectCount < guided.quizItems.length
      ? "小测没对的题，下一组前可再遮答一次。"
      : isBatch
        ? "本组闭环完成。继续下一组，比一次刷全库更容易记住。"
        : "这一轮练完了，可以去限时模拟验节奏";

  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">${isBatch ? "本组完成" : "引导练习完成"}</p>
      <h1>${escapeHtml(getCourseById(guided.courseId).name)}</h1>
      <p>遮住答对 ${guided.learnedCorrectCount}/${guided.learnItems.length} 题｜看了还错 ${guided.learnedWrongCount || 0} 题</p>
      <p>小测答对 ${guided.quizCorrectCount}/${guided.quizItems.length} 题｜小测错 ${(guided.quizWrongCount || 0) + (guided.unknownCount || 0)} 题</p>
      <p>${escapeHtml(nextStep)}</p>
      <div class="topbar-actions">
        ${
          isBatch
            ? `<button id="guidedNextBatch" class="primary">下一组 ${guided.batchSize || GUIDED_BATCH_SIZE} 题</button>`
            : `<button id="guidedMock" class="primary" ${deferMock ? "disabled" : ""}>开始模拟</button>`
        }
        <button id="guidedAgain" class="secondary">${isBatch ? "重做本组" : "从头再来"}</button>
        <button id="guidedHome">回首页</button>
      </div>
      ${deferMock && !isBatch ? `<p class="sync-hint sync-warning">主断点还在铺底阶段，先多做几组答案先行，再开模拟。</p>` : ""}
    </section>
  `;
  document.getElementById("guidedNextBatch")?.addEventListener("click", () => {
    const courseId = state.guided?.courseId;
    state.guided = null;
    ensureActiveCourseForGuided(courseId);
    startGuidedPractice(null, { fresh: true });
  });
  document.getElementById("guidedMock")?.addEventListener("click", () => {
    ensureActiveCourseForGuided(state.guided?.courseId);
    state.guided = null;
    startExam("mock", { rescueMode: true });
  });
  document.getElementById("guidedAgain").addEventListener("click", () => {
    const guidedRef = state.guided;
    const questionIds = guidedRef?.sessionMode === "custom" ? guidedRef.questionIds : null;
    const full = guidedRef?.sessionMode === "full";
    state.guided = null;
    startGuidedPractice(questionIds, { fresh: true, full });
  });
  document.getElementById("guidedHome").addEventListener("click", () => {
    state.guided = null;
    renderDashboard();
  });
}

function saveGuidedMastery(question, result, extraFields = {}) {
  const courseId = getActiveDrillCourseId();
  const now = new Date().toISOString();
  const key = getQuestionStorageKey(courseId, question.id, state.mastery);
  const current = state.mastery[key] || {};
  const nextMastery = {
    ...buildNextMastery(current, { ...result, courseId, questionId: question.id }, now),
    ...extraFields
  };
  state.mastery = {
    ...state.mastery,
    [key]: nextMastery
  };
  saveMastery(state.mastery);
  return nextMastery;
}

function logGuidedEvent(type, question, phase, extra = {}) {
  logLearningEvent(type, {
    courseId: getActiveDrillCourseId(),
    questionId: question.id,
    chapter: question.chapter,
    questionType: question.type,
    phase,
    ...extra
  });
}

function startUnlearnedStudy(questionIds = buildUnlearnedQuestionIds(state.activeCourseId), title = "未学补基础") {
  const items = unique(questionIds)
    .map((id) => findQuestionForCourse(state.activeCourseId, id))
    .filter(Boolean)
    .filter(isStudyQuestion)
    .slice(0, 12)
    .map((question) => ({
      question,
      remembered: null
    }));

  if (!items.length) {
    alert(title === "题眼背题" ? "当前课程暂无可背题。可以先导入题库。" : "当前课程暂无未学题。可以先导入题库，或继续模拟考试发现薄弱点。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.guided = null;
  state.instantDrill = null;
  state.study = {
    courseId: state.activeCourseId,
    title,
    items,
    currentIndex: 0
  };
  renderUnlearnedStudy();
}

function renderUnlearnedStudy() {
  const study = state.study;
  if (study.currentIndex >= study.items.length) {
    renderUnlearnedStudyComplete();
    return;
  }

  const item = study.items[study.currentIndex];
  const question = item.question;
  const path = buildReasoningPath(question);
  const optionRows = question.options
    .map((option) => {
      const correct = question.answer.includes(option.key);
      return `
        <div class="option ${correct ? "correct" : ""}">
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </div>
      `;
    })
    .join("");

  app.className = "app-shell practice-view";
  const isMemorizeMode = study.title === "题眼背题";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitStudy")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">${isMemorizeMode ? "背题刷熟" : "以前没学过"}</p>
        <h1>${escapeHtml(study.title)}</h1>
      </div>
      <div class="exam-stats">
        <span>当前 ${study.currentIndex + 1}/${study.items.length}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="hint-box">
        <strong>${isMemorizeMode ? "先背题眼，再刷速度" : "先补基础，不先考试"}</strong>
        <p>${isMemorizeMode ? "像你之前考证件考试那样，先反复见题。每题只抓“题眼 → 答案”，会了就过，不会就留下反复压。" : "这类题按“题眼 → 考点 → 正确答案 → 下次判断规则”过一遍。还不会就放进错题池，后面继续练。"}</p>
      </div>
      <div class="options study-options">${optionRows}</div>
      <div class="feedback correct">
        <strong>正确答案：${escapeHtml(question.answer.join(""))}</strong>
        <p>${escapeHtml(question.explanation || "暂无解析")}</p>
      </div>
      ${renderReasoningPath(path, question)}
      ${renderSimilarQuestions(recommendSimilarQuestions(question, 3))}
    </article>

    <footer class="exam-actions study-actions">
      <button id="stillUnlearned" class="warning">仍不会，进错题池</button>
      <button id="rememberedStudy" class="primary">我记住了</button>
    </footer>
  `;

  document.getElementById("exitStudy").addEventListener("click", renderDashboard);
  document.getElementById("stillUnlearned").addEventListener("click", () => advanceUnlearnedStudy(false));
  document.getElementById("rememberedStudy").addEventListener("click", () => advanceUnlearnedStudy(true));
}

function advanceUnlearnedStudy(remembered) {
  const study = state.study;
  const item = study.items[study.currentIndex];
  saveStudyOutcome(item, remembered);
  study.currentIndex += 1;
  renderUnlearnedStudy();
}

function renderUnlearnedStudyComplete() {
  const remaining = buildUnlearnedQuestionIds(state.study?.courseId || state.activeCourseId).length;
  const title = state.study?.title || "未学补基础";
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">${escapeHtml(title)}完成</p>
      <h1>这一轮过完了</h1>
      <p>仍不会的题已经进入错题池；记住的题已写入掌握状态。当前课程未学池剩余 ${remaining} 题。</p>
      <div class="topbar-actions">
        <button id="backHome" class="primary">回首页</button>
        <button id="studyAgain" ${remaining ? "" : "disabled"}>继续补基础</button>
      </div>
    </section>
  `;
  document.getElementById("backHome").addEventListener("click", renderDashboard);
  document.getElementById("studyAgain").addEventListener("click", () => startUnlearnedStudy());
}

function saveStudyOutcome(item, remembered) {
  const courseId = state.study?.courseId || state.activeCourseId;
  const now = new Date().toISOString();
  const result = {
    courseId,
    questionId: item.question.id,
    isCorrect: remembered,
    clickedFamiliarButUnsure: false,
    confidence: remembered ? "确定" : "没学过",
    statusOverride: remembered ? "基本掌握" : "未学",
    unanswered: false
  };
  const key = getQuestionStorageKey(courseId, item.question.id, state.mastery);
  state.mastery = {
    ...state.mastery,
    [key]: buildNextMastery(state.mastery[key], result, now)
  };
  saveMastery(state.mastery);
  if (remembered) {
    removeQuestionFromWrongPool(courseId, item.question.id);
  } else {
    updateWrongPoolFromPractice(item.question.id, false, "没学过");
  }
  logLearningEvent(remembered ? "study_remembered" : "study_unlearned", {
    courseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    reason: remembered ? "记住" : "没学过"
  });
}

function startForgetRepair(questionIds = buildForgetRepairQuestionIds(state.activeCourseId)) {
  const items = unique(questionIds)
    .map((id) => findQuestionForCourse(state.activeCourseId, id))
    .filter(Boolean)
    .filter(isStudyQuestion)
    .slice(0, 10)
    .map((question) => ({
      question,
      revealed: false
    }));

  if (!items.length) {
    alert("当前课程暂无秒忘加固题。先补基础、模拟考试，或把错因标为“下一秒忘”。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.repair = null;
  state.guided = null;
  state.instantDrill = null;
  state.study = {
    courseId: state.activeCourseId,
    mode: "forget",
    title: "秒忘加固",
    items,
    currentIndex: 0
  };
  renderForgetRepair();
}

function renderForgetRepair() {
  const study = state.study;
  if (study.currentIndex >= study.items.length) {
    renderForgetRepairComplete();
    return;
  }

  const item = study.items[study.currentIndex];
  const question = item.question;
  const path = buildReasoningPath(question);

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitForget")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">记了又忘</p>
        <h1>${escapeHtml(study.title)}</h1>
      </div>
      <div class="exam-stats">
        <span>当前 ${study.currentIndex + 1}/${study.items.length}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="hint-box">
        <strong>先主动回忆 10 秒</strong>
        <p>先在脑子里说出：题眼是什么、考点是什么、答案为什么是它。再显示答案，不要一上来就看解析。</p>
      </div>
      ${renderMemoryMap(question, path)}
      ${
        item.revealed
          ? `
            <div class="feedback correct">
              <strong>正确答案：${escapeHtml(formatAnswer(question, question.answer))}</strong>
              <p>${escapeHtml(question.explanation || "暂无解析")}</p>
            </div>
            ${renderReasoningPath(path, question)}
            ${renderSimilarQuestions(recommendSimilarQuestions(question, 3))}
          `
          : `
            <div class="recall-card">
              <strong>答案先遮住</strong>
              <p>如果你现在只能“眼熟”，说明还没形成提取路径。先回忆，再点显示。</p>
            </div>
          `
      }
    </article>

    <footer class="exam-actions study-actions">
      ${
        item.revealed
          ? `
            <button id="stillForget" class="warning">还是会忘</button>
            <button id="stableForget" class="primary">这次稳了</button>
          `
          : '<button id="revealForget" class="primary">显示答案和关系卡</button>'
      }
    </footer>
  `;

  document.getElementById("exitForget").addEventListener("click", renderDashboard);
  if (item.revealed) {
    document.getElementById("stillForget").addEventListener("click", () => advanceForgetRepair(false));
    document.getElementById("stableForget").addEventListener("click", () => advanceForgetRepair(true));
  } else {
    document.getElementById("revealForget").addEventListener("click", () => {
      item.revealed = true;
      renderForgetRepair();
    });
  }
}

function advanceForgetRepair(stable) {
  const study = state.study;
  const item = study.items[study.currentIndex];
  saveForgetOutcome(item, stable);
  study.currentIndex += 1;
  renderForgetRepair();
}

function renderForgetRepairComplete() {
  const remaining = buildForgetRepairQuestionIds(state.study?.courseId || state.activeCourseId).length;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">秒忘加固完成</p>
      <h1>这一轮稳了一点</h1>
      <p>“还是会忘”的题会留在加固队列并进入错题池；“这次稳了”的题会移出秒忘队列。当前剩余 ${remaining} 题。</p>
      <div class="topbar-actions">
        <button id="backHome" class="primary">回首页</button>
        <button id="forgetAgain" ${remaining ? "" : "disabled"}>继续加固</button>
      </div>
    </section>
  `;
  document.getElementById("backHome").addEventListener("click", renderDashboard);
  document.getElementById("forgetAgain").addEventListener("click", () => startForgetRepair());
}

function saveForgetOutcome(item, stable) {
  const courseId = state.study?.courseId || state.activeCourseId;
  const now = new Date().toISOString();
  const result = {
    courseId,
    questionId: item.question.id,
    isCorrect: stable,
    clickedFamiliarButUnsure: !stable,
    confidence: stable ? "确定" : "下一秒忘",
    statusOverride: stable ? "稳定掌握" : "秒忘",
    unanswered: false
  };
  const key = getQuestionStorageKey(courseId, item.question.id, state.mastery);
  state.mastery = {
    ...state.mastery,
    [key]: buildNextMastery(state.mastery[key], result, now)
  };
  saveMastery(state.mastery);
  if (stable) {
    removeQuestionFromWrongPool(courseId, item.question.id);
  } else {
    updateWrongPoolFromPractice(item.question.id, false, "下一秒忘");
  }
  logLearningEvent(stable ? "forget_stable" : "forget_unstable", {
    courseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    reason: stable ? "这次稳了" : "下一秒忘"
  });
}

function startPractice(questionIds, title) {
  const byId = new Map(state.questions.map((question) => [question.id, question]));
  const items = unique(questionIds)
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((question) => question.validForExam !== false)
    .map((question) => ({
      question,
      answer: [],
      submitted: false,
      isCorrect: false,
      reason: "",
      reasonSaved: false,
      review: {
        clueChoice: "",
        conceptChoice: "",
        eliminationChoice: "",
        completed: false
      }
    }));

  if (!items.length) {
    alert("暂无可重练错题。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.guided = null;
  state.instantDrill = null;
  state.practice = {
    id: makeExamId(),
    courseId: state.activeCourseId,
    title,
    items,
    currentIndex: 0,
    expressionGaps: {}
  };
  renderPractice();
}

function renderPractice() {
  const practice = state.practice;
  if (practice.currentIndex >= practice.items.length) {
    renderPracticeComplete();
    return;
  }

  const item = practice.items[practice.currentIndex];
  const question = item.question;
  const optionButtons = question.options
    .map((option) => {
      const selected = item.answer.includes(option.key);
      const correct = item.submitted && question.answer.includes(option.key);
      const wrong = item.submitted && selected && !correct;
      return `
        <button class="option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" data-key="${escapeHtml(option.key)}" ${item.submitted ? "disabled" : ""}>
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");
  const feedback = item.submitted
    ? `
      <div class="feedback ${item.isCorrect ? "correct" : "wrong"}">
        <strong>${item.isCorrect ? "答对了" : "答错了"}</strong>
        <p>正确答案：${escapeHtml(question.answer.join(""))}</p>
        <p>${escapeHtml(question.explanation || "暂无解析")}</p>
      </div>
      ${renderReasoningPath(buildReasoningPath(question), question, { userAnswer: item.answer, correctAnswer: question.answer, confidence: item.isCorrect ? "确定" : "不确定" })}
      ${renderSimilarQuestions(recommendSimilarQuestions(question, 3))}
      ${item.isCorrect ? "" : renderReasonPicker(item.reason)}
      ${item.isCorrect ? "" : renderReviewTraining(item, question)}
    `
    : "";

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitPractice")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">错题复训</p>
        <h1>${escapeHtml(practice.title)}</h1>
      </div>
      <div class="exam-stats">
        <span>当前 ${practice.currentIndex + 1}/${practice.items.length}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="options">${optionButtons}</div>
      ${feedback}
    </article>

    <footer class="exam-actions">
      <button id="expressionGapQuestion" class="${practice.expressionGaps?.[question.id] ? "warning" : ""}">会选但说不出</button>
      <button id="submitPractice" class="primary" ${item.submitted ? "disabled" : ""}>提交本题</button>
      <button id="nextPractice">${practice.currentIndex === practice.items.length - 1 ? "完成重练" : "下一题"}</button>
    </footer>
  `;

  app.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => selectPracticeAnswer(question, button.dataset.key));
  });
  app.querySelectorAll(".reason").forEach((button) => {
    button.addEventListener("click", () => setPracticeReason(button.dataset.reason));
  });
  app.querySelectorAll(".review-choice").forEach((button) => {
    button.addEventListener("click", () => setPracticeReviewChoice(button.dataset.field, button.dataset.value));
  });
  document.getElementById("exitPractice").addEventListener("click", renderDashboard);
  document.getElementById("expressionGapQuestion")?.addEventListener("click", () => toggleExpressionGap("practice", practice, question));
  document.getElementById("submitPractice").addEventListener("click", submitPracticeAnswer);
  document.getElementById("nextPractice").addEventListener("click", nextPracticeQuestion);
}

function renderReasonPicker(selectedReason) {
  return `
    <div class="reason-panel">
      <p>选择错因后才能进入下一题</p>
      <div>
        ${WRONG_REASONS.map(
          (reason) => `<button class="reason ${selectedReason === reason ? "selected" : ""}" data-reason="${escapeHtml(reason)}">${escapeHtml(reason)}</button>`
        ).join("")}
      </div>
    </div>
  `;
}

function renderReviewTraining(item, question) {
  return `
    <div class="review-panel">
      <div class="section-title">
        <h2>三步判题复盘</h2>
        <span>${item.review.completed ? "已完成" : "未完成"}</span>
      </div>
      ${renderReviewChoiceGroup("1. 找题眼", buildClueChoices(question), "clueChoice", item.review.clueChoice)}
      ${renderReviewChoiceGroup("2. 定位考点", buildConceptChoices(question), "conceptChoice", item.review.conceptChoice)}
      ${renderReviewChoiceGroup("3. 排除干扰项", buildEliminationChoices(question), "eliminationChoice", item.review.eliminationChoice)}
    </div>
  `;
}

function renderReviewChoiceGroup(title, choices, field, selectedValue) {
  return `
    <div class="review-group">
      <strong>${escapeHtml(title)}</strong>
      <div class="choice-grid compact">
        ${choices
          .map(
            (choice) => `
              <button class="review-choice ${selectedValue === choice.value ? "selected" : ""}" data-field="${escapeHtml(field)}" data-value="${escapeHtml(choice.value)}">
                ${escapeHtml(choice.label)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function setPracticeReviewChoice(field, value) {
  const item = state.practice.items[state.practice.currentIndex];
  item.review[field] = value;
  item.review.completed = Boolean(item.review.clueChoice && item.review.conceptChoice && item.review.eliminationChoice);
  renderPractice();
}

function selectPracticeAnswer(question, key) {
  const item = state.practice.items[state.practice.currentIndex];
  if (item.submitted) {
    return;
  }
  if (question.type === "multiple") {
    item.answer = item.answer.includes(key) ? item.answer.filter((value) => value !== key) : sortAnswer([...item.answer, key]);
  } else {
    item.answer = [key];
  }
  renderPractice();
}

function submitPracticeAnswer() {
  const item = state.practice.items[state.practice.currentIndex];
  if (!item.answer.length) {
    alert("请先选择答案。");
    return;
  }
  item.submitted = true;
  item.isCorrect = sameAnswer(item.answer, item.question.answer);
  if (item.isCorrect) {
    updateWrongPoolFromPractice(item.question.id, true);
    logLearningEvent("practice_correct", {
      courseId: state.practice?.courseId || state.activeCourseId,
      questionId: item.question.id,
      chapter: item.question.chapter,
      questionType: item.question.type,
      reason: "错题重练答对"
    });
  }
  renderPractice();
}

function setPracticeReason(reason) {
  const item = state.practice.items[state.practice.currentIndex];
  item.reason = reason;
  if (item.reasonSaved) {
    updateWrongPoolReason(item.question.id, reason);
  } else {
    updateWrongPoolFromPractice(item.question.id, false, reason);
    item.reasonSaved = true;
  }
  logLearningEvent("practice_wrong", {
    courseId: state.practice?.courseId || state.activeCourseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    reason
  });
  renderPractice();
}

function nextPracticeQuestion() {
  const item = state.practice.items[state.practice.currentIndex];
  if (!item.submitted) {
    alert("请先提交本题。");
    return;
  }
  if (!item.isCorrect && !item.reason) {
    alert("请先选择错因。");
    return;
  }
  if (!item.isCorrect && !item.review.completed) {
    alert("请先完成题眼、考点、干扰项三步复盘。");
    return;
  }
  state.practice.currentIndex += 1;
  renderPractice();
}

function renderPracticeComplete() {
  const courseId = state.practice?.courseId || state.activeCourseId;
  const remainingIds = getCourseWrongQuestionIds(courseId);
  const remaining = remainingIds.length;
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">错题复训完成</p>
      <h1>本轮结束</h1>
      <p>高危错题池剩余 ${remaining} 题。答对 2 次的题已自动移出。</p>
      <div class="topbar-actions">
        <button id="backHome" class="primary">回首页</button>
        <button id="practiceAgain" ${remaining ? "" : "disabled"}>继续错题重练</button>
      </div>
    </section>
  `;
  document.getElementById("backHome").addEventListener("click", renderDashboard);
  document.getElementById("practiceAgain").addEventListener("click", () => {
    startPractice(remainingIds, "高危错题重练");
  });
}

function startRepairTraining(questionIds = buildRepairQuestionIds()) {
  const items = unique(questionIds)
    .map((id) => findQuestion(id))
    .filter(Boolean)
    .filter((question) => question.validForExam !== false)
    .slice(0, 10)
    .map((question) => ({
      question,
      clueChoice: "",
      conceptChoice: "",
      eliminationChoice: "",
      answer: [],
      submitted: false,
      finalCorrect: false
    }));

  if (!items.length) {
    alert("暂无浅层修复候选题。先完成一套模拟考试，或在考试中点击「眼熟但不会」。");
    return;
  }

  clearTimer();
  state.exam = null;
  state.practice = null;
  state.guided = null;
  state.instantDrill = null;
  state.repair = {
    id: makeExamId(),
    courseId: state.activeCourseId,
    title: "浅层修复训练",
    items,
    currentIndex: 0,
    expressionGaps: {}
  };
  renderRepairTraining();
}

function renderRepairTraining() {
  const repair = state.repair;
  if (repair.currentIndex >= repair.items.length) {
    renderRepairComplete();
    return;
  }

  const item = repair.items[repair.currentIndex];
  const question = item.question;
  const body = renderRepairBody(item, question);

  app.className = "app-shell practice-view";
  app.innerHTML = `
    <section class="exam-header practice-header">
      ${renderPracticeExitButton("exitRepair")}
      <div class="exam-header-main">
      <div>
        <p class="eyebrow">浅层掌握修复</p>
        <h1>${escapeHtml(repair.title)}</h1>
      </div>
      <div class="exam-stats">
        <span>当前 ${repair.currentIndex + 1}/${repair.items.length}</span>
        <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
      </div>
      </div>
    </section>

    <article class="question-panel">
      <div class="question-meta">
        <span>${escapeHtml(question.chapter)}</span>
        <span>难度 ${escapeHtml(String(question.difficulty || "-"))}</span>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      ${body}
    </article>

    <footer class="exam-actions">
      <button id="expressionGapQuestion" class="${repair.expressionGaps?.[question.id] ? "warning" : ""}">会选但说不出</button>
      <button id="nextRepair" class="primary">${item.submitted ? "下一题" : "继续"}</button>
    </footer>
  `;

  app.querySelectorAll(".repair-choice").forEach((button) => {
    button.addEventListener("click", () => setRepairChoice(button.dataset.field, button.dataset.value));
  });
  app.querySelectorAll(".repair-answer").forEach((button) => {
    button.addEventListener("click", () => selectRepairAnswer(question, button.dataset.key));
  });
  document.getElementById("exitRepair").addEventListener("click", renderDashboard);
  document.getElementById("expressionGapQuestion")?.addEventListener("click", () => toggleExpressionGap("repair", repair, question));
  document.getElementById("nextRepair").addEventListener("click", advanceRepairTraining);
}

function renderRepairBody(item, question) {
  if (!item.clueChoice) {
    return renderRepairChoice("1. 先找题眼", "这道题真正决定答案的词是什么？", buildClueChoices(question), "clueChoice", item.clueChoice);
  }
  if (!item.conceptChoice) {
    return renderRepairChoice("2. 再定位考点", "题眼应该落到哪个知识点？", buildConceptChoices(question), "conceptChoice", item.conceptChoice);
  }
  if (!item.eliminationChoice) {
    return renderRepairChoice("3. 排除干扰项", "哪个选项最需要先排除？", buildEliminationChoices(question), "eliminationChoice", item.eliminationChoice);
  }

  const optionButtons = question.options
    .map((option) => {
      const selected = item.answer.includes(option.key);
      const correct = item.submitted && question.answer.includes(option.key);
      const wrong = item.submitted && selected && !correct;
      return `
        <button class="option repair-answer ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" data-key="${escapeHtml(option.key)}" ${item.submitted ? "disabled" : ""}>
          <span>${escapeHtml(option.key)}</span>
          <strong>${escapeHtml(option.text)}</strong>
        </button>
      `;
    })
    .join("");

  return `
    <div class="hint-box">
      <strong>4. 重新作答</strong>
      <p>按刚才的路径再选一次。提交后会生成一句话记忆卡。</p>
    </div>
    <div class="options">${optionButtons}</div>
    ${
      item.submitted
        ? `
          <div class="feedback ${item.finalCorrect ? "correct" : "wrong"}">
            <strong>${item.finalCorrect ? "修复后答对" : "修复后仍错"}</strong>
            <p>正确答案：${escapeHtml(question.answer.join(""))}</p>
          </div>
          ${renderReasoningPath(buildReasoningPath(question), question, { userAnswer: item.answer, correctAnswer: question.answer, confidence: "眼熟但不会" })}
          ${renderSimilarQuestions(recommendSimilarQuestions(question, 3))}
        `
        : ""
    }
  `;
}

function renderRepairChoice(title, prompt, choices, field, selectedValue) {
  return `
    <div class="training-step">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(prompt)}</p>
      <div class="choice-grid">
        ${choices
          .map(
            (choice) => `
              <button class="repair-choice ${selectedValue === choice.value ? "selected" : ""}" data-field="${escapeHtml(field)}" data-value="${escapeHtml(choice.value)}">
                ${escapeHtml(choice.label)}
              </button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function setRepairChoice(field, value) {
  const item = state.repair.items[state.repair.currentIndex];
  item[field] = value;
  renderRepairTraining();
}

function selectRepairAnswer(question, key) {
  const item = state.repair.items[state.repair.currentIndex];
  if (item.submitted) {
    return;
  }
  if (question.type === "multiple") {
    item.answer = item.answer.includes(key) ? item.answer.filter((value) => value !== key) : sortAnswer([...item.answer, key]);
  } else {
    item.answer = [key];
  }
  renderRepairTraining();
}

function advanceRepairTraining() {
  const repair = state.repair;
  const item = repair.items[repair.currentIndex];
  if (!item.clueChoice || !item.conceptChoice || !item.eliminationChoice) {
    alert("先完成当前拆题步骤。");
    return;
  }
  if (!item.submitted) {
    if (!item.answer.length) {
      alert("请先重新作答。");
      return;
    }
    item.submitted = true;
    item.finalCorrect = sameAnswer(item.answer, item.question.answer);
    saveRepairOutcome(item);
    renderRepairTraining();
    return;
  }
  repair.currentIndex += 1;
  renderRepairTraining();
}

function renderRepairComplete() {
  app.className = "app-shell";
  app.innerHTML = `
    <section class="panel finish-panel">
      <p class="eyebrow">浅层修复完成</p>
      <h1>本轮结束</h1>
      <p>已把本轮拆题结果写入本地记录和掌握状态。</p>
      <div class="topbar-actions">
        <button id="backHome" class="primary">回首页</button>
        <button id="againRepair">再练一轮</button>
      </div>
    </section>
  `;
  document.getElementById("backHome").addEventListener("click", renderDashboard);
  document.getElementById("againRepair").addEventListener("click", () => startRepairTraining());
}

function updateWrongPoolFromExam(record) {
  const nextPool = { ...state.wrongPool };
  const courseId = record.courseId || state.activeCourseId;
  record.questionResults
    .filter((item) => !item.isCorrect)
    .forEach((item) => {
      const key = getQuestionStorageKey(courseId, item.questionId, nextPool);
      const current = nextPool[key] || {};
      nextPool[key] = {
        courseId,
        questionId: item.questionId,
        chapter: item.chapter,
        questionType: item.questionType,
        wrongCount: (current.wrongCount || 0) + 1,
        correctStreak: 0,
        lastReason: item.wrongReason,
        lastWrongAt: record.submittedAt,
        status: "high-risk"
      };
    });
  state.wrongPool = nextPool;
  saveWrongPool(nextPool);
}

function updateWrongPoolFromPractice(questionId, isCorrect, reason = "") {
  const nextPool = { ...state.wrongPool };
  const courseId = state.instantDrill?.courseId || state.guided?.courseId || state.practice?.courseId || state.repair?.courseId || state.study?.courseId || state.activeCourseId;
  const key = getQuestionStorageKey(courseId, questionId, nextPool);
  const question = state.questions.find((item) => item.id === questionId);
  const existing = nextPool[key];
  if (isCorrect && !existing) {
    return;
  }
  const current = existing || {
    courseId,
    questionId,
    chapter: question?.chapter || "",
    questionType: question?.type || "",
    wrongCount: 0,
    correctStreak: 0,
    status: "high-risk"
  };

  if (isCorrect) {
    const correctStreak = (current.correctStreak || 0) + 1;
    if (correctStreak >= 2) {
      delete nextPool[key];
    } else {
      nextPool[key] = { ...current, correctStreak };
    }
  } else {
    nextPool[key] = {
      ...current,
      courseId,
      wrongCount: (current.wrongCount || 0) + 1,
      correctStreak: 0,
      lastReason: reason,
      lastWrongAt: new Date().toISOString()
    };
  }

  state.wrongPool = nextPool;
  saveWrongPool(nextPool);
}

function updateWrongPoolReason(questionId, reason) {
  const courseId = state.instantDrill?.courseId || state.guided?.courseId || state.practice?.courseId || state.repair?.courseId || state.study?.courseId || state.activeCourseId;
  const key = getQuestionStorageKey(courseId, questionId, state.wrongPool);
  if (!state.wrongPool[key]) {
    return;
  }
  state.wrongPool = {
    ...state.wrongPool,
    [key]: {
      ...state.wrongPool[key],
      lastReason: reason
    }
  };
  saveWrongPool(state.wrongPool);
}

function removeQuestionFromWrongPool(courseId, questionId) {
  const key = getQuestionStorageKey(courseId, questionId, state.wrongPool);
  if (!state.wrongPool[key]) {
    return;
  }
  const nextPool = { ...state.wrongPool };
  delete nextPool[key];
  state.wrongPool = nextPool;
  saveWrongPool(nextPool);
}

async function handleBankImport(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  try {
    const bank = normalizeBank(JSON.parse(await file.text()));
    state.courseBanks = {
      ...state.courseBanks,
      [state.activeCourseId]: bank
    };
    saveCourseBanks(state.courseBanks);
    if (state.activeCourseId === DEFAULT_ACTIVE_COURSE_ID) {
      localStorage.setItem(STORAGE_KEYS.bank, JSON.stringify(bank));
    }
    syncActiveCourseBank();
    state.message = `${getActiveCourse().name}题库已导入：${bank.questions.length} 题。`;
    renderDashboard();
  } catch (error) {
    alert(`题库导入失败：${error.message}`);
  }
}

async function handleDocImport(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }
  await importCourseFiles(files);
  event.target.value = "";
}

function bindDocDropZone() {
  const dropZone = document.getElementById("docDropZone");
  if (!dropZone) {
    return;
  }
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragging");
    });
  });
  dropZone.addEventListener("drop", async (event) => {
    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) {
      return;
    }
    await importCourseFiles(files);
  });
}

async function importCourseFiles(files) {
  const course = getActiveCourse();
  let importedBankCount = 0;
  const docs = [];

  for (const file of files) {
    const textPreview = await readFilePreview(file);
    if (isJsonFile(file) && textPreview) {
      try {
        const raw = JSON.parse(textPreview);
        const questions = Array.isArray(raw) ? raw : raw.questions;
        if (Array.isArray(questions) && questions.length) {
          const bank = normalizeBank(raw);
          state.courseBanks = { ...state.courseBanks, [course.id]: bank };
          importedBankCount += bank.questions.length;
        }
      } catch {
        // Non-bank JSON is still kept as a course document.
      }
    }
    docs.push({
      id: makeDocId(),
      courseId: course.id,
      name: file.name,
      kind: classifyDoc(file.name, file.type),
      type: file.type || "",
      size: file.size,
      uploadedAt: new Date().toISOString(),
      textPreview
    });
  }

  if (importedBankCount) {
    saveCourseBanks(state.courseBanks);
    syncActiveCourseBank();
  }
  state.courseDocs = [...state.courseDocs, ...docs].slice(-200);
  saveCourseDocs(state.courseDocs);
  state.message = importedBankCount
    ? `已归档 ${docs.length} 个资料，并为 ${course.name} 接入 ${importedBankCount} 道题。`
    : `已把 ${docs.length} 个资料归档到 ${course.name}。`;
  renderDashboard();
}

function buildTypeStats(questionResults) {
  return Object.keys(TYPE_LABELS).reduce((stats, type) => {
    const items = questionResults.filter((item) => item.questionType === type);
    const correct = items.filter((item) => item.isCorrect).length;
    stats[type] = {
      total: items.length,
      correct,
      accuracy: items.length ? Math.round((correct / items.length) * 100) : 0
    };
    return stats;
  }, {});
}

function buildChapterWeakness(questionResults) {
  return buildChapterStats(questionResults)
    .filter((item) => item.wrongCount > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.wrongCount - a.wrongCount);
}

function buildChapterStats(questionResults) {
  const byChapter = new Map();
  questionResults.forEach((item) => {
    const chapter = item.chapter || "未标注章节";
    const entry = byChapter.get(chapter) || { chapter, total: 0, correct: 0, wrongCount: 0 };
    entry.total += 1;
    if (item.isCorrect) {
      entry.correct += 1;
    } else {
      entry.wrongCount += 1;
    }
    byChapter.set(chapter, entry);
  });

  return [...byChapter.values()]
    .map((item) => ({
      chapter: item.chapter,
      accuracy: Math.round((item.correct / item.total) * 100),
      wrongCount: item.wrongCount
    }));
}

function aggregateChapterAccuracy(records) {
  const byChapter = new Map();
  records.forEach((record) => {
    record.questionResults.forEach((item) => {
      const chapter = item.chapter || "未标注章节";
      const entry = byChapter.get(chapter) || { chapter, total: 0, correct: 0, wrongCount: 0 };
      entry.total += 1;
      if (item.isCorrect) {
        entry.correct += 1;
      } else {
        entry.wrongCount += 1;
      }
      byChapter.set(chapter, entry);
    });
  });

  return [...byChapter.values()]
    .map((item) => ({
      chapter: item.chapter,
      accuracy: Math.round((item.correct / item.total) * 100),
      wrongCount: item.wrongCount
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.wrongCount - a.wrongCount);
}

function aggregateTypeAccuracy(records) {
  const totals = Object.keys(TYPE_LABELS).reduce((result, type) => {
    result[type] = { total: 0, correct: 0 };
    return result;
  }, {});
  records.forEach((record) => {
    Object.entries(record.typeStats || {}).forEach(([type, item]) => {
      if (!totals[type]) {
        totals[type] = { total: 0, correct: 0 };
      }
      totals[type].total += item.total || 0;
      totals[type].correct += item.correct || 0;
    });
  });
  return Object.fromEntries(
    Object.entries(totals).map(([type, item]) => [type, item.total ? Math.round((item.correct / item.total) * 100) : 0])
  );
}

function buildRepairQuestionIds() {
  const courseId = state.activeCourseId;
  const ids = [
    ...getCourseWrongQuestionIds(courseId),
    ...state.shallowRecords
      .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId)
      .map((item) => item.questionId)
  ];
  Object.values(state.mastery).forEach((mastery) => {
    if ((mastery.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId && ["浅层熟悉", "概念混淆", "假掌握"].includes(mastery.status)) ids.push(mastery.questionId);
  });
  getCourseRecords(courseId).slice(-3).forEach((record) => {
    record.questionResults
      .filter((item) => !item.isCorrect || item.confidence !== "确定" || item.clickedFamiliarButUnsure)
      .forEach((item) => ids.push(item.questionId));
  });
  return unique(ids).filter((id) => findQuestion(id)?.validForExam !== false);
}

function buildUnlearnedQuestionIds(courseId = state.activeCourseId) {
  const bank = getCourseBank(courseId);
  const seenQuestionIds = new Set(
    getCourseRecords(courseId).flatMap((record) => record.questionResults.map((item) => item.questionId))
  );
  const neverLearnedIds = Object.values(state.wrongPool)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId && item.lastReason === "没学过")
    .map((item) => item.questionId);
  const unmasteredIds = bank.questions
    .filter(isStudyQuestion)
    .filter((question) => {
      const mastery = getQuestionMastery(courseId, question.id);
      if (mastery) {
        return mastery.status === "未学";
      }
      return !seenQuestionIds.has(question.id);
    })
    .map((question) => question.id);
  return unique([...neverLearnedIds, ...unmasteredIds]).filter((id) => isStudyQuestion(findQuestionForCourse(courseId, id)));
}

function buildForgetRepairQuestionIds(courseId = state.activeCourseId) {
  const weakStatuses = new Set(["未学", "秒忘", "浅层熟悉", "概念混淆", "假掌握", "基本掌握"]);
  const masteryIds = Object.values(state.mastery)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId && weakStatuses.has(item.status))
    .map((item) => item.questionId);
  const wrongIds = Object.values(state.wrongPool)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId && ["没学过", "下一秒忘", "假掌握", "浅层熟悉"].includes(item.lastReason))
    .map((item) => item.questionId);
  const shallowIds = state.shallowRecords
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId)
    .map((item) => item.questionId);
  const uncertainIds = getCourseRecords(courseId)
    .slice(-3)
    .flatMap((record) =>
      record.questionResults
        .filter((item) => item.clickedFamiliarButUnsure || item.confidence !== "确定")
        .map((item) => item.questionId)
    );
  return unique([...wrongIds, ...shallowIds, ...masteryIds, ...uncertainIds, ...buildUnlearnedQuestionIds(courseId)])
    .filter((id) => isStudyQuestion(findQuestionForCourse(courseId, id)));
}

function buildActiveRecallQuestionIds(courseId = state.activeCourseId) {
  const dueIds = Object.values(state.mastery)
    .filter((item) => (item.courseId || DEFAULT_ACTIVE_COURSE_ID) === courseId)
    .filter((item) => isReviewDue(item.nextReviewAt) || ["未学", "秒忘", "浅层熟悉", "概念混淆", "假掌握"].includes(item.status))
    .map((item) => item.questionId);
  return unique([
    ...dueIds,
    ...getCourseWrongQuestionIds(courseId),
    ...buildForgetRepairQuestionIds(courseId),
    ...buildUnlearnedQuestionIds(courseId)
  ]).filter((id) => isStudyQuestion(findQuestionForCourse(courseId, id)));
}

function buildMicroReviewQuestionIds(courseId = state.activeCourseId) {
  return unique([
    ...getCourseWrongQuestionIds(courseId),
    ...buildForgetRepairQuestionIds(courseId),
    ...buildActiveRecallQuestionIds(courseId),
    ...buildUnlearnedQuestionIds(courseId)
  ]).filter((id) => isStudyQuestion(findQuestionForCourse(courseId, id)));
}

function buildMemorizeQuestionIds(courseId = state.activeCourseId) {
  const bank = getCourseBank(courseId);
  const studyIds = bank.questions.filter(isStudyQuestion).map((question) => question.id);
  return unique([
    ...buildUnlearnedQuestionIds(courseId),
    ...getCourseWrongQuestionIds(courseId),
    ...buildForgetRepairQuestionIds(courseId),
    ...buildActiveRecallQuestionIds(courseId),
    ...studyIds
  ]).filter((id) => isStudyQuestion(findQuestionForCourse(courseId, id)));
}

function isReviewDue(nextReviewAt) {
  if (!nextReviewAt) {
    return true;
  }
  return Date.parse(nextReviewAt) <= Date.now();
}

function recallTagToStatus(tag) {
  const map = {
    "#会了": "基本掌握",
    "#半会": "浅层熟悉",
    "#不会": "未学",
    "#上机": "基本掌握",
    "#概念混淆": "概念混淆",
    "#下一秒忘": "秒忘"
  };
  return map[tag] || "浅层熟悉";
}

function calculateNextReviewAt(tag, fromIso = new Date().toISOString()) {
  const days = RECALL_REVIEW_DAYS[tag] || 1;
  const date = new Date(fromIso);
  date.setDate(date.getDate() + days);
  date.setHours(8, 0, 0, 0);
  return date.toISOString();
}

function formatReviewDue(nextReviewAt) {
  if (!nextReviewAt) {
    return "今天";
  }
  const date = new Date(nextReviewAt);
  if (Number.isNaN(date.getTime())) {
    return "今天";
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getCourseBank(courseId) {
  if (courseId === state.activeCourseId) {
    return state.bank || createEmptyBank(getActiveCourse());
  }
  return state.courseBanks[courseId] || createEmptyBank(getCourseById(courseId));
}

function getQuestionMastery(courseId, questionId) {
  const scopedKey = `${courseId}::${questionId}`;
  return state.mastery[scopedKey] || (courseId === DEFAULT_ACTIVE_COURSE_ID ? state.mastery[questionId] : null) || null;
}

function appendShallowRecordsFromExam(record) {
  const courseId = record.courseId || state.activeCourseId;
  const additions = record.questionResults
    .filter((item) => item.clickedFamiliarButUnsure || item.confidence === "不确定")
    .map((item) => ({
      examId: record.id,
      courseId,
      questionId: item.questionId,
      clickedFamiliarButUnsure: item.clickedFamiliarButUnsure,
      firstAnswer: item.firstAnswer || [],
      finalAnswer: item.finalAnswer || item.userAnswer || [],
      conceptLocated: item.conceptLocated,
      clueFound: item.clueFound,
      isCorrect: item.isCorrect,
      confidence: item.confidence,
      createdAt: record.submittedAt
    }));
  if (additions.length) {
    state.shallowRecords = [...state.shallowRecords, ...additions].slice(-300);
    saveShallowRecords(state.shallowRecords);
  }
}

function updateMasteryFromExam(record) {
  const next = { ...state.mastery };
  const courseId = record.courseId || state.activeCourseId;
  record.questionResults.forEach((item) => {
    const key = getQuestionStorageKey(courseId, item.questionId, next);
    next[key] = buildNextMastery(next[key], { ...item, courseId }, record.submittedAt);
  });
  state.mastery = next;
  saveMastery(next);
}

function saveRepairOutcome(item) {
  const now = new Date().toISOString();
  const result = {
    courseId: state.repair?.courseId || state.activeCourseId,
    questionId: item.question.id,
    userAnswer: item.answer,
    isCorrect: item.finalCorrect,
    clickedFamiliarButUnsure: true,
    confidence: "眼熟但不会",
    clueFound: Boolean(item.clueChoice),
    conceptLocated: Boolean(item.conceptChoice),
    unanswered: false
  };
  state.shallowRecords = [
    ...state.shallowRecords,
    {
      courseId: state.repair?.courseId || state.activeCourseId,
      questionId: item.question.id,
      mode: "repair",
      clickedFamiliarButUnsure: true,
      firstAnswer: [],
      finalAnswer: item.answer,
      conceptLocated: true,
      clueFound: true,
      isCorrect: item.finalCorrect,
      createdAt: now
    }
  ].slice(-300);
  saveShallowRecords(state.shallowRecords);
  state.mastery = {
    ...state.mastery,
    [getQuestionStorageKey(result.courseId, item.question.id, state.mastery)]: buildNextMastery(state.mastery[getQuestionStorageKey(result.courseId, item.question.id, state.mastery)], result, now)
  };
  saveMastery(state.mastery);
  updateWrongPoolFromPractice(item.question.id, item.finalCorrect, item.finalCorrect ? "" : "概念混淆");
  logLearningEvent(item.finalCorrect ? "repair_correct" : "repair_wrong", {
    courseId: result.courseId,
    questionId: item.question.id,
    chapter: item.question.chapter,
    questionType: item.question.type,
    reason: item.finalCorrect ? "浅层修复答对" : "概念混淆"
  });
}

function buildNextMastery(current = {}, result, updatedAt) {
  const correctStreak = result.isCorrect ? (current.correctStreak || 0) + 1 : 0;
  const wrongStreak = result.isCorrect ? 0 : (current.wrongStreak || 0) + 1;
  let status = current.status || "未学";
  if (result.statusOverride) status = result.statusOverride;
  else if (result.unanswered) status = current.status || "未学";
  else if (!result.isCorrect && result.confidence === "我不会") status = "未学";
  else if (!result.isCorrect && result.confidence === "确定") status = "假掌握";
  else if (!result.isCorrect && wrongStreak >= 2) status = "概念混淆";
  else if (!result.isCorrect) status = result.clickedFamiliarButUnsure ? "浅层熟悉" : "概念混淆";
  else if (result.clickedFamiliarButUnsure || result.confidence === "不确定") status = "浅层熟悉";
  else if (correctStreak >= 5) status = "稳定掌握";
  else if (correctStreak >= 3) status = "基本掌握";
  return { ...current, courseId: result.courseId || current.courseId || state.activeCourseId, questionId: result.questionId, status, correctStreak, wrongStreak, lastUpdatedAt: updatedAt };
}

function buildClueChoices(question) {
  const path = buildReasoningPath(question);
  const clean = question.question.replace(/[？?]/g, "");
  return normalizeChoices([path.keyClue, extractQuestionTerm(clean, 0), extractQuestionTerm(clean, 1), stripChapter(question.chapter)]);
}

function buildConceptChoices(question) {
  const path = buildReasoningPath(question);
  const match = findBestConfusionMatch(question);
  return normalizeChoices([path.testedConcept, ...(match ? match.group.items.map((item) => item.label) : []), question.chapter, question.cognitiveLevel || TYPE_LABELS[question.type]]);
}

function buildEliminationChoices(question) {
  const wrongOptions = question.options.filter((option) => !question.answer.includes(option.key));
  return (wrongOptions.length ? wrongOptions : question.options).map((option) => ({ value: option.key, label: `${option.key}. ${option.text}` }));
}

function buildReasoningPath(question) {
  if (!question) return { keyClue: "未找到题目", testedConcept: "未找到考点", optionAnalysis: {}, memoryHook: "请重新导入题库。", nextTimeRule: "先确认题库中存在这道题。", judgingPath: "题库缺少当前题。" };
  const match = findBestConfusionMatch(question);
  const keyClue = match ? match.item.label : extractQuestionClue(question);
  const testedConcept = match ? `${match.group.name}：${match.item.label}` : `${question.chapter} / ${question.cognitiveLevel || TYPE_LABELS[question.type]}`;
  const correctText = formatAnswer(question, question.answer);
  return {
    questionId: question.id,
    keyClue,
    testedConcept,
    optionAnalysis: Object.fromEntries(question.options.map((option) => [option.key, buildOptionAnalysis(question, option, match)])),
    memoryHook: match?.item.memoryHook || firstSentence(question.explanation) || `把“${keyClue}”和“${correctText}”绑在一起记。`,
    nextTimeRule: match ? `下次看到“${keyClue}”，优先锁定“${match.item.keyAnswer}”。` : `下次先圈出“${keyClue}”，再看哪个选项直接回答这个题眼。`,
    judgingPath: `看到“${keyClue}” → 定位“${testedConcept}” → 选择“${correctText}”。`
  };
}

function renderMemoryMap(question, path) {
  const tags = buildMemoryTags(question, path);
  const answer = formatAnswer(question, question.answer);
  return `
    <div class="memory-map">
      <strong>标签和关系卡</strong>
      <div class="tag-row">
        ${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <p>${escapeHtml(path.keyClue)} → ${escapeHtml(path.testedConcept)} → ${escapeHtml(answer)}</p>
    </div>
  `;
}

function buildMemoryTags(question, path) {
  const match = findBestConfusionMatch(question);
  return unique([
    stripChapter(question.chapter),
    TYPE_LABELS[question.type],
    question.cognitiveLevel,
    Number(question.difficulty) >= 4 ? "高难" : "",
    match?.group.name,
    path.keyClue,
    ...extractKnownTerms(`${question.question} ${question.explanation || ""}`)
  ].filter(Boolean)).slice(0, 8);
}

function renderReasoningPath(path, question, result = {}) {
  const optionRows = question.options
    .map((option) => `<li class="${question.answer.includes(option.key) ? "correct" : ""}"><strong>${escapeHtml(option.key)}</strong><span>${escapeHtml(path.optionAnalysis[option.key] || "按题眼逐项排除。")}</span></li>`)
    .join("");
  const answerLine = result.userAnswer ? `<p>你的答案：${escapeHtml(formatAnswer(question, result.userAnswer))}｜正确答案：${escapeHtml(formatAnswer(question, question.answer))}</p>` : "";
  return `
    <div class="reasoning-path">
      ${answerLine}
      <dl>
        <div><dt>题眼</dt><dd>${escapeHtml(path.keyClue)}</dd></div>
        <div><dt>考点</dt><dd>${escapeHtml(path.testedConcept)}</dd></div>
        <div><dt>判题路径</dt><dd>${escapeHtml(path.judgingPath)}</dd></div>
      </dl>
      <div class="option-analysis"><strong>干扰项排除</strong><ul>${optionRows}</ul></div>
      <div class="memory-card"><strong>一句话记忆卡</strong><p>${escapeHtml(path.memoryHook)}</p><p>${escapeHtml(path.nextTimeRule)}</p></div>
    </div>
  `;
}

function recommendSimilarQuestions(question, limit = 3) {
  const sourceMatch = findBestConfusionMatch(question);
  const sourceTerms = extractSearchTerms(question);
  return state.questions
    .filter((item) => item.id !== question.id && item.validForExam !== false)
    .map((item) => {
      const match = findBestConfusionMatch(item);
      const shared = extractSearchTerms(item).filter((term) => sourceTerms.includes(term)).length;
      const score = (sourceMatch && match && sourceMatch.group.id === match.group.id ? 12 : 0) + (item.chapter === question.chapter ? 4 : 0) + (item.type === question.type ? 1 : 0) + shared;
      return { question: item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.question.id).localeCompare(String(b.question.id), "zh-CN"))
    .slice(0, limit)
    .map((item) => item.question);
}

function renderSimilarQuestions(questions) {
  if (!questions.length) return "";
  return `<div class="similar-panel"><strong>同类题迁移</strong><ul>${questions.map((question) => `<li><span>${escapeHtml(question.id)}｜${escapeHtml(question.question)}</span><em>${escapeHtml(formatAnswer(question, question.answer))}</em></li>`).join("")}</ul></div>`;
}

function findBestConfusionMatch(question) {
  const text = normalizeText(`${question.question} ${question.explanation || ""} ${question.options.map((option) => option.text).join(" ")}`);
  let best = null;
  CONFUSION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      const score = scoreConfusionItem(text, item);
      if (score > 0 && (!best || score > best.score)) best = { group, item, score };
    });
  });
  return best;
}

function scoreConfusionItem(text, item) {
  let score = text.includes(normalizeText(item.label)) ? 8 : 0;
  normalizeText(item.keyAnswer).split(/[ /、]+/).filter(Boolean).forEach((part) => {
    if (text.includes(part)) score += 3;
  });
  extractKnownTerms(`${item.label} ${item.keyAnswer} ${item.memoryHook}`).forEach((term) => {
    if (text.includes(normalizeText(term))) score += 2;
  });
  return score;
}

function buildOptionAnalysis(question, option, match) {
  const prefix = question.answer.includes(option.key) ? "正确" : "干扰";
  const optionMatch = findBestConfusionMatch({ ...question, question: option.text, explanation: option.text, options: [] });
  if (optionMatch) return `${prefix}：${option.text} 对应“${optionMatch.item.label}”，${optionMatch.item.memoryHook}。`;
  if (question.answer.includes(option.key)) return `${prefix}：${option.text} 直接回答题眼“${match?.item.label || extractQuestionClue(question)}”。`;
  return `${prefix}：${option.text} 看起来相关，但没有直接命中本题题眼。`;
}

function extractQuestionClue(question) {
  const clean = question.question.replace(/[？?。]/g, "").replace(/\s+/g, "");
  return clean.length <= 18 ? clean : `${clean.slice(0, 18)}...`;
}

function extractQuestionTerm(text, index) {
  const terms = extractKnownTerms(text);
  if (terms[index]) return terms[index];
  const clean = text.replace(/\s+/g, "");
  return clean.slice(index * 8, index * 8 + 12) || clean.slice(0, 12);
}

function extractSearchTerms(question) {
  return unique([...extractKnownTerms(`${question.question} ${question.explanation || ""}`), stripChapter(question.chapter), ...question.answer.map((key) => question.options.find((option) => option.key === key)?.text || key)]).filter(Boolean);
}

function extractKnownTerms(text) {
  const terms = ["变量", "函数", "循环", "条件", "数组", "对象", "栈", "队列", "排序", "查找"];
  return terms.filter((term) => normalizeText(text).includes(normalizeText(term)));
}

function normalizeChoices(values) {
  const choices = [];
  values.filter(Boolean).forEach((value) => {
    const label = typeof value === "string" ? value : value.label;
    const choiceValue = typeof value === "string" ? value : value.value;
    if (label && !choices.some((choice) => choice.label === label)) choices.push({ label, value: choiceValue || label });
  });
  return choices.slice(0, 4);
}

function findQuestion(questionId) {
  return state.questions.find((question) => question.id === questionId);
}

function findQuestionForCourse(courseId, questionId) {
  return getCourseBank(courseId).questions.find((question) => question.id === questionId);
}

function formatAnswer(question, answerKeys = []) {
  const keys = Array.isArray(answerKeys) ? answerKeys : [answerKeys].filter(Boolean);
  if (!keys.length) return "未答";
  return sortAnswer(keys)
    .map((key) => {
      const option = question.options.find((item) => item.key === key);
      return option ? `${key}. ${option.text}` : key;
    })
    .join("；");
}

function firstSentence(text = "") {
  return text.split(/[。！？!?]/).find(Boolean) || "";
}

function stripChapter(chapter = "") {
  return chapter.replace(/^第.+?章[:：]?/, "") || chapter || "未标注章节";
}

function normalizeText(text = "") {
  return String(text).toLowerCase().replace(/\s+/g, "").replace(/矛/g, "茅");
}

function getEligibleQuestions() {
  return state.questions.filter((question) => question.validForExam !== false);
}

function isStudyQuestion(question) {
  return Boolean(question?.validForStudy !== false && question?.question && question?.answer?.length);
}

function countQuestions(questions) {
  return questions.reduce((counts, question) => {
    counts[question.type] = (counts[question.type] || 0) + 1;
    return counts;
  }, {});
}

async function readFilePreview(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const textLike = ["json", "md", "txt"].includes(extension) || file.type.startsWith("text/");
  if (!textLike || file.size > 200000) {
    return "";
  }
  return file.text();
}

function isJsonFile(file) {
  return file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
}

function classifyDoc(name, type = "") {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  if (extension === "json" || type === "application/json") return "题库 JSON";
  if (extension === "md") return "Markdown 笔记";
  if (extension === "txt") return "文本资料";
  if (extension === "pdf") return "PDF 资料";
  if (["doc", "docx"].includes(extension)) return "Word 文档";
  if (["ppt", "pptx"].includes(extension)) return "演示文稿";
  if (["png", "jpg", "jpeg"].includes(extension)) return "图片资料";
  return "课程资料";
}

function formatBytes(size = 0) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function formatLocalDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeDocId() {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6);
  return `doc_${stamp}_${suffix}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
      return;
    }
    if (state.exam) {
      handleExamKeyboard(event);
    }
  });
}

function handleExamKeyboard(event) {
  const key = event.key.toLowerCase();
  const exam = state.exam;
  const question = exam.questions[exam.currentIndex];
  const optionKeys = question.options.map((option) => option.key.toLowerCase());
  if (exam.assist) {
    handleExamAssistKeyboard(event, question, optionKeys);
    return;
  }

  if (event.ctrlKey && event.key === "Enter") {
    event.preventDefault();
    submitExam("manual");
    return;
  }
  if (optionKeys.includes(key)) {
    event.preventDefault();
    selectAnswer(question, key.toUpperCase());
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToQuestion(exam.currentIndex - 1);
    return;
  }
  if (event.key === "ArrowRight" || event.key === "Enter") {
    event.preventDefault();
    if (exam.currentIndex === exam.questions.length - 1 && event.key === "ArrowRight") {
      return;
    }
    goToQuestion(Math.min(exam.currentIndex + 1, exam.questions.length - 1));
    return;
  }
  if (key === "m") {
    event.preventDefault();
    toggleMark();
    return;
  }
  if (key === "x") {
    event.preventDefault();
    toggleUnknown();
  }
}

function handleExamAssistKeyboard(event, question, optionKeys) {
  const key = event.key.toLowerCase();
  if (event.key === "Escape") {
    event.preventDefault();
    cancelExamAssist();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    advanceExamAssist();
    return;
  }
  if (state.exam.assist.step === 3 && optionKeys.includes(key)) {
    event.preventDefault();
    selectAssistFinalAnswer(question, key.toUpperCase());
  }
}

function sameAnswer(a, b) {
  return sortAnswer(a).join("|") === sortAnswer(b).join("|");
}

function sortAnswer(answer) {
  return [...answer].sort((a, b) => String(a).localeCompare(String(b), "zh-CN"));
}

function sample(items, count) {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

function shuffle(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function unique(items) {
  return [...new Set(items)];
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function makeExamId() {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6);
  return `exam_${stamp}_${suffix}`;
}

function makeEventId() {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 6);
  return `event_${stamp}_${suffix}`;
}

function loadSyncKey() {
  return normalizeSyncKey(localStorage.getItem(STORAGE_KEYS.syncKey)) || "";
}

function loadRecords() {
  return readJson(STORAGE_KEYS.records, []);
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  markLocalChanged();
}

function loadWrongPool() {
  return readJson(STORAGE_KEYS.wrongPool, {});
}

function saveWrongPool(wrongPool) {
  localStorage.setItem(STORAGE_KEYS.wrongPool, JSON.stringify(wrongPool));
  markLocalChanged();
}

function loadShallowRecords() {
  return readJson(STORAGE_KEYS.shallowRecords, []);
}

function saveShallowRecords(records) {
  localStorage.setItem(STORAGE_KEYS.shallowRecords, JSON.stringify(records));
  markLocalChanged();
}

function loadMastery() {
  return readJson(STORAGE_KEYS.mastery, {});
}

function saveMastery(mastery) {
  localStorage.setItem(STORAGE_KEYS.mastery, JSON.stringify(mastery));
  markLocalChanged();
}

function loadBehaviorEvents() {
  const events = readJson(STORAGE_KEYS.behaviorEvents, []);
  return Array.isArray(events) ? events : [];
}

function saveBehaviorEvents(events) {
  localStorage.setItem(STORAGE_KEYS.behaviorEvents, JSON.stringify(events));
  markLocalChanged();
}

function loadAttentionLogs() {
  const logs = readJson(STORAGE_KEYS.attentionLogs, []);
  return Array.isArray(logs) ? logs : [];
}

function saveAttentionLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.attentionLogs, JSON.stringify(logs));
  markLocalChanged();
}

function loadGuidedRounds() {
  const rounds = readJson(STORAGE_KEYS.guidedRounds, []);
  return Array.isArray(rounds) ? rounds : [];
}

function saveGuidedRounds(rounds) {
  localStorage.setItem(STORAGE_KEYS.guidedRounds, JSON.stringify(rounds));
  markLocalChanged();
}

function saveGuidedRound(round) {
  state.guidedRounds = [...state.guidedRounds, round].slice(-120);
  saveGuidedRounds(state.guidedRounds);
}

function getTodayAttentionLog() {
  const today = getLocalDateKey();
  return state.attentionLogs.find((item) => item.date === today) || { date: today };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}
