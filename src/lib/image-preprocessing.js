// Image preprocessing: grayscale conversion, thresholding, noise reduction, resize
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Bubble} Bubble */

const MAX_PROCESSING_WIDTH = 2000;

/**
 * Downscale canvas to max width for faster, more reliable processing.
 * Phone photos (12MP+) are too large for accurate bubble grid alignment.
 * @param {HTMLCanvasElement} canvas
 * @returns {HTMLCanvasElement} - resized canvas (or original if already small enough)
 */
export function resizeForProcessing(canvas) {
  if (canvas.width <= MAX_PROCESSING_WIDTH) return canvas;
  const scale = MAX_PROCESSING_WIDTH / canvas.width;
  const resized = document.createElement('canvas');
  resized.width = MAX_PROCESSING_WIDTH;
  resized.height = Math.round(canvas.height * scale);
  const ctx = resized.getContext('2d');
  ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
  return resized;
}

/**
 * Convert image to grayscale and apply adaptive thresholding.
 * Uses simple, reliable preprocessing that works in opencv.js browser build.
 * @param {OpenCVMat} src - Source RGBA image matrix
 * @returns {{ gray: OpenCVMat, thresh: OpenCVMat }}
 */
export function preprocessForBubbleDetection(src) {
  const cv = window.cv;

  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // Adaptive threshold - works well for scanned/photographed answer sheets
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(
    blurred,
    thresh,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    15,
    4
  );

  // Morphological close to fill small gaps in bubbles
  const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
  const closed = new cv.Mat();
  cv.morphologyEx(thresh, closed, cv.MORPH_CLOSE, kernel);

  blurred.delete();
  thresh.delete();
  kernel.delete();

  return { gray, thresh: closed };
}

/**
 * Compute adaptive fill threshold from empty bubble regions.
 * Measures fill of all bubbles, uses low-fill ones as "empty" baseline,
 * then sets threshold above that baseline.
 * @param {Bubble[]} bubbles - all bubbles from grid
 * @param {OpenCVMat} gray - grayscale image
 * @returns {number} - fill threshold (clamped 0.25-0.50, fallback 0.35)
 */
export function computeAdaptiveThreshold(bubbles, gray) {
  const fills = bubbles.map((b) => measureBubbleFill(b, gray));
  const empties = fills.filter((f) => f < 0.3);
  if (empties.length < 20) return 0.35;

  const mean = empties.reduce((a, b) => a + b, 0) / empties.length;
  const stddev = Math.sqrt(
    empties.reduce((a, v) => a + (v - mean) ** 2, 0) / empties.length
  );
  const threshold = Math.min(0.5, Math.max(0.25, mean + 1.5 * stddev));
  return Math.round(threshold * 100) / 100;
}

/**
 * Check how filled a bubble region is by analyzing pixel intensity.
 * Returns a confidence score 0.0 (empty) to 1.0 (fully filled).
 * @param {{ x: number, y: number, width: number, height: number }} bubble
 * @param {OpenCVMat} gray - Grayscale image matrix
 * @returns {number}
 */
export function measureBubbleFill(bubble, gray) {
  const cv = window.cv;

  try {
    // Clamp ROI to image bounds
    const x = Math.max(0, Math.round(bubble.x));
    const y = Math.max(0, Math.round(bubble.y));
    const w = Math.min(bubble.width, gray.cols - x);
    const h = Math.min(bubble.height, gray.rows - y);

    if (w <= 0 || h <= 0) return 0;

    const rect = new cv.Rect(x, y, w, h);
    const roi = gray.roi(rect);

    // Mean intensity: lower = darker = more filled
    const meanValue = cv.mean(roi);
    const fillConfidence = 1.0 - meanValue[0] / 255.0;

    roi.delete();
    return fillConfidence;
  } catch {
    return 0;
  }
}
