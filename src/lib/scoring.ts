// Vietnamese THPT exam scoring logic
// Default scoring: Phần I = 0.25pts/question, Phần II = partial credit, Phần III = 0.5pts/question
import type { StudentResult, TestConfig, ScoreResult, ScoringConfig, TrueFalseAnswer } from '@/types';

const DEFAULT_SCORING: ScoringConfig = {
  phanI: { pointsPerQuestion: 0.25 },
  phanII: { pointsPerQuestion: 0.25, partialCredit: true },
  phanIII: { pointsPerQuestion: 0.5 },
};

/**
 * Calculate score for a student result against the answer key.
 */
export function calculateScore(student: StudentResult, config: TestConfig): ScoreResult {
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

function scorePhanI(studentAnswers: string[], correctAnswers: string[], pointsEach: number): number {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    if (studentAnswers[i] && studentAnswers[i] === correctAnswers[i]) {
      score += pointsEach;
    }
  }
  return score;
}

function scorePhanII(
  studentAnswers: TrueFalseAnswer[],
  correctAnswers: TrueFalseAnswer[],
  pointsEach: number,
  partialCredit: boolean
): number {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    const student = studentAnswers[i];
    const correct = correctAnswers[i];
    if (!student || !correct) continue;

    const subs: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
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

function scorePhanIII(studentAnswers: string[], correctAnswers: string[], pointsEach: number): number {
  let score = 0;
  for (let i = 0; i < correctAnswers.length; i++) {
    if (studentAnswers[i] && studentAnswers[i] === correctAnswers[i]) {
      score += pointsEach;
    }
  }
  return score;
}
