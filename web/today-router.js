(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TodayRouter = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this, function () {
  const MODE_LABELS = {
    guided: "答案先行记题",
    foundation: "题眼背题",
    "memorize-top50": "高频 50 题眼",
    "instant-drill": "即时刷题",
    wrong: "错题回炉",
    repair: "浅层修复",
    forget: "秒忘加固",
    recall: "闭卷复述",
    micro: "12 分钟小复习",
    one: "1 题热身",
    sprint: "考前冲刺",
    mock: "限时模拟",
    import: "导入题库"
  };

  function resolveTodayPrimaryAction(input = {}) {
    const stats = input.stats || {};
    const barrier = input.barrierProfile?.primary || {};
    const cram = input.cramFlow || null;
    const courseId = input.courseId || cram?.focusCourseId || "";
    const courseName = input.courseName || cram?.focusCourseName || "当前课程";
    const todayProgress = stats.todayProgress || 0;
    const minQuestions = cram?.minQuestions || 0;
    const barrierCode = barrier.code || "insufficient_data";
    const barrierConfident = barrier.confidence && barrier.confidence !== "样本不足";

    if (!stats.questionCount) {
      return buildPlan({
        action: "import",
        courseId,
        courseName,
        reason: "当前课程还没有题库，先导入再开始。",
        todayProgress,
        minQuestions,
        cram,
        barrier
      });
    }

    if (cram?.action && cram?.focusCourseId && cram.minQuestions !== 0) {
      const cramDisabled =
        (cram.action === "foundation" && !stats.memorizeCount) ||
        (cram.action === "guided" && !stats.guidedPracticeReady);
      return buildPlan({
        action: cram.action,
        courseId,
        courseName,
        reason: cram.reason || "按今日抢救计划执行。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: cramDisabled
      });
    }

    if (cram?.minQuestions === 0 && (cram.examsToday || []).length) {
      if (input.showTop50 && courseId === "demo_a") {
        return buildPlan({
          action: "memorize-top50",
          courseId,
          courseName,
          reason: "考试日：只做高频题眼热身，不做新题。",
          todayProgress,
          minQuestions,
          cram,
          barrier
        });
      }
      return buildPlan({
        action: "foundation",
        courseId,
        courseName,
        reason: "考试日：只看题眼，保持状态。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: !stats.memorizeCount
      });
    }

    if (stats.highRiskCount >= 6 && stats.examCount > 0 && barrierCode !== "entry_gap" && barrierCode !== "insufficient_data") {
      return buildPlan({
        action: "wrong",
        courseId,
        courseName,
        reason: `高危错题 ${stats.highRiskCount} 道，先回炉再扩新题。`,
        todayProgress,
        minQuestions,
        cram,
        barrier
      });
    }

    if (!barrierConfident || barrierCode === "insufficient_data" || barrierCode === "entry_gap") {
      if (stats.guidedPracticeReady) {
        return buildPlan({
          action: "guided",
          courseId,
          courseName,
          reason: cram?.reason || barrier.evidence || "零基础先从答案和题眼开始，不要硬猜。",
          todayProgress,
          minQuestions,
          cram,
          barrier
        });
      }
      return buildPlan({
        action: "foundation",
        courseId,
        courseName,
        reason: "先认题眼和答案，再遮住自己答。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: !stats.memorizeCount
      });
    }

    if (barrierCode === "retrieval_gap") {
      if (input.showTop50 && courseId === "demo_a") {
        return buildPlan({
          action: "memorize-top50",
          courseId,
          courseName,
          reason: barrier.evidence || "眼熟但提取不出，先压题眼。",
          todayProgress,
          minQuestions,
          cram,
          barrier
        });
      }
      return buildPlan({
        action: "foundation",
        courseId,
        courseName,
        reason: barrier.evidence || "看过做不出，只练题眼触发答案。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: !stats.memorizeCount
      });
    }

    if (barrierCode === "expression_gap") {
      return buildPlan({
        action: stats.repairCandidateCount ? "repair" : "guided",
        courseId,
        courseName,
        reason: barrier.evidence || "会选但说不出，走题眼→考点→排除。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: stats.repairCandidateCount ? !stats.repairCandidateCount : !stats.guidedPracticeReady
      });
    }

    if (barrierCode === "retention_gap") {
      if (stats.forgetFragileCount) {
        return buildPlan({
          action: "forget",
          courseId,
          courseName,
          reason: barrier.evidence || "隔天又忘，先加固提取。",
          todayProgress,
          minQuestions,
          cram,
          barrier
        });
      }
      return buildPlan({
        action: stats.recallDueCount ? "recall" : "guided",
        courseId,
        courseName,
        reason: barrier.evidence || "需要间隔再提取。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: stats.recallDueCount ? !stats.recallDueCount : !stats.guidedPracticeReady
      });
    }

    if (barrierCode === "transfer_gap") {
      if (stats.microTaskCount) {
        return buildPlan({
          action: "micro",
          courseId,
          courseName,
          reason: barrier.evidence || "限时容易乱，先做短回合找节奏。",
          todayProgress,
          minQuestions,
          cram,
          barrier
        });
      }
      return buildPlan({
        action: "sprint",
        courseId,
        courseName,
        reason: barrier.evidence || "用短时限卷练节奏。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: !stats.examEligibleCount
      });
    }

    if (stats.highRiskCount >= 6) {
      return buildPlan({
        action: "wrong",
        courseId,
        courseName,
        reason: `高危错题 ${stats.highRiskCount} 道，先回炉再扩新题。`,
        todayProgress,
        minQuestions,
        cram,
        barrier
      });
    }

    if (stats.unlearnedCount > 0 && (stats.examCount === 0 || stats.lastScore === "-" || Number(stats.lastScore) < 60)) {
      return buildPlan({
        action: stats.guidedPracticeReady ? "guided" : "foundation",
        courseId,
        courseName,
        reason: cram?.reason || "还没铺底，先答案先行。",
        todayProgress,
        minQuestions,
        cram,
        barrier,
        disabled: stats.guidedPracticeReady ? !stats.guidedPracticeReady : !stats.memorizeCount
      });
    }

    if (stats.instantDrillCount && (stats.coverage || 0) >= 0.15) {
      return buildPlan({
        action: "instant-drill",
        courseId,
        courseName,
        reason: "已有题感，用即时刷题提速。",
        todayProgress,
        minQuestions,
        cram,
        barrier
      });
    }

    if ((stats.coverage || 0) >= 0.35 && stats.examEligibleCount) {
      return buildPlan({
        action: "mock",
        courseId,
        courseName,
        reason: "覆盖够一轮，做限时模拟验节奏。",
        todayProgress,
        minQuestions,
        cram,
        barrier
      });
    }

    return buildPlan({
      action: stats.guidedPracticeReady ? "guided" : "foundation",
      courseId,
      courseName,
      reason: cram?.reason || "继续今日主线，不断线就好。",
      todayProgress,
      minQuestions,
      cram,
      barrier,
      disabled: stats.guidedPracticeReady ? !stats.guidedPracticeReady : !stats.memorizeCount
    });
  }

  function buildPlan(options) {
    const modeLabel = MODE_LABELS[options.action] || "继续学习";
    const progressLabel = buildProgressLabel(options.todayProgress, options.minQuestions);
    const buttonLabel = `今日继续 · ${modeLabel.replace(/（.*?）/, "").slice(0, 8)}`;
    const steps = options.cram?.steps || defaultSteps(options.action);
    return {
      action: options.action,
      courseId: options.courseId,
      courseName: options.courseName,
      modeLabel,
      buttonLabel,
      reason: options.reason,
      progressLabel,
      disabled: Boolean(options.disabled),
      steps,
      evening: options.cram?.evening || "",
      badge: options.cram?.badge || options.barrier?.confidence || "自动安排",
      title: options.cram?.title || "今日任务",
      examsToday: options.cram?.examsToday || []
    };
  }

  function buildProgressLabel(todayProgress, minQuestions) {
    if (!minQuestions) {
      return todayProgress ? `本日已练 ${todayProgress} 题` : "今天还没开始";
    }
    if (todayProgress >= minQuestions) {
      return `本日 ${todayProgress}/${minQuestions} 题 · 已达底线`;
    }
    return `本日 ${todayProgress}/${minQuestions} 题 · 差 ${Math.max(0, minQuestions - todayProgress)} 题到底线`;
  }

  function defaultSteps(action) {
    if (action === "guided") {
      return [
        ["记题", `每组 ${3} 题：每题先看答案和题眼，再遮住自己答。`],
        ["小测", "遮住后立刻小测这题，再做下一题。"],
        ["下一组", "本组做完点「下一组」，比一次刷全库更容易记住。"]
      ];
    }
    if (action === "wrong") {
      return [["错题", "先说出题眼再选答案。"], ["错因", "标清不会还是混淆。"]];
    }
    return [["继续", "按系统安排完成这一轮回合。"]];
  }

  return {
    MODE_LABELS,
    resolveTodayPrimaryAction
  };
});
