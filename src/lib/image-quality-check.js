// Image quality validation: blur, resolution, marker checks before processing
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */

/**
 * @typedef {Object} QualityIssue
 * @property {'resolution'|'blur'|'markers'} type
 * @property {string} message
 */

/**
 * @typedef {Object} QualityReport
 * @property {boolean} passed
 * @property {QualityIssue[]} issues
 * @property {{ resolution: string, blurVariance: number, markersFound: number }} metrics
 */

/**
 * Validate image quality before full detection pipeline.
 * Checks resolution, blur level, and corner marker presence.
 * @param {OpenCVMat} gray - grayscale image
 * @param {{ corners: Array }} markers - detected corner markers
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {QualityReport}
 */
export function checkImageQuality(gray, markers, imageWidth, imageHeight) {
  const cv = window.cv;
  /** @type {QualityIssue[]} */
  const issues = [];

  // Resolution check — too small for reliable bubble detection
  if (imageWidth < 800 || imageHeight < 1000) {
    issues.push({
      type: 'resolution',
      message: `Ảnh quá nhỏ (${imageWidth}x${imageHeight}px, cần >= 800x1000px)`,
    });
  }

  // Blur detection via Laplacian variance
  let variance = 0;
  try {
    const laplacian = new cv.Mat();
    cv.Laplacian(gray, laplacian, cv.CV_64F);
    const meanMat = new cv.Mat();
    const stdDevMat = new cv.Mat();
    cv.meanStdDev(laplacian, meanMat, stdDevMat);
    variance = stdDevMat.data64F[0] ** 2;
    laplacian.delete();
    meanMat.delete();
    stdDevMat.delete();
  } catch {
    // If Laplacian fails, skip blur check rather than blocking
    variance = Infinity;
  }

  if (variance < 100) {
    issues.push({
      type: 'blur',
      message: 'Ảnh bị mờ, vui lòng chụp lại rõ hơn',
    });
  }

  // Corner marker check — need 4 for reliable alignment
  const markersFound = markers?.corners?.length ?? 0;
  if (markersFound < 4) {
    issues.push({
      type: 'markers',
      message: `Chỉ tìm thấy ${markersFound}/4 dấu góc định vị`,
    });
  }

  return {
    passed: issues.length === 0,
    issues,
    metrics: {
      resolution: `${imageWidth}x${imageHeight}`,
      blurVariance: Math.round(variance),
      markersFound,
    },
  };
}
