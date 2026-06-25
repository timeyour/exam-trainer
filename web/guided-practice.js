(function exposeGuidedPractice(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.GuidedPractice = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createGuidedPractice() {
  function buildGuidedRound(input = {}) {
    const courseId = input.courseId;
    const eligible = (input.questions || []).filter(isEligibleQuestion);
    const masteryById = new Map(
      (input.masteryItems || [])
        .filter((item) => item?.courseId === courseId)
        .map((item) => [item.questionId, item])
    );
    const wrongById = new Map(
      (input.wrongPoolItems || [])
        .filter((item) => item?.courseId === courseId)
        .map((item) => [item.questionId, item])
    );

    if (input.full) {
      const allQuestionIds = unique(randomizeItems(eligible, input.randomize).map((item) => item.id));
      return {
        learnQuestionIds: allQuestionIds,
        quizQuestionIds: unique(randomizeItems(eligible, input.randomize).map((item) => item.id))
      };
    }

    const candidates = eligible.filter((question) => {
      const mastery = masteryById.get(question.id);
      const wrong = wrongById.get(question.id);
      return (
        (!mastery || mastery.status === "未学") &&
        (number(mastery?.guidedRecallCorrectCount) < 2) &&
        (!wrong || wrong.lastReason === "没学过")
      );
    });

    const safeFallback = eligible.filter((question) => {
      const mastery = masteryById.get(question.id);
      const wrong = wrongById.get(question.id);
      return (
        (!mastery || mastery.status === "未学") &&
        (number(mastery?.guidedRecallCorrectCount) < 2) &&
        (!wrong || wrong.lastReason === "没学过")
      );
    });

    const learnPool = candidates.length ? candidates : safeFallback;
    const learnQuestionIds = unique(
      randomizeItems(learnPool, input.randomize).map((item) => item.id)
    ).slice(0, number(input.learnCount, 3));

    const learnedChapters = new Set(
      learnQuestionIds
        .map((id) => eligible.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) => item.chapter)
    );
    const related = eligible.filter((item) => learnedChapters.has(item.chapter));

    const quizQuestionIds = unique([
      ...learnQuestionIds,
      ...randomizeItems(related, input.randomize).map((item) => item.id),
      ...randomizeItems(eligible, input.randomize).map((item) => item.id)
    ]).slice(0, number(input.quizCount, 3));

    return { learnQuestionIds, quizQuestionIds };
  }

  function randomizeItems(items, randomize) {
    const fn = typeof randomize === "function" ? randomize : shuffle;
    const result = fn(Array.isArray(items) ? items.slice() : []);
    return Array.isArray(result) ? result : [];
  }

  function isEligibleQuestion(question) {
    return (
      Boolean(question?.id) &&
      ["single", "multiple", "judge"].includes(question.type) &&
      Array.isArray(question.options) &&
      question.options.length >= 2 &&
      question.validForExam !== false &&
      question.validForStudy !== false
    );
  }

  function unique(items) {
    const seen = new Set();
    const output = [];
    for (const item of items || []) {
      if (seen.has(item)) continue;
      seen.add(item);
      output.push(item);
    }
    return output;
  }

  function shuffle(items) {
    const output = Array.isArray(items) ? items.slice() : [];
    for (let index = output.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
    }
    return output;
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return { buildGuidedRound };
});
