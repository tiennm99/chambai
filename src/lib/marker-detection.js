// Detect answer sheet boundary via contour detection + perspective correction
// Primary: find largest rectangular contour (the sheet border)
// Fallback: detect corner marker squares (extracted to corner-marker-fallback.js)
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').MarkerDetectionResult} MarkerDetectionResult */

import { detectCornerMarkers } from './corner-marker-fallback';

/**
 * Detect the answer sheet boundary by finding the largest rectangular contour.
 * Falls back to corner marker detection if no rectangle found.
 * @param {OpenCVMat} thresh - Binary inverted thresholded image
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {MarkerDetectionResult}
 */
export function detectSheetContour(thresh, imageWidth, imageHeight) {
  const cv = (typeof self !== 'undefined' && self.cv) || window.cv;
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  // RETR_EXTERNAL = outermost contours only (the sheet border, not inner grid lines)
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const imageArea = imageWidth * imageHeight;
  let bestApprox = null;
  let bestArea = 0;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);

    // Sheet must be at least 10% of image area
    if (area < imageArea * 0.1) continue;

    const peri = cv.arcLength(contour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(contour, approx, 0.02 * peri, true);

    if (approx.rows === 4 && area > bestArea) {
      const rect = cv.boundingRect(contour);
      const aspect = rect.width / rect.height;
      // Portrait A4 ≈ 0.7, allow 0.4-1.2 for rotated/cropped sheets
      if (aspect > 0.4 && aspect < 1.2) {
        if (bestApprox) bestApprox.delete();
        bestApprox = approx;
        bestArea = area;
      } else {
        approx.delete();
      }
    } else {
      approx.delete();
    }
  }

  let result;
  if (bestApprox) {
    const corners = orderCornerPoints(bestApprox);
    bestApprox.delete();
    result = buildMarkerResult(corners);
  } else {
    // Fallback: try old corner marker detection
    result = detectCornerMarkers(thresh, imageWidth, imageHeight, contours);
  }

  contours.delete();
  hierarchy.delete();
  return result;
}

/**
 * Order 4 points from approxPolyDP as [TL, TR, BR, BL].
 * Sort by y (top vs bottom), then by x within each pair.
 * @param {OpenCVMat} approx - 4x1 matrix from approxPolyDP
 * @returns {{ topLeft: Point, topRight: Point, bottomRight: Point, bottomLeft: Point }}
 */
function orderCornerPoints(approx) {
  const points = [];
  for (let i = 0; i < 4; i++) {
    points.push({ x: approx.data32S[i * 2], y: approx.data32S[i * 2 + 1] });
  }

  points.sort((a, b) => a.y - b.y);
  const topTwo = points.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottomTwo = points.slice(2, 4).sort((a, b) => a.x - b.x);

  return {
    topLeft: topTwo[0],
    topRight: topTwo[1],
    bottomLeft: bottomTwo[0],
    bottomRight: bottomTwo[1],
  };
}

/**
 * Build MarkerDetectionResult from ordered corner points.
 * @param {{ topLeft: Point, topRight: Point, bottomRight: Point, bottomLeft: Point }} c
 * @returns {MarkerDetectionResult}
 */
function buildMarkerResult(c) {
  const left = Math.min(c.topLeft.x, c.bottomLeft.x);
  const right = Math.max(c.topRight.x, c.bottomRight.x);
  const top = Math.min(c.topLeft.y, c.topRight.y);
  const bottom = Math.max(c.bottomLeft.y, c.bottomRight.y);

  return {
    corners: [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft],
    edges: [c.topLeft, c.topRight, c.bottomRight, c.bottomLeft],
    boundingBox: { left, right, top, bottom, width: right - left, height: bottom - top },
  };
}

/**
 * Apply perspective correction to straighten the answer sheet.
 * Always applies when 4 corners are detected (no skew threshold).
 * @param {OpenCVMat} src - Grayscale source image
 * @param {MarkerDetectionResult} markers
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {{ corrected: OpenCVMat, markers: MarkerDetectionResult, applied: boolean }}
 */
export function applyPerspectiveCorrection(src, markers, imageWidth, imageHeight) {
  const cv = (typeof self !== 'undefined' && self.cv) || window.cv;

  if (!markers.corners || markers.corners.length !== 4) {
    return { corrected: src, markers, applied: false };
  }

  if (!cv.getPerspectiveTransform || !cv.warpPerspective) {
    return { corrected: src, markers, applied: false };
  }

  const [tl, tr, br, bl] = markers.corners;

  const dstWidth = Math.round(
    Math.max(Math.hypot(tr.x - tl.x, tr.y - tl.y), Math.hypot(br.x - bl.x, br.y - bl.y))
  );
  const dstHeight = Math.round(
    Math.max(Math.hypot(bl.x - tl.x, bl.y - tl.y), Math.hypot(br.x - tr.x, br.y - tr.y))
  );

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y,
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, dstWidth, 0, dstWidth, dstHeight, 0, dstHeight,
  ]);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const corrected = new cv.Mat();
  cv.warpPerspective(src, corrected, M, new cv.Size(dstWidth, dstHeight));

  srcPts.delete();
  dstPts.delete();
  M.delete();

  const updatedMarkers = {
    corners: markers.corners,
    edges: markers.edges,
    boundingBox: { left: 0, top: 0, right: dstWidth, bottom: dstHeight, width: dstWidth, height: dstHeight },
  };

  return { corrected, markers: updatedMarkers, applied: true };
}
