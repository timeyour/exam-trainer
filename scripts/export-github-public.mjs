#!/usr/bin/env node
/**
 * Export a sanitized copy for public GitHub upload.
 * Usage: node scripts/export-github-public.mjs [outputDir]
 * Default output: ./github-public/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(ROOT, process.argv[2] || "github-public");

const DEMO_BANKS = {
  demo_a: {
    meta: {
      examName: "示例科目 A 模拟考试",
      source: "demo",
      generatedDate: "2026-01-01",
      totalQuestions: 8,
      note: "演示题库，仅供开源示例。"
    },
    questions: [
      q("S001", "single", "下列哪一项属于编程语言？", "第一章", [
        ["A", "Python"],
        ["B", "JPEG"],
        ["C", "MP3"],
        ["D", "PNG"]
      ], ["A"], "Python 是编程语言。"),
      q("S002", "single", "变量主要用于存储什么？", "第一章", [
        ["A", "数据"],
        ["B", "显示器亮度"],
        ["C", "键盘布局"],
        ["D", "网线长度"]
      ], ["A"], "变量用于存储程序运行中的数据。"),
      q("S003", "judge", "循环结构可以重复执行同一段代码。", "第二章", [], ["正确"], "循环用于重复执行。"),
      q("S004", "single", "if 语句的作用是什么？", "第二章", [
        ["A", "条件分支"],
        ["B", "格式化硬盘"],
        ["C", "关闭网络"],
        ["D", "打印纸张"]
      ], ["A"], "if 用于按条件选择不同路径。"),
      q("M001", "multiple", "以下哪些属于常见数据类型？", "第三章", [
        ["A", "整数"],
        ["B", "字符串"],
        ["C", "桌布颜色"],
        ["D", "布尔值"]
      ], ["A", "B", "D"], "整数、字符串、布尔值都是常见数据类型。"),
      q("S005", "single", "函数的主要好处是？", "第三章", [
        ["A", "代码复用"],
        ["B", "增加屏幕分辨率"],
        ["C", "更换操作系统"],
        ["D", "提高室温"]
      ], ["A"], "函数把逻辑封装起来便于复用。"),
      q("J001", "judge", "注释会被编译器/解释器当作程序逻辑执行。", "第四章", [], ["错误"], "注释不参与执行。"),
      q("S006", "single", "调试（debug）的主要目的是？", "第四章", [
        ["A", "查找并修复错误"],
        ["B", "删除所有变量"],
        ["C", "禁止用户输入"],
        ["D", "关闭计算机"]
      ], ["A"], "调试用于定位并修复程序错误。")
    ]
  },
  demo_b: {
    meta: {
      examName: "示例科目 B 模拟考试",
      source: "demo",
      generatedDate: "2026-01-01",
      totalQuestions: 6,
      note: "演示题库，仅供开源示例。"
    },
    questions: [
      q("S101", "single", "栈（Stack）的典型特点是？", "第一章", [
        ["A", "后进先出"],
        ["B", "先进先出"],
        ["C", "随机访问"],
        ["D", "只能读不能写"]
      ], ["A"], "栈是 LIFO 结构。"),
      q("S102", "single", "队列（Queue）的典型特点是？", "第一章", [
        ["A", "先进先出"],
        ["B", "后进先出"],
        ["C", "无序"],
        ["D", "只能写入一次"]
      ], ["A"], "队列是 FIFO 结构。"),
      q("J101", "judge", "二叉树每个节点最多有两个子节点。", "第二章", [], ["正确"], "二叉树定义如此。"),
      q("S103", "single", "哈希表查找平均时间复杂度通常是？", "第二章", [
        ["A", "O(1)"],
        ["B", "O(n^2)"],
        ["C", "O(log n)"],
        ["D", "O(n!)" ]
      ], ["A"], "理想情况下哈希表接近常数时间。"),
      q("M101", "multiple", "以下哪些属于常见排序算法？", "第三章", [
        ["A", "快速排序"],
        ["B", "冒泡排序"],
        ["C", "复制粘贴排序"],
        ["D", "归并排序"]
      ], ["A", "B", "D"], "快速、冒泡、归并都是常见排序算法。"),
      q("S104", "single", "图（Graph）由什么组成？", "第三章", [
        ["A", "顶点与边"],
        ["B", "只有边"],
        ["C", "只有顶点"],
        ["D", "文件与文件夹"]
      ], ["A"], "图由顶点和边构成。")
    ]
  },
  demo_c: {
    meta: {
      examName: "示例科目 C 模拟考试",
      source: "demo",
      generatedDate: "2026-01-01",
      totalQuestions: 6,
      note: "演示题库，仅供开源示例。"
    },
    questions: [
      q("S201", "single", "命题逻辑中，∧ 通常表示？", "第一章", [
        ["A", "与"],
        ["B", "或"],
        ["C", "非"],
        ["D", "异或"]
      ], ["A"], "∧ 表示逻辑与。"),
      q("S202", "single", "集合 {1,2,3} 的元素个数是？", "第一章", [
        ["A", "3"],
        ["B", "2"],
        ["C", "1"],
        ["D", "0"]
      ], ["A"], "该集合有 3 个元素。"),
      q("J201", "judge", "空集是任何集合的子集。", "第二章", [], ["正确"], "空集是任何集合的子集。"),
      q("S203", "single", "导数描述的是函数的什么？", "第二章", [
        ["A", "变化率"],
        ["B", "面积"],
        ["C", "体积"],
        ["D", "颜色"]
      ], ["A"], "导数表示变化率。"),
      q("M201", "multiple", "以下哪些是线性代数常见对象？", "第三章", [
        ["A", "向量"],
        ["B", "矩阵"],
        ["C", "表情包"],
        ["D", "行列式"]
      ], ["A", "B", "D"], "向量、矩阵、行列式属于线性代数。"),
      q("S204", "single", "概率 P 的取值范围通常是？", "第三章", [
        ["A", "[0,1]"],
        ["B", "[-1,1]"],
        ["C", "[0,100]"],
        ["D", "任意实数"]
      ], ["A"], "概率在 0 到 1 之间。")
    ]
  }
};

function q(id, type, question, chapter, options, answer, explanation) {
  const opts = options.map(([key, text]) => ({ key, text }));
  const ans = type === "judge" ? answer : answer;
  return {
    id,
    sourceNumber: id.slice(1),
    type,
    question,
    options: opts,
    answer: Array.isArray(ans) ? ans : [ans],
    explanation,
    chapter,
    cognitiveLevel: "理解",
    difficulty: 2,
    validForExam: true,
    validForStudy: true
  };
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir, filter) {
  if (!fs.existsSync(srcDir)) return;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dest, filter);
    } else if (!filter || filter(src)) {
      copyFile(src, dest);
    }
  }
}

function sanitizeAppJs(source) {
  let text = source;

  text = text.replace(
    /const DEFAULT_COURSE_BANK_PATHS = \{[\s\S]*?\};/,
    `const DEFAULT_COURSE_BANK_PATHS = {
  demo_a: "/shared/exam/demo-a-question-bank.json",
  demo_b: "/shared/exam/demo-b-question-bank.json",
  demo_c: "/shared/exam/demo-c-question-bank.json"
};`
  );

  text = text.replace(/const DEFAULT_BANK_PATH = DEFAULT_COURSE_BANK_PATHS\.\w+;/, "const DEFAULT_BANK_PATH = DEFAULT_COURSE_BANK_PATHS.demo_a;");

  text = text.replace(
    /const DEFAULT_EXAM_CONFIG = \{[\s\S]*?\};/,
    `const DEFAULT_EXAM_CONFIG = {
  examName: "示例模拟考试",
  durationMinutes: 60,
  targetQuestionCount: 20,
  singleChoiceCount: 10,
  multipleChoiceCount: 5,
  judgeCount: 5,
  passingScore: 60,
  randomOrder: true,
  showAnswerDuringExam: false
};`
  );

  text = text.replace(
    /const SPRINT_CONFIG = \{[\s\S]*?\};/,
    `const SPRINT_CONFIG = {
  ...DEFAULT_EXAM_CONFIG,
  examName: "示例考前冲刺",
  durationMinutes: 20,
  singleChoiceCount: 0,
  multipleChoiceCount: 0,
  judgeCount: 0,
  passingScore: 60
};`
  );

  text = text.replace(/const DEFAULT_ACTIVE_COURSE_ID = "\w+";/, 'const DEFAULT_ACTIVE_COURSE_ID = "demo_a";');

  text = text.replace(
    /const EXAM_VENUE = \{[\s\S]*?\};/,
    `const EXAM_VENUE = {
  name: "示例考点",
  address: "示例市示例路 1 号",
  building: "教学楼 A",
  admissionTicket: "00000000000000"
};`
  );

  text = text.replace(
    /const DEFAULT_COURSES = \[[\s\S]*?\n\];/,
    `const DEFAULT_COURSES = [
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
];`
  );

  const replacements = [
    [/ai_intro/g, "demo_a"],
    [/pattern_ml/g, "demo_b"],
    [/data_structures/g, "demo_c"],
    [/ai_math/g, "demo_c"],
    [/computer_math_retake/g, "demo_c"],
    [/python_retake/g, "demo_c"],
    [/AI 导论/g, "示例科目 A"],
    [/人工智能导论/g, "示例科目 A"],
    [/模式识别与机器学习/g, "示例科目 B"],
    [/模式识别/g, "示例科目 B"],
    [/数据结构与算法分析/g, "示例科目 C"],
    [/人工智能数学基础/g, "示例科目 C"],
    [/计算机数学（补）/g, "示例科目 C"],
    [/Python程序设计基础（补）/g, "示例科目 C"],
    [/装调工/g, "证件考试"],
    [/liuxin-exam-trainer\.netlify\.app/g, "your-site.netlify.app"],
    [/exam-trainer-liuxin\.netlify\.app/g, "your-site.netlify.app"],
    [/lx-exam-2026-a7k9/g, "my-sync-key-abc123"],
    [/例如 lx-exam-2026-a7k9/g, "例如 my-sync-key-abc123"],
    [/上海开放大学\.pdf/g, "sample-notice.pdf"],
    [/\/Users\/liuxin[^\s"']*/g, "./"],
    [/2428630442@qq\.com/g, "user@example.com"],
    [/20252310820099/g, "00000000000000"],
    [/杨浦区中原路42号/g, "示例市示例路 1 号"],
    [/上海开放大学/g, "示例考点"],
    [/人工智能训练师三级/g, "示例扩展科目"],
    [/国际前沿讲座/g, "示例讲座"],
    [/startTop50AiIntro/g, "startDemoTopStudy"],
    [/startAiIntroTop50Study/g, "startDemoTopStudy"],
    [/AI 导论高频 50 题眼/g, "示例科目 A 高频题眼"],
    [/高频 50 题眼/g, "高频题眼"],
    [/高频50题眼/g, "高频题眼"],
    [/AI_INTRO_TOP50_IDS/g, "DEMO_TOP_IDS"]
  ];
  for (const [pattern, value] of replacements) {
    text = text.replace(pattern, value);
  }

  text = text.replace(
    /id="startTop50AiIntro"/g,
    'id="startDemoTopStudy"'
  );

  text = text.replace(
    /\.netlify-production-url\.txt 或 your-site\.netlify\.app/g,
    "your-site.netlify.app"
  );

  text = text.replace(
    /const CONFUSION_GROUPS = \[[\s\S]*?\n\];/,
    `const CONFUSION_GROUPS = [
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
];`
  );

  text = text.replace(
    /const terms = \[[\s\S]*?\];/,
    `const terms = ["变量", "函数", "循环", "条件", "数组", "对象", "栈", "队列", "排序", "查找"];`
  );

  text = text.replace(/course_8/g, "demo_extra");
  text = text.replace(/第8门待补充/g, "示例扩展科目");

  return text;
}

