// Generate bubble grid positions based on Vietnamese THPT answer sheet layout
// Layout reference: Công văn 1239/BGDĐT (2025 format)
// Sections: Student ID (8 digits) + Exam Code (4 digits) + Phần I + Phần II + Phần III
import type { Bubble, MarkerDetectionResult } from '@/types';

interface SheetLayout {
  // All values are ratios (0-1) relative to the sheet bounding box
  studentId: { x: number; y: number; w: number; h: number; cols: number; rows: number };
  examCode: { x: number; y: number; w: number; h: number; cols: number; rows: number };
  phanI: { x: number; y: number; w: number; h: number; questionCols: number; questionsPerCol: number };
  phanII: { x: number; y: number; w: number; h: number; questions: number; subOptions: number };
  phanIII: { x: number; y: number; w: number; h: number; questions: number; digits: number };
}

// Vietnamese THPT answer sheet proportional layout (2025 format)
// These ratios are relative to the answer area bounded by corner markers
const SHEET_LAYOUT: SheetLayout = {
  // Student ID: top-right area, 8 columns x 10 rows (digits 0-9)
  studentId: { x: 0.65, y: 0.02, w: 0.25, h: 0.18, cols: 8, rows: 10 },
  // Exam code: next to student ID, 4 columns x 10 rows
  examCode: { x: 0.45, y: 0.02, w: 0.15, h: 0.18, cols: 4, rows: 10 },
  // Phần I: multiple choice (A,B,C,D), 4 question columns x 10 rows = 40 questions
  phanI: { x: 0.03, y: 0.25, w: 0.94, h: 0.30, questionCols: 4, questionsPerCol: 10 },
  // Phần II: true/false, 4 question columns x 2 rows (8 questions, each with a,b,c,d sub-options)
  phanII: { x: 0.03, y: 0.58, w: 0.94, h: 0.15, questions: 8, subOptions: 4 },
  // Phần III: numerical answers, 6 questions x 10 digits (0-9)
  phanIII: { x: 0.03, y: 0.76, w: 0.94, h: 0.22, questions: 6, digits: 10 },
};

/**
 * Generate all bubble positions based on detected markers and known sheet layout.
 */
export function generateBubbleGrid(
  markers: MarkerDetectionResult,
  imageWidth: number,
  imageHeight: number
): Bubble[] {
  const box = markers.boundingBox ?? {
    left: imageWidth * 0.03,
    top: imageHeight * 0.03,
    width: imageWidth * 0.94,
    height: imageHeight * 0.94,
    right: imageWidth * 0.97,
    bottom: imageHeight * 0.97,
  };

  const bubbles: Bubble[] = [];
  const layout = SHEET_LAYOUT;

  // Helper: convert layout ratios to absolute pixel positions
  const abs = (ratioX: number, ratioY: number) => ({
    x: box.left + ratioX * box.width,
    y: box.top + ratioY * box.height,
  });

  generateStudentIdBubbles(bubbles, layout.studentId, abs, box);
  generateExamCodeBubbles(bubbles, layout.examCode, abs, box);
  generatePhanIBubbles(bubbles, layout.phanI, abs, box);
  generatePhanIIBubbles(bubbles, layout.phanII, abs, box);
  generatePhanIIIBubbles(bubbles, layout.phanIII, abs, box);

  return bubbles;
}

type AbsFn = (rx: number, ry: number) => { x: number; y: number };
type Box = { width: number; height: number };

const BUBBLE_SIZE_RATIO = 0.012; // bubble size relative to sheet width

function bubbleSize(box: Box): number {
  return Math.max(8, Math.round(box.width * BUBBLE_SIZE_RATIO));
}

function generateStudentIdBubbles(
  bubbles: Bubble[],
  area: SheetLayout['studentId'],
  abs: AbsFn,
  box: Box
) {
  const size = bubbleSize(box);
  const colSpacing = area.w / area.cols;
  const rowSpacing = area.h / (area.rows + 1); // +1 for header space

  for (let col = 0; col < area.cols; col++) {
    for (let row = 0; row < area.rows; row++) {
      const pos = abs(
        area.x + col * colSpacing + colSpacing * 0.5,
        area.y + (row + 1) * rowSpacing
      );
      bubbles.push({
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        area: size * size,
        circularity: 0.9,
        section: 'studentId',
        column: col,
        row: row, // row = digit value (0-9)
      });
    }
  }
}

