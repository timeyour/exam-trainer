(function exposeLearningEstimates(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.LearningEstimates = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createLearningEstimates() {
  const DAY_MS = 86400000;

  function buildLearningStatus(input = {}) {
    const course = input.course || {};
    const now = validDate(input.now) || new Date();
    const courseEvents = (input.events || []).filter((event) => event?.courseId === course.id);
    const studyDates = uniqueStudyDates(courseEvents, now);
    const reviewedToday = studyDates.includes(localDateKey(now));
    const coverage = ratio(input.practicedQuestions, input.totalQuestions);
    const passEstimate = buildPassEstimate({
      ...input,
      course,
      now,
      coverage,
      reviewedToday,
      studyDaysLast7: studyDates.length
    });

    return {
      reviewedToday,
      studyDaysLast7: studyDates.length,
      coverage,
      countdown: buildCountdown(course, now),
      passEstimate
    };
  }

  function buildPassEstimate(input) {
    const records = input.records || [];
    if (!records.length) {
      return {
        available: false,
        center: null,
        low: null,
        high: null,
        confidence: "证据不足"
      };
    }

    const total = Math.max(1, number(input.totalQuestions));
    const masteryCounts = input.masteryCounts || {};
    const mastered = number(masteryCounts["基本掌握"]) + number(masteryCounts["稳定掌握"]);
    const shallow = number(masteryCounts["浅层熟悉"]) + number(masteryCounts["假掌握"]);
    const unlearned = number(masteryCounts["未学"]);
    const recentScore = weightedRecentScore(records.slice(-3).map((record) => number(record.score)));
    const masteryScore = clamp(input.coverage * 70 + ratio(mastered, total) * 30 - ratio(unlearned, total) * 15, 0, 100);
    const riskScore = clamp(100 - ratio(input.highRiskCount, total) * 80 - ratio(shallow, total) * 40, 0, 100);
    const timePenalty = daysUntil(input.course, input.now) <= 2 && !input.reviewedToday ? 30 : 0;
    const engagementScore = clamp((input.studyDaysLast7 / 7) * 100 - timePenalty, 0, 100);
    const center = clamp(Math.round(recentScore * 0.45 + masteryScore * 0.25 + riskScore * 0.2 + engagementScore * 0.1), 5, 95);
    const evidence = getEvidenceBand(records.length, input.coverage);

    return {
      available: true,
      center,
      low: clamp(center - evidence.width, 5, 95),
      high: clamp(center + evidence.width, 5, 95),
      confidence: evidence.confidence
    };
  }

  function getEvidenceBand(recordCount, coverage) {
    if (recordCount >= 3 && coverage >= 0.5) {
      return { confidence: "较高", width: 8 };
    }
    if (recordCount >= 2 && coverage >= 0.2) {
      return { confidence: "中", width: 12 };
    }
    return { confidence: "低", width: 20 };
  }

  function buildCountdown(course, now) {
    if (!course?.examDate) {
      return { label: "考试时间待补", isElapsed: false };
    }
    if (!course.examTime) {
      return { label: `考试日 ${formatExamDate(course.examDate)}`, isElapsed: false };
    }
    const target = validDate(`${course.examDate}T${course.examTime}`);
    if (!target) {
      return { label: "考试时间待补", isElapsed: false };
    }
    const remaining = target.getTime() - now.getTime();
    if (remaining <= 0) {
      return { label: "已开考", isElapsed: true };
    }
    const days = Math.floor(remaining / DAY_MS);
    const hours = Math.floor((remaining % DAY_MS) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return {
      label: `距考试 ${days}天${hours}时${minutes}分`,
      isElapsed: false
    };
  }

  function uniqueStudyDates(events, now) {
    const start = startOfLocalDay(now).getTime() - DAY_MS * 6;
    const end = startOfLocalDay(now).getTime() + DAY_MS;
    return [...new Set(
      events
        .map((event) => validDate(event.createdAt))
        .filter((date) => date && date.getTime() >= start && date.getTime() < end)
        .map(localDateKey)
    )].sort();
  }

  function weightedRecentScore(scores) {
    if (scores.length === 1) return scores[0];
    if (scores.length === 2) return scores[0] * 0.4 + scores[1] * 0.6;
    return scores[0] * 0.2 + scores[1] * 0.3 + scores[2] * 0.5;
  }

  function daysUntil(course, now) {
    if (!course?.examDate) return 99;
    const time = course.examTime || "23:59";
    const target = validDate(`${course.examDate}T${time}`);
    if (!target) return 99;
    return Math.ceil((target.getTime() - now.getTime()) / DAY_MS);
  }

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function localDateKey(value) {
    const date = validDate(value);
    if (!date) return "";
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  }

  function formatExamDate(value) {
    const [year, month, day] = String(value).split("-");
    return year && month && day ? `${month}/${day}` : "待补";
  }

  function ratio(value, total) {
    const denominator = number(total);
    return denominator > 0 ? clamp(number(value) / denominator, 0, 1) : 0;
  }

  function number(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function validDate(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return { buildLearningStatus };
});
