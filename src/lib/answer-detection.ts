// Detect student answers by analyzing bubble fill levels
import type { OpenCVMat } from '@/types/opencv';
import type { Bubble, TrueFalseAnswer } from '@/types';
import { measureBubbleFill } from './image-preprocessing';

const FILL_THRESHOLD = 0.35;

/**
 * Detect student ID from bubble grid (8 digits, each column has rows 0-9).
 */
export function detectStudentId(bubbles: Bubble[], gray: OpenCVMat): string {
  const idBubbles = bubbles.filter((b) => b.section === 'studentId');
  if (idBubbles.length === 0) return 'UNKNOWN';

  // Group by column (each column = one digit position)
  const columns = groupByColumn(idBubbles);
  let studentId = '';

  for (let col = 0; col < 8; col++) {
    const colBubbles = columns[col] || [];
    const best = findBestFilled(colBubbles, gray);
    if (best && best.row !== undefined) {
      studentId += best.row.toString();
    }
  }

  return studentId || 'UNKNOWN';
}

/**
 * Detect exam code from bubble grid (4 digits).
 */
export function detectExamCode(bubbles: Bubble[], gray: OpenCVMat): string {
  const codeBubbles = bubbles.filter((b) => b.section === 'examCode');
  if (codeBubbles.length === 0) return '';

  const columns = groupByColumn(codeBubbles);
  let code = '';

  for (let col = 0; col < 4; col++) {
    const colBubbles = columns[col] || [];
    const best = findBestFilled(colBubbles, gray);
    if (best && best.row !== undefined) {
      code += best.row.toString();
    }
  }

  return code;
}

/**
 * Detect Phần I answers: multiple choice A/B/C/D for 40 questions.
 */
export function detectPhanIAnswers(
  bubbles: Bubble[],
  gray: OpenCVMat,
  questionCount: number = 40
): string[] {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section1');
  const questions = groupByQuestion(sectionBubbles);
  const answers: string[] = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = questions[q] || [];
    const best = findBestFilled(qBubbles, gray);
    answers.push(best?.option || '');
  }

  return answers;
}

/**
 * Detect Phần II answers: true/false for sub-options a,b,c,d per question.
 */
export function detectPhanIIAnswers(
  bubbles: Bubble[],
  gray: OpenCVMat,
  questionCount: number = 8
): TrueFalseAnswer[] {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section2');
  const answers: TrueFalseAnswer[] = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = sectionBubbles.filter((b) => b.question === q);
    const answer: TrueFalseAnswer = { a: false, b: false, c: false, d: false };

    for (const subOpt of ['a', 'b', 'c', 'd'] as const) {
      const subBubbles = qBubbles.filter((b) => b.subOption === subOpt);
      // Find which one is filled more (true or false bubble)
      const trueBubble = subBubbles.find((b) => b.value === true);
      const falseBubble = subBubbles.find((b) => b.value === false);

      const trueConf = trueBubble ? measureBubbleFill(trueBubble, gray) : 0;
      const falseConf = falseBubble ? measureBubbleFill(falseBubble, gray) : 0;

      // Only mark if at least one passes threshold
      if (trueConf > FILL_THRESHOLD || falseConf > FILL_THRESHOLD) {
        answer[subOpt] = trueConf > falseConf;
      }
    }

    answers.push(answer);
  }

  return answers;
}

/**
 * Detect Phần III answers: numerical digits 0-9.
 */
export function detectPhanIIIAnswers(
  bubbles: Bubble[],
  gray: OpenCVMat,
  questionCount: number = 6
): string[] {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section3');
  const questions = groupByQuestion(sectionBubbles);
  const answers: string[] = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = questions[q] || [];
    const best = findBestFilled(qBubbles, gray);
    answers.push(best?.digit?.toString() ?? '');
  }

  return answers;
}

// --- Helpers ---

function groupByColumn(bubbles: Bubble[]): Record<number, Bubble[]> {
  const groups: Record<number, Bubble[]> = {};
  for (const b of bubbles) {
    if (b.column !== undefined) {
      (groups[b.column] ??= []).push(b);
    }
  }
  return groups;
}

function groupByQuestion(bubbles: Bubble[]): Record<number, Bubble[]> {
  const groups: Record<number, Bubble[]> = {};
  for (const b of bubbles) {
    if (b.question !== undefined) {
      (groups[b.question] ??= []).push(b);
    }
  }
  return groups;
}

/**
 * Find the bubble with highest fill confidence above threshold.
 */
function findBestFilled(bubbles: Bubble[], gray: OpenCVMat): Bubble | null {
  let best: Bubble | null = null;
  let bestConf = FILL_THRESHOLD;

  for (const bubble of bubbles) {
    const conf = measureBubbleFill(bubble, gray);
    if (conf > bestConf) {
      bestConf = conf;
      best = bubble;
    }
  }

  return best;
}