function sanitizeTodayRouter(source) {
  return source.replace(/ai_intro/g, "demo_a");
}

function writeExamCramPlan() {
  return `(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ExamCramPlan = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this, function () {
  const PLAN_START = "2026-09-01";
  const PLAN_END = "2026-09-07";

  const DEMO_TOP_IDS = ["S001", "S002", "S003", "S004", "M001", "S005", "J001", "S006"];

  const DAILY_PLANS = [
    {
      date: "2026-09-01",
      label: "9/1 周一",
      focusCourseId: "demo_a",
      focusCourseName: "示例科目 A",
      minQuestions: 10,
      badge: "演示计划第 1 天",
      reason: "演示：先铺示例科目 A 的题眼。",
      action: "guided",
      actionLabel: "开始记题（答案先行）",
      steps: [
        ["上午", "示例科目 A 题眼背题 10 题。"],
        ["下午", "答案先行每组 3 题。"],
        ["底线", "完成 10 题即可。"]
      ],
      evening: "复习错题题眼。"
    },
    {
      date: "2026-09-02",
      label: "9/2 周二",
      focusCourseId: "demo_b",
      focusCourseName: "示例科目 B",
      secondaryCourseId: "demo_a",
      secondaryCourseName: "示例科目 A",
      minQuestions: 10,
      badge: "演示计划第 2 天",
      reason: "演示：切换示例科目 B。",
      action: "foundation",
      actionLabel: "示例科目 B·题眼背题",
      steps: [
        ["全天", "示例科目 B 题眼背题 10 题。"],
        ["维持", "示例科目 A 错题 5 分钟。"]
      ],
      evening: "示例科目 B 错题题眼。"
    },
    {
      date: "2026-09-03",
      label: "9/3 周三 · 演示考试日",
      focusCourseId: "demo_a",
      focusCourseName: "示例科目 A",
      minQuestions: 0,
      badge: "演示考试日",
      reason: "演示：考试日只看题眼。",
      action: "memorize-top50",
      actionLabel: "示例科目 A 高频题眼",
      steps: [
        ["10:00", "示例科目 A · 机房 A。"],
        ["必带", "证件 + 准考证。"]
      ],
      examsToday: [
        { time: "10:00", name: "示例科目 A", room: "机房 A" }
      ]
    }
  ];

  function isActiveCramDate(dateKey) {
    return dateKey >= PLAN_START && dateKey <= PLAN_END;
  }

  function getDailyPlan(dateKey) {
    return DAILY_PLANS.find((plan) => plan.date === dateKey) || null;
  }

  function buildCramFlow(plan) {
    if (!plan) return null;
    return {
      title: \`考前演示 · \${plan.label}\`,
      badge: plan.badge,
      action: plan.action,
      actionLabel: plan.actionLabel,
      reason: plan.reason,
      steps: plan.steps,
      focusCourseId: plan.focusCourseId,
      focusCourseName: plan.focusCourseName,
      secondaryCourseId: plan.secondaryCourseId || "",
      secondaryCourseName: plan.secondaryCourseName || "",
      minQuestions: plan.minQuestions,
      evening: plan.evening || "",
      examsToday: plan.examsToday || [],
      showTop50: plan.focusCourseId === "demo_a"
    };
  }

  return {
    PLAN_START,
    PLAN_END,
    DEMO_TOP_IDS,
    AI_INTRO_TOP50_IDS: DEMO_TOP_IDS,
    DAILY_PLANS,
    isActiveCramDate,
    getDailyPlan,
    buildCramFlow
  };
});
`;
}

