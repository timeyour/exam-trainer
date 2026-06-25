(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.LearningBarriers = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this, function () {
  const PRIORITY = ["entry_gap", "retrieval_gap", "expression_gap", "retention_gap", "transfer_gap"];

  const RULES = {
    entry_gap: {
      code: "entry_gap",
      label: "没印象",
      action: "3 题题眼背题：先看答案，再遮住答一次。",
      basis: "检索练习",
      basisUrl: "https://doi.org/10.1126/science.1152408",
      recommendedMode: "答案先行记题"
    },
    retrieval_gap: {
      code: "retrieval_gap",
      label: "看过做不出",
      action: "3 题只练“题眼 -> 答案”，不看长解析。",
      basis: "检索练习",
      basisUrl: "https://doi.org/10.1126/science.1152408",
      recommendedMode: "题眼背题"
    },
    expression_gap: {
      code: "expression_gap",
      label: "会选但说不出",
      action: "3 题按“题眼 -> 考点 -> 排除项”说出一句话。",
      basis: "提取练习",
      basisUrl: "https://doi.org/10.1126/science.1152408",
      recommendedMode: "浅层修复训练"
    },
    retention_gap: {
      code: "retention_gap",
      label: "隔天忘",
      action: "只复答该题及 2 道同类题，安排 1 天后再测。",
      basis: "间隔练习",
      basisUrl: "https://doi.org/10.1037/0033-2909.132.3.354",
      recommendedMode: "秒忘加固"
    },
    transfer_gap: {
      code: "transfer_gap",
      label: "限时乱",
      action: "10 分钟小卷；卡住立即标“我不会”而非乱选。",
      basis: "练习测试",
      basisUrl: "https://doi.org/10.1177/1529100612453266",
      recommendedMode: "考前冲刺小卷"
    }
  };

  const INSUFFICIENT = {
    code: "insufficient_data",
    label: "样本不足",
    confidence: "样本不足",
    evidence: "先完成一轮真实做题，系统才能判断你更适合哪种学法。",
    action: "做 3 道题并诚实标记不会、眼熟或会选但说不出。",
    basis: "检索练习",
    basisUrl: "https://doi.org/10.1126/science.1152408",
    recommendedMode: "答案先行记题",
    evidenceCount: 0,
    evidenceDays: 0
  };

  function localDateKey(value, fallback = new Date()) {
    const date = value ? new Date(value) : fallback;
    if (Number.isNaN(date.getTime())) {
      return localDateKey(fallback, fallback);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function asObservation(source) {
    return {
      createdAt: source.createdAt || new Date().toISOString()
    };
  }

  function confidenceFor(count, days) {
    if (count >= 6 && days >= 2) {
      return "证据较强";
    }
    if (count >= 3) {
      return "初步观察";
    }
    return "样本不足";
  }

  function summarizeEvidence(code, count, practicedQuestions, totalQuestions) {
    const coverage = totalQuestions ? Math.round((practicedQuestions / totalQuestions) * 100) : 0;
    if (code === "entry_gap") {
      return `${count} 次“没印象”证据，题库覆盖约 ${coverage}%`;
    }
    if (code === "retrieval_gap") {
      return `${count} 次眼熟/不确定后仍做不出`;
    }
    if (code === "expression_gap") {
      return `${count} 次自报“会选但说不出”`;
    }
    if (code === "retention_gap") {
      return `${count} 题出现隔天先对后错`;
    }
    if (code === "transfer_gap") {
      return `${count} 次限时/模拟中卡住或答错`;
    }
    return `${count} 条相关证据`;
  }

  function resolveActiveExpressionReports(events) {
    const groups = new Map();
    events
      .filter((event) => event.type === "expression_gap_report" || event.type === "expression_gap_clear")
      .forEach((event) => {
        const key = `${event.courseId || ""}|${event.sessionId || ""}|${event.questionId || ""}`;
        const existing = groups.get(key);
        if (!existing || String(event.createdAt) >= String(existing.createdAt)) {
          groups.set(key, event);
        }
      });
    return [...groups.values()].filter((event) => event.type === "expression_gap_report");
  }

  function findDifferentDayCorrectThenWrong(results) {
    const byQuestion = new Map();
    results.forEach((result) => {
      if (!result.questionId) {
        return;
      }
      if (!byQuestion.has(result.questionId)) {
        byQuestion.set(result.questionId, []);
      }
      byQuestion.get(result.questionId).push(result);
    });

    const observations = [];
    byQuestion.forEach((items) => {
      const sorted = [...items].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      for (let index = 0; index < sorted.length - 1; index += 1) {
        const current = sorted[index];
        const next = sorted[index + 1];
        if (current.isCorrect && !next.isCorrect && localDateKey(current.createdAt) !== localDateKey(next.createdAt)) {
          observations.push({ createdAt: next.createdAt || current.createdAt });
        }
      }
    });
    return observations;
  }

  function buildItem(code, observations, practicedQuestions, totalQuestions) {
    const rule = RULES[code];
    const evidenceCount = observations.length;
    const evidenceDays = new Set(observations.map((item) => localDateKey(item.createdAt))).size;
    const confidence = confidenceFor(evidenceCount, evidenceDays);
    return {
      ...rule,
      evidenceCount,
      evidenceDays,
      confidence,
      evidence: summarizeEvidence(code, evidenceCount, practicedQuestions, totalQuestions)
    };
  }

  function buildBarrierProfile(input = {}) {
    const results = input.questionResults || [];
    const events = input.events || [];
    const masteryItems = input.masteryItems || [];
    const wrongPoolItems = input.wrongPoolItems || [];
    const practicedQuestions = input.practicedQuestions || 0;
    const totalQuestions = input.totalQuestions || 0;
    const activeExpressionReports = resolveActiveExpressionReports(events);

    const evidenceByCode = {
      entry_gap: [
        ...results.filter((item) => item.clickedUnknown).map(asObservation),
        ...events
          .filter((item) => item.type === "study_unlearned" || item.type === "guided_unknown")
          .map(asObservation),
        ...masteryItems.filter((item) => item.status === "未学").map(asObservation),
        ...wrongPoolItems.filter((item) => item.lastReason === "没学过").map(asObservation)
      ],
      retrieval_gap: [
        ...results
          .filter((item) => item.clickedFamiliarButUnsure || (item.confidence === "不确定" && !item.isCorrect))
          .map(asObservation),
        ...results.filter((item) => !item.isCorrect && item.wrongReason === "浅层熟悉").map(asObservation),
        ...masteryItems.filter((item) => item.status === "浅层熟悉").map(asObservation),
        ...events.filter((item) => item.type === "guided_recall_wrong" || item.type === "instant_drill_forgot").map(asObservation)
      ],
      expression_gap: activeExpressionReports.map(asObservation),
      retention_gap: findDifferentDayCorrectThenWrong(results).map(asObservation),
      transfer_gap: results
        .filter(
          (item) =>
            ["mock", "full", "sprint"].includes(item.mode) &&
            (!item.isCorrect || item.unanswered || item.clickedUnknown || (item.timeSpentSeconds || 0) >= 45)
        )
        .map(asObservation)
    };

    const items = PRIORITY.map((code) => buildItem(code, evidenceByCode[code], practicedQuestions, totalQuestions));

    const primaryCandidate = items.find((item) => item.evidenceCount >= 3) || null;
    const primary = primaryCandidate
      ? { ...primaryCandidate }
      : { ...INSUFFICIENT };

    return {
      courseId: input.courseId || "",
      items,
      primary,
      secondary: items.filter((item) => item.code !== primary.code && item.evidenceCount >= 3).slice(0, 2)
    };
  }

  function buildDailyResearch(input = {}) {
    const todayEvents = input.todayEvents || [];
    const todayResults = input.todayResults || [];
    const profile = input.profile || { primary: INSUFFICIENT };

    if (!todayEvents.length && !todayResults.length) {
      return {
        noData: true,
        summary: "今天没有新的学习数据，无法更新判断。",
        hypothesis: "先完成一次真实学习动作，再看证据。",
        experiment: "做 3 道当前课程题并如实标记不会、眼熟或会选但说不出。",
        falsifier: "没有新数据时，不对学习状态下结论。"
      };
    }

    const primary = profile.primary || INSUFFICIENT;
    return {
      noData: false,
      summary: `今天记录了 ${todayResults.length} 次作答和 ${todayEvents.length} 个学习动作。`,
      hypothesis:
        primary.code === "insufficient_data"
          ? "证据还不够，暂不下学习断点结论。"
          : `${primary.label}：${primary.evidence}`,
      experiment: primary.action,
      falsifier:
        primary.code === "insufficient_data"
          ? "再积累 3 条同类证据后，系统会给出主断点。"
          : `下一次同类题不再出现“${primary.label}”证据，就降低这个判断。`
    };
  }

  return {
    PRIORITY,
    RULES,
    buildBarrierProfile,
    buildDailyResearch
  };
});