function generateExamCodeBubbles(
  bubbles: Bubble[],
  area: SheetLayout['examCode'],
  abs: AbsFn,
  box: Box
) {
  const size = bubbleSize(box);
  const colSpacing = area.w / area.cols;
  const rowSpacing = area.h / (area.rows + 1);

  for (let col = 0; col < area.cols; col++) {
    for (let row = 0; row < area.rows; row++) {
      const pos = abs(
        area.x + col * colSpacing + colSpacing * 0.5,
        area.y + (row + 1) * rowSpacing
      );
      bubbles.push({
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        area: size * size,
        circularity: 0.9,
        section: 'examCode',
        column: col,
        row: row,
      });
    }
  }
}

function generatePhanIBubbles(
  bubbles: Bubble[],
  area: SheetLayout['phanI'],
  abs: AbsFn,
  box: Box
) {
  const size = bubbleSize(box);
  const { questionCols, questionsPerCol } = area;
  const colGroupWidth = area.w / questionCols;
  const rowSpacing = area.h / (questionsPerCol + 1);
  const options = ['A', 'B', 'C', 'D'];
  // Within each question column, space for question number + 4 option bubbles
  const optionSpacing = colGroupWidth * 0.15;
  const optionStartOffset = colGroupWidth * 0.25; // skip question number area

  for (let qCol = 0; qCol < questionCols; qCol++) {
    for (let qRow = 0; qRow < questionsPerCol; qRow++) {
      const questionNum = qCol * questionsPerCol + qRow + 1;
      for (let optIdx = 0; optIdx < options.length; optIdx++) {
        const pos = abs(
          area.x + qCol * colGroupWidth + optionStartOffset + optIdx * optionSpacing,
          area.y + (qRow + 1) * rowSpacing
        );
        bubbles.push({
          x: pos.x,
          y: pos.y,
          width: size,
          height: size,
          area: size * size,
          circularity: 0.9,
          section: 'section1',
          question: questionNum,
          option: options[optIdx],
        });
      }
    }
  }
}

function generatePhanIIBubbles(
  bubbles: Bubble[],
  area: SheetLayout['phanII'],
  abs: AbsFn,
  box: Box
) {
  const size = bubbleSize(box);
  const { questions, subOptions } = area;
  // Layout: 4 questions per row, 2 rows
  const qPerRow = 4;
  const qRows = Math.ceil(questions / qPerRow);
  const colWidth = area.w / qPerRow;
  const rowHeight = area.h / qRows;
  const subOptionLabels = ['a', 'b', 'c', 'd'];
  const tfSpacing = colWidth * 0.18;
  const subRowSpacing = rowHeight / (subOptions + 1);

  for (let q = 0; q < questions; q++) {
    const qCol = q % qPerRow;
    const qRow = Math.floor(q / qPerRow);

    for (let sub = 0; sub < subOptions; sub++) {
      // "Đúng" bubble
      const posTrue = abs(
        area.x + qCol * colWidth + colWidth * 0.4,
        area.y + qRow * rowHeight + (sub + 1) * subRowSpacing
      );
      bubbles.push({
        x: posTrue.x,
        y: posTrue.y,
        width: size,
        height: size,
        area: size * size,
        circularity: 0.9,
        section: 'section2',
        question: q + 1,
        subOption: subOptionLabels[sub],
        value: true,
      });

      // "Sai" bubble
      const posFalse = abs(
        area.x + qCol * colWidth + colWidth * 0.4 + tfSpacing,
        area.y + qRow * rowHeight + (sub + 1) * subRowSpacing
      );
      bubbles.push({
        x: posFalse.x,
        y: posFalse.y,
        width: size,
        height: size,
        area: size * size,
        circularity: 0.9,
        section: 'section2',
        question: q + 1,
        subOption: subOptionLabels[sub],
        value: false,
      });
    }
  }
}

function generatePhanIIIBubbles(
  bubbles: Bubble[],
  area: SheetLayout['phanIII'],
  abs: AbsFn,
  box: Box
) {
  const size = bubbleSize(box);
  const { questions, digits } = area;
  const colWidth = area.w / questions;
  const rowSpacing = area.h / (digits + 1);

  for (let q = 0; q < questions; q++) {
    for (let digit = 0; digit < digits; digit++) {
      const pos = abs(
        area.x + q * colWidth + colWidth * 0.5,
        area.y + (digit + 1) * rowSpacing
      );
      bubbles.push({
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        area: size * size,
        circularity: 0.9,
        section: 'section3',
        question: q + 1,
        digit: digit,
      });
    }
  }
}