function sanitizeTests(content) {
  return content
    .replace(/ai_intro/g, "demo_a")
    .replace(/pattern_ml/g, "demo_b")
    .replace(/2026-06-2[3-8]/g, "2026-09-01")
    .replace(/人工智能导论/g, "示例科目 A")
    .replace(/模式识别与机器学习/g, "示例科目 B")
    .replace(/ai-intro-top50-题眼\.md/g, "demo-top-questions.md")
    .replace(/exam-trainer-liuxin\.netlify\.app/g, "your-site.netlify.app")
    .replace(/liuxin-exam-trainer\.netlify\.app/g, "your-site.netlify.app");
}

function writeReadme() {
  return `# Exam Trainer (Public Demo)

A multi-course exam prep web app: guided practice, spaced repetition, wrong-question pool, cloud sync (Netlify Blobs), and learning-barrier diagnostics.

**This repository is a sanitized public demo.** It does not include personal exam schedules, admission data, or proprietary question banks.

## Features

- Multi-course dashboard with priority sorting
- Guided practice (see answer → recall → quiz)
- Foundation study mode (key-clue memorization)
- Mock exams with scoring and weak-chapter reports
- Local persistence + optional cloud sync via sync key
- PWA (service worker)

## Quick start

\`\`\`bash
npm install
npm test
python3 -m http.server 8080
\`\`\`

Open \`http://localhost:8080/web/\`

## Deploy (Netlify)

1. Connect this repo to Netlify
2. Build command: \`npm install\`
3. Publish directory: \`web\`
4. Functions: \`netlify/functions\`

Cloud sync endpoint: \`/.netlify/functions/sync?key=YOUR_SYNC_KEY\`

## Demo question banks

Three small demo banks live under \`shared/exam/\`. Replace them with your own JSON (see format in demo files) and run:

\`\`\`bash
node scripts/bundle-banks.mjs
\`\`\`

## License

MIT — demo content only. Do not commit third-party exam materials without permission.
`;
}

