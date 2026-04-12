// Vietnamese THPT exam scoring logic
// Default scoring: Phần I = 0.25pts/question, Phần II = partial credit, Phần III = 0.5pts/question
/** @typedef {import('./types.js').StudentResult} StudentResult */
/** @typedef {import('./types.js').TestConfig} TestConfig */
/** @typedef {import('./types.js').ScoreResult} ScoreResult */
/** @typedef {import('./types.js').TrueFalseAnswer} TrueFalseAnswer */

/** @type {import('./types.js').ScoringConfig} */
const DEFAULT_SCORING = {
  phanI: { pointsPerQuestion: 0.25 },
  phanII: { pointsPerQuestion: 0.25, partialCredit: true },
  phanIII: { pointsPerQuestion: 0.5 },
};

/**
 * Calculate score for a student result against the answer key.
 * @param {StudentResult} student
 * @param {TestConfig} config
 * @returns {ScoreResult}
 */
export function calculateScore(student, config) {
  const scoring = config.scoring ?? DEFAULT_SCORING;

  const phanI = scorePhanI(student.phanI, config.phanI.answers, scoring.phanI.pointsPerQuestion);
  const phanII = scorePhanII(
    student.phanII,
    config.phanII.answers,
    scoring.phanII.pointsPerQuestion,
    scoring.phanII.partialCredit
  );
  const phanIII = scorePhanIII(student.phanIII, config.phanIII.answers, scoring.phanIII.pointsPerQuestion);

  const total = phanI + phanII + phanIII;
  const maxTotal =
    config.phanI.questionCount * scoring.phanI.pointsPerQuestion +
    config.phanII.questionCount * scoring.phanII.pointsPerQuestion * 4 + // 4 sub-options each
    config.phanIII.questionCount * scoring.phanIII.pointsPerQuestion;

  return {
    phanI,
    phanII,
    phanIII,
    total: Math.round(total * 100) / 100,
    maxTotal: Math.round(maxTotal * 100) / 100,
    percentage: maxTotal > 0 ? Math.round((total / maxTotal) * 10000) / 100 : 0,
  };
}

/**
 * @param {string[]} studentAnswers
 * @param {string[]} correctAnswers
 * @param {number} pointsEach
 * @returns {number}
 */
function scorePhanI(studentAnswers, correctAnswers, pointsEach) {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    if (studentAnswers[i] && studentAnswers[i] === correctAnswers[i]) {
      score += pointsEach;
    }
  }
  return score;
}

/**
 * @param {TrueFalseAnswer[]} studentAnswers
 * @param {TrueFalseAnswer[]} correctAnswers
 * @param {number} pointsEach
 * @param {boolean} partialCredit
 * @returns {number}
 */
function scorePhanII(studentAnswers, correctAnswers, pointsEach, partialCredit) {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    const student = studentAnswers[i];
    const correct = correctAnswers[i];
    if (!student || !correct) continue;

    const subs = ['a', 'b', 'c', 'd'];
    let correctCount = 0;

    for (const sub of subs) {
      if (student[sub] === correct[sub]) {
        correctCount++;
      }
    }

    if (partialCredit) {
      // Each correct sub-option earns pointsEach
      score += correctCount * pointsEach;
    } else {
      // All-or-nothing: only full marks if all 4 match
      if (correctCount === 4) {
        score += pointsEach * 4;
      }
    }
  }
  return score;
}

/**
 * @param {string[]} studentAnswers
 * @param {string[]} correctAnswers
 * @param {number} pointsEach
 * @returns {number}
 */
function scorePhanIII(studentAnswers, correctAnswers, pointsEach) {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    if (studentAnswers[i] && studentAnswers[i] === correctAnswers[i]) {
      score += pointsEach;
    }
  }
  return score;
}
