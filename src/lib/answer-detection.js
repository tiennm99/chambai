// Detect student answers by analyzing bubble fill levels
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Bubble} Bubble */
/** @typedef {import('./types.js').TrueFalseAnswer} TrueFalseAnswer */
import { measureBubbleFill } from './image-preprocessing';

const FILL_THRESHOLD = 0.35;

/**
 * Detect student ID from bubble grid (8 digits, each column has rows 0-9).
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @returns {string}
 */
export function detectStudentId(bubbles, gray) {
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
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @returns {string}
 */
export function detectExamCode(bubbles, gray) {
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
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=40]
 * @returns {string[]}
 */
export function detectPhanIAnswers(bubbles, gray, questionCount = 40) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section1');
  const questions = groupByQuestion(sectionBubbles);
  /** @type {string[]} */
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = questions[q] || [];
    const best = findBestFilled(qBubbles, gray);
    answers.push(best?.option || '');
  }

  return answers;
}

/**
 * Detect Phần II answers: true/false for sub-options a,b,c,d per question.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=8]
 * @returns {TrueFalseAnswer[]}
 */
export function detectPhanIIAnswers(bubbles, gray, questionCount = 8) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section2');
  /** @type {TrueFalseAnswer[]} */
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = sectionBubbles.filter((b) => b.question === q);
    /** @type {TrueFalseAnswer} */
    const answer = { a: false, b: false, c: false, d: false };

    for (const subOpt of ['a', 'b', 'c', 'd']) {
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
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @param {number} [questionCount=6]
 * @returns {string[]}
 */
export function detectPhanIIIAnswers(bubbles, gray, questionCount = 6) {
  const sectionBubbles = bubbles.filter((b) => b.section === 'section3');
  const questions = groupByQuestion(sectionBubbles);
  /** @type {string[]} */
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = questions[q] || [];
    const best = findBestFilled(qBubbles, gray);
    answers.push(best?.digit?.toString() ?? '');
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
 * Find the bubble with highest fill confidence above threshold.
 * @param {Bubble[]} bubbles
 * @param {OpenCVMat} gray
 * @returns {Bubble | null}
 */
function findBestFilled(bubbles, gray) {
  /** @type {Bubble | null} */
  let best = null;
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
