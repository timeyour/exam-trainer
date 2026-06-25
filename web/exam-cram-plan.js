(function (root, factory) {
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
      title: `考前演示 · ${plan.label}`,
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