function writeGitignore() {
  return `.netlify
node_modules
.DS_Store
*.log
.env
.env.*
`;
}

function writeBundleScript() {
  return `import fs from "node:fs";
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

fs.writeFileSync(OUT_FILE, \`window.__EXAM_COURSE_BANKS__ = \${JSON.stringify(banks)};\\n\`);
console.log(\`Wrote \${OUT_FILE}\`);
`;
}

function writePackageJson() {
  return JSON.stringify(
    {
      name: "exam-trainer",
      private: false,
      version: "1.0.0",
      description: "Multi-course exam prep PWA (public demo)",
      license: "MIT",
      scripts: {
        test: "node --test test/*.test.cjs",
        "banks:bundle": "node scripts/bundle-banks.mjs"
      },
      dependencies: {
        "@netlify/blobs": "^10.7.9"
      }
    },
    null,
    2
  );
}

function main() {
  if (fs.existsSync(OUT)) {
    fs.rmSync(OUT, { recursive: true, force: true });
  }
  fs.mkdirSync(OUT, { recursive: true });

  const webFiles = [
    "guided-practice.js",
    "learning-barriers.js",
    "learning-estimates.js",
    "styles.css",
    "index.html",
    "manifest.webmanifest",
    "sw.js"
  ];
  for (const file of webFiles) {
    copyFile(path.join(ROOT, "web", file), path.join(OUT, "web", file));
  }
  fs.writeFileSync(
    path.join(OUT, "web", "today-router.js"),
    sanitizeTodayRouter(fs.readFileSync(path.join(ROOT, "web", "today-router.js"), "utf8"))
  );
  copyDir(path.join(ROOT, "web", "icons"), path.join(OUT, "web", "icons"));

  const appJs = sanitizeAppJs(fs.readFileSync(path.join(ROOT, "web", "app.js"), "utf8"));
  fs.writeFileSync(path.join(OUT, "web", "app.js"), appJs);
  fs.writeFileSync(path.join(OUT, "web", "exam-cram-plan.js"), writeExamCramPlan());

  fs.mkdirSync(path.join(OUT, "shared", "exam"), { recursive: true });
  for (const [courseId, bank] of Object.entries(DEMO_BANKS)) {
    const outName = `demo-${courseId.slice(-1)}-question-bank.json`;
    fs.writeFileSync(path.join(OUT, "shared", "exam", outName), JSON.stringify(bank, null, 2));
  }

  const banksPayload = `window.__EXAM_COURSE_BANKS__ = ${JSON.stringify(DEMO_BANKS)};\n`;
  fs.writeFileSync(path.join(OUT, "web", "banks.js"), banksPayload);

  copyFile(path.join(ROOT, "netlify.toml"), path.join(OUT, "netlify.toml"));
  copyFile(path.join(ROOT, "netlify/functions/sync.mts"), path.join(OUT, "netlify/functions/sync.mts"));

  fs.mkdirSync(path.join(OUT, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(OUT, "scripts", "bundle-banks.mjs"), writeBundleScript());
  fs.writeFileSync(path.join(OUT, "scripts", "export-github-public.mjs"), fs.readFileSync(fileURLToPath(import.meta.url)));

  fs.mkdirSync(path.join(OUT, "test"), { recursive: true });
  for (const file of fs.readdirSync(path.join(ROOT, "test")).filter((f) => f.endsWith(".test.cjs"))) {
    if (file === "exam-cram-plan.test.cjs") {
      fs.writeFileSync(
        path.join(OUT, "test", file),
        `const test = require("node:test");
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
  assert.match(indexSource, /exam-cram-plan\\.js/);
  assert.match(workerSource, /"exam-cram-plan\\.js"/);
});
`
      );
      continue;
    }
    if (file === "app-shell.test.cjs") {
      fs.writeFileSync(
        path.join(OUT, "test", file),
        `const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("exam app no longer loads or exposes industrial equipment content", () => {
  const index = fs.readFileSync("web/index.html", "utf8");
  const app = fs.readFileSync("web/app.js", "utf8");
  const styles = fs.readFileSync("web/styles.css", "utf8");
  const worker = fs.readFileSync("web/sw.js", "utf8");
  assert.doesNotMatch(index, /equipment-data\\.js/);
  assert.doesNotMatch(app, /设备资料卡|renderEquipmentDetail|EQUIPMENT_ROUTE_PREFIX|EQUIPMENT_PARAMETERS/);
  assert.doesNotMatch(styles, /\\.equipment-/);
  assert.doesNotMatch(worker, /equipment-data\\.js/);
  assert.equal(fs.existsSync("web/equipment-data.js"), false);
});

test("app shell wires exam cram plan into today flow", () => {
  const appSource = fs.readFileSync("web/app.js", "utf8");
  const indexSource = fs.readFileSync("web/index.html", "utf8");
  const workerSource = fs.readFileSync("web/sw.js", "utf8");
  assert.match(appSource, /function getCramFlowForToday/);
  assert.match(appSource, /function startDemoTopStudy/);
  assert.match(indexSource, /exam-cram-plan\\.js/);
  assert.match(workerSource, /"exam-cram-plan\\.js"/);
});

test("public demo has no personal identifiers", () => {
  const app = fs.readFileSync("web/app.js", "utf8");
  assert.doesNotMatch(app, /liuxin|2428630442|20252310820099|中原路42号|装调工/);
  assert.doesNotMatch(app, /人工智能导论|模式识别与机器学习/);
});
`
      );
      continue;
    }
    const raw = fs.readFileSync(path.join(ROOT, "test", file), "utf8");
    fs.writeFileSync(path.join(OUT, "test", file), sanitizeTests(raw));
  }

  fs.writeFileSync(path.join(OUT, "README.md"), writeReadme());
  fs.writeFileSync(path.join(OUT, ".gitignore"), writeGitignore());
  fs.writeFileSync(path.join(OUT, "package.json"), writePackageJson());
  fs.writeFileSync(
    path.join(OUT, "LICENSE"),
    "MIT License\n\nCopyright (c) 2026 Exam Trainer contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n"
  );

  console.log(`Public export written to: ${OUT}`);
  console.log("Next: cd github-public && git init && git add . && git commit");
}

main();
