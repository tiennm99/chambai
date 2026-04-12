// Draw debug overlay on processed answer sheet images
// Shows detected bubbles, answers, and confidence levels
import type { OpenCVMat } from '@/types/opencv';
import type { Bubble, ProcessingResult, TestConfig } from '@/types';
import { measureBubbleFill } from './image-preprocessing';

const COLORS = {
  allPositions: '#FF69B4',   // pink
  studentId: '#3B82F6',      // blue
  examCode: '#8B5CF6',       // purple
  correct: '#10B981',        // green
  wrong: '#EF4444',          // red
  unanswered: '#9CA3AF',     // gray
};

/**
 * Create a debug visualization canvas showing all detected bubbles and answers.
 * Returns a data URL of the annotated image.
 */
export function createDebugVisualization(
  originalCanvas: HTMLCanvasElement,
  bubbles: Bubble[],
  result: ProcessingResult,
  testConfig: TestConfig,
  gray: OpenCVMat
): string {
  const debugCanvas = document.createElement('canvas');
  const ctx = debugCanvas.getContext('2d');
  if (!ctx) return '';

  debugCanvas.width = originalCanvas.width;
  debugCanvas.height = originalCanvas.height;
  ctx.drawImage(originalCanvas, 0, 0);

  // Mark all bubble positions (pink outlines)
  drawAllPositions(ctx, bubbles);

  // Mark student ID and exam code (blue/purple)
  drawIdBubbles(ctx, bubbles, gray, 'studentId', COLORS.studentId);
  drawIdBubbles(ctx, bubbles, gray, 'examCode', COLORS.examCode);

  // Mark Phần I answers
  drawPhanIAnswers(ctx, bubbles, result, testConfig, gray);

  // Mark Phần II answers
  drawPhanIIAnswers(ctx, bubbles, result, testConfig);

  // Mark Phần III answers
  drawPhanIIIAnswers(ctx, bubbles, result, testConfig, gray);

  // Draw legend
  drawLegend(ctx);

  return debugCanvas.toDataURL();
}

function drawAllPositions(ctx: CanvasRenderingContext2D, bubbles: Bubble[]) {
  ctx.strokeStyle = COLORS.allPositions;
  ctx.lineWidth = 1;

  for (const bubble of bubbles) {
    const cx = bubble.x + bubble.width / 2;
    const cy = bubble.y + bubble.height / 2;
    const r = Math.max(bubble.width, bubble.height) / 2 + 2;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function drawIdBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  gray: OpenCVMat,
  section: string,
  color: string
) {
  const sectionBubbles = bubbles.filter((b) => b.section === section);

  for (const bubble of sectionBubbles) {
    const confidence = measureBubbleFill(bubble, gray);
    if (confidence <= 0.3) continue;

    const cx = bubble.x + bubble.width / 2;
    const cy = bubble.y + bubble.height / 2;
    const r = Math.max(bubble.width, bubble.height) / 2 + 4;

    ctx.strokeStyle = color;
    ctx.lineWidth = confidence > 0.4 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

function drawPhanIAnswers(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  result: ProcessingResult,
  config: TestConfig,
  gray: OpenCVMat
) {
  const section1 = bubbles.filter((b) => b.section === 'section1');

  for (const bubble of section1) {
    const q = bubble.question;
    if (!q || q > result.phanI.length) continue;

    const detected = result.phanI[q - 1];
    const correct = config.phanI.answers[q - 1];

    if (detected === bubble.option) {
      const confidence = measureBubbleFill(bubble, gray);
      if (confidence <= 0.3) continue;

      const isCorrect = detected === correct;
      const cx = bubble.x + bubble.width / 2;
      const cy = bubble.y + bubble.height / 2;
      const r = bubble.width / 2 + 4;

      ctx.strokeStyle = isCorrect ? COLORS.correct : COLORS.wrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

function drawPhanIIAnswers(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  result: ProcessingResult,
  config: TestConfig
) {
  const section2 = bubbles.filter((b) => b.section === 'section2');

  for (const bubble of section2) {
    const q = bubble.question;
    const sub = bubble.subOption as 'a' | 'b' | 'c' | 'd' | undefined;
    if (!q || !sub || q > result.phanII.length) continue;

    const detected = result.phanII[q - 1];
    const correct = config.phanII.answers[q - 1];
    if (!detected) continue;

    if (detected[sub] === bubble.value) {
      const isCorrect = correct?.[sub] === bubble.value;
      const cx = bubble.x + bubble.width / 2;
      const cy = bubble.y + bubble.height / 2;
      const r = bubble.width / 2 + 4;

      ctx.strokeStyle = isCorrect ? COLORS.correct : COLORS.wrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

function drawPhanIIIAnswers(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  result: ProcessingResult,
  config: TestConfig,
  gray: OpenCVMat
) {
  const section3 = bubbles.filter((b) => b.section === 'section3');

  for (const bubble of section3) {
    const q = bubble.question;
    if (!q || q > result.phanIII.length) continue;

    const detected = result.phanIII[q - 1];
    const correct = config.phanIII.answers[q - 1];

    if (bubble.digit?.toString() === detected) {
      const confidence = measureBubbleFill(bubble, gray);
      if (confidence <= 0.3) continue;

      const isCorrect = detected === correct;
      const cx = bubble.x + bubble.width / 2;
      const cy = bubble.y + bubble.height / 2;
      const r = bubble.width / 2 + 4;

      ctx.strokeStyle = isCorrect ? COLORS.correct : COLORS.wrong;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

function drawLegend(ctx: CanvasRenderingContext2D) {
  const entries = [
    { color: COLORS.allPositions, label: 'All Positions' },
    { color: COLORS.studentId, label: 'Student ID' },
    { color: COLORS.examCode, label: 'Exam Code' },
    { color: COLORS.correct, label: 'Correct' },
    { color: COLORS.wrong, label: 'Wrong' },
  ];

  const x = 10;
  const y = 10;
  const w = 160;
  const h = entries.length * 18 + 28;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Debug Legend', x + 8, y + 16);

  entries.forEach((entry, i) => {
    ctx.fillStyle = entry.color;
    ctx.beginPath();
    ctx.arc(x + 16, y + 32 + i * 18, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.fillText(entry.label, x + 28, y + 36 + i * 18);
  });
}
