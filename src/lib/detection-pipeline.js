// Full OMR detection pipeline — pure function, no React/DOM deps (except cv global)
import { preprocessForBubbleDetection, computeAdaptiveThreshold } from './image-preprocessing';
import { detectCornerMarkers, applyPerspectiveCorrection } from './marker-detection';
import { generateBubbleGrid } from './bubble-grid-generator';
import {
  detectStudentId,
  detectExamCode,
  detectPhanIAnswers,
  detectPhanIIAnswers,
  detectPhanIIIAnswers,
} from './answer-detection';
import { checkImageQuality } from './image-quality-check';
import { createDebugVisualization } from './debug-visualization';

/**
 * Run full OMR detection pipeline on image data.
 * Works on main thread (window.cv) or in Web Worker (self.cv).
 * @param {ImageData} imageData - pixel data from canvas
 * @param {HTMLCanvasElement|null} originalCanvas - for debug viz (null in Worker)
 * @param {object} testConfig - answer key configuration
 * @returns {{ result: object, debugUrl: string|null }}
 */
export function runDetectionPipeline(imageData, originalCanvas, testConfig) {
  const cv = (typeof self !== 'undefined' && self.cv) || window.cv;

  const src = cv.matFromImageData(imageData);
  const { gray, thresh } = preprocessForBubbleDetection(src);
  const markers = detectCornerMarkers(thresh, imageData.width, imageData.height);

  const qualityReport = checkImageQuality(gray, markers, imageData.width, imageData.height);

  const { corrected, markers: activeMarkers, applied: perspectiveApplied } =
    applyPerspectiveCorrection(gray, markers, imageData.width, imageData.height);

  const activeGray = perspectiveApplied ? corrected : gray;
  const activeWidth = perspectiveApplied ? corrected.cols : imageData.width;
  const activeHeight = perspectiveApplied ? corrected.rows : imageData.height;

  const bubbles = generateBubbleGrid(activeMarkers, activeWidth, activeHeight);
  const fillThreshold = computeAdaptiveThreshold(bubbles, activeGray);

  const studentId = detectStudentId(bubbles, activeGray, fillThreshold);
  const examCode = detectExamCode(bubbles, activeGray, fillThreshold);
  const { answers: phanI, confidenceMap } = detectPhanIAnswers(
    bubbles, activeGray, testConfig.phanI.questionCount, fillThreshold
  );
  const phanII = detectPhanIIAnswers(bubbles, activeGray, testConfig.phanII.questionCount, fillThreshold);
  const phanIII = detectPhanIIIAnswers(bubbles, activeGray, testConfig.phanIII.questionCount, fillThreshold);

  const result = {
    studentId,
    examCode,
    phanI,
    phanII,
    phanIII,
    confidenceMap,
    fillThreshold,
    confidence: 0.85,
  };

  // Debug visualization only works on main thread with canvas
  const debugUrl = originalCanvas
    ? createDebugVisualization(originalCanvas, bubbles, result, testConfig, activeGray)
    : null;

  src.delete();
  gray.delete();
  thresh.delete();
  if (perspectiveApplied) corrected.delete();

  return { result: { ...result, debugImageUrl: debugUrl, qualityReport }, debugUrl };
}
