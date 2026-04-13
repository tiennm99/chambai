// Detect student answers by analyzing bubble fill levels
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Bubble} Bubble */
/** @typedef {import('./types.js').TrueFalseAnswer} TrueFalseAnswer */
import { measureBubbleFill } from './image-preprocessing';

const DEFAULT_FILL_THRESHOLD = 0.35;

/**
 * Detect student ID from bubble grid (8 digits, each column has rows 0-9).
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [threshold]
 * @returns {string}
 */
export function detectStudentId(bubbles, gray, threshold = DEFAULT_FILL_THRESHOLD) {
  const idBubbles = bubbles.filter((b) => b.section === 'studentId');
  if (idBubbles.length === 0) return 'UNKNOWN';

  const columns = groupByColumn(idBubbles);
  let studentId = '';

  for (let col = 0; col < 8; col++) {
    const colBubbles = columns[col] || [];
    const best = findBestFilled(colBubbles, gray, threshold);
    if (best && best.row !== undefined) {
      studentId += best.row.toString();
    }
  }

  return studentId || 'UNKNOWN';
}

/**
 * Detect exam code from bubble grid (4 digits).
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [threshold]
 * @returns {string}
 */
export function detectExamCode(bubbles, gray, threshold = DEFAULT_FILL_THRESHOLD) {
  const codeBubbles = bubbles.filter((b) => b.section === 'examCode');
  if (codeBubbles.length === 0) return '';

  const columns = groupByColumn(codeBubbles);
  let code = '';

  for (let col = 0; col < 4; col++) {
    const colBubbles = columns[col] || [];
    const best = findBestFilled(colBubbles, gray, threshold);
    if (best && best.row !== undefined) {
      code += best.row.toString();
    }
  }

  return code;
}

/**
 * Detect Phần I answers: multiple choice A/B/C/D for 40 questions.
 * Also returns confidence map with fill values per option.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=40]
 * @param {number} [threshold]
 * @returns {{ answers: string[], confidenceMap: Record<number, Record<string, number>> }}
 */
export function detectPhanIAnswers(bubbles, gray, questionCount = 40, threshold = DEFAULT_FILL_THRESHOLD) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section1');
  const questions = groupByQuestion(sectionBubbles);
  /** @type {string[]} */
  const answers = [];
  /** @type {Record<number, Record<string, number>>} */
  const confidenceMap = {};

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = questions[q] || [];
    /** @type {Record<string, number>} */
    const fills = {};
    for (const b of qBubbles) {
      if (b.option) fills[b.option] = measureBubbleFill(b, gray);
    }
    confidenceMap[q] = fills;
    const best = findBestFilled(qBubbles, gray, threshold);
    answers.push(best?.option || '');
  }

  return { answers, confidenceMap };
}

/**
 * Detect Phần II answers: true/false for sub-options a,b,c,d per question.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=8]
 * @param {number} [threshold]
 * @returns {TrueFalseAnswer[]}
 */
export function detectPhanIIAnswers(bubbles, gray, questionCount = 8, threshold = DEFAULT_FILL_THRESHOLD) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section2');
  /** @type {TrueFalseAnswer[]} */
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = sectionBubbles.filter((b) => b.question === q);
    /** @type {TrueFalseAnswer} */
    const answer = { a: false, b: false, c: false, d: false };

    for (const subOpt of ['a', 'b', 'c', 'd']) {
      const subBubbles = qBubbles.filter((b) => b.subOption === subOpt);
      const trueBubble = subBubbles.find((b) => b.value === true);
      const falseBubble = subBubbles.find((b) => b.value === false);

      const trueConf = trueBubble ? measureBubbleFill(trueBubble, gray) : 0;
      const falseConf = falseBubble ? measureBubbleFill(falseBubble, gray) : 0;

      if (trueConf > threshold || falseConf > threshold) {
        answer[subOpt] = trueConf > falseConf;
      }
    }

    answers.push(answer);
  }

  return answers;
}

// Number of character positions per Phần III question (must match SHEET_LAYOUT)
const PHAN_III_CHARS_PER_QUESTION = 5;

/**
 * Detect Phần III answers: multi-character numerical strings (e.g. "-1,5").
 * Each question has `charsPerQuestion` character positions; each position
 * finds the best-filled bubble and reads its charValue.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=6]
 * @param {number} [threshold]
 * @returns {string[]}
 */
export function detectPhanIIIAnswers(bubbles, gray, questionCount = 6, threshold = DEFAULT_FILL_THRESHOLD) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section3');
  const byQuestion = groupByQuestion(sectionBubbles);
  /** @type {string[]} */
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = byQuestion[q] || [];
    const byCharPos = groupByField(qBubbles, 'charPosition');
    let answer = '';

    for (let pos = 0; pos < PHAN_III_CHARS_PER_QUESTION; pos++) {
      const posBubbles = byCharPos[pos] || [];
      const best = findBestFilled(posBubbles, gray, threshold);
      if (best?.charValue !== undefined) {
        answer += best.charValue;
      }
    }

    answers.push(answer.trimEnd());
  }

  return answers;
}

// --- Helpers ---

/**
 * @param {Bubble[]} bubbles
 * @returns {Record<number, Bubble[]>}
 */
function groupByColumn(bubbles) {
  /** @type {Record<number, Bubble[]>} */
  const groups = {};
  for (const b of bubbles) {
    if (b.column !== undefined) {
      (groups[b.column] ??= []).push(b);
    }
  }
  return groups;
}

/**
 * @param {Bubble[]} bubbles
 * @returns {Record<number, Bubble[]>}
 */
function groupByQuestion(bubbles) {
  /** @type {Record<number, Bubble[]>} */
  const groups = {};
  for (const b of bubbles) {
    if (b.question !== undefined) {
      (groups[b.question] ??= []).push(b);
    }
  }
  return groups;
}

/**
 * Group bubbles by an arbitrary numeric field value.
 * @param {Bubble[]} bubbles
 * @param {string} fieldName
 * @returns {Record<number, Bubble[]>}
 */
function groupByField(bubbles, fieldName) {
  /** @type {Record<number, Bubble[]>} */
  const groups = {};
  for (const b of bubbles) {
    const val = b[fieldName];
    if (val !== undefined) {
      (groups[val] ??= []).push(b);
    }
  }
  return groups;
}

/**
 * Find the bubble with highest fill confidence above threshold.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [threshold]
 * @returns {Bubble | null}
 */
function findBestFilled(bubbles, gray, threshold = DEFAULT_FILL_THRESHOLD) {
  /** @type {Bubble | null} */
  let best = null;
  let bestConf = threshold;

  for (const bubble of bubbles) {
    const conf = measureBubbleFill(bubble, gray);
    if (conf > bestConf) {
      bestConf = conf;
      best = bubble;
    }
  }

  return best;
}
