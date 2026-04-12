// Image preprocessing: grayscale conversion, thresholding, noise reduction
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Bubble} Bubble */

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
