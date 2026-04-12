// Detect corner reference markers (black squares) on the answer sheet
// These markers are used for perspective correction and alignment
/** @typedef {import('./types.js').OpenCVMat} OpenCVMat */
/** @typedef {import('./types.js').Point} Point */
/** @typedef {import('./types.js').MarkerDetectionResult} MarkerDetectionResult */

/**
 * Detect the 4 corner markers on a Vietnamese THPT answer sheet.
 * Corner markers are solid black squares used for alignment/deskewing.
 * @param {OpenCVMat} thresh - Thresholded binary image
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {MarkerDetectionResult}
 */
export function detectCornerMarkers(thresh, imageWidth, imageHeight) {
  const cv = window.cv;
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  cv.findContours(thresh, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  /** @type {Array<{ center: Point, area: number, aspectRatio: number, rect: { x: number, y: number, width: number, height: number } }>} */
  const candidates = [];

  const imageArea = imageWidth * imageHeight;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    const rect = cv.boundingRect(contour);
    const aspectRatio = rect.width / rect.height;

    // Corner markers are square-ish and relatively large (but not huge)
    // Typical range: 0.05% to 2% of image area
    const areaRatio = area / imageArea;
    if (areaRatio < 0.0003 || areaRatio > 0.02) continue;

    // Must be roughly square (aspect ratio 0.6 to 1.7)
    if (aspectRatio < 0.6 || aspectRatio > 1.7) continue;

    // Solidity check: filled area vs bounding rect area
    const rectArea = rect.width * rect.height;
    const solidity = area / rectArea;
    if (solidity < 0.7) continue;

    candidates.push({
      center: {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      },
      area,
      aspectRatio,
      rect,
    });
  }

  contours.delete();
  hierarchy.delete();

  // Find the 4 corners by selecting candidates closest to each image corner
  const corners = findFourCorners(candidates, imageWidth, imageHeight);
  const allPoints = candidates.map((c) => c.center);

  if (corners) {
    const left = Math.min(corners.topLeft.x, corners.bottomLeft.x);
    const right = Math.max(corners.topRight.x, corners.bottomRight.x);
    const top = Math.min(corners.topLeft.y, corners.topRight.y);
    const bottom = Math.max(corners.bottomLeft.y, corners.bottomRight.y);

    return {
      corners: [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft],
      edges: allPoints,
      boundingBox: {
        left,
        right,
        top,
        bottom,
        width: right - left,
        height: bottom - top,
      },
    };
  }

  // Fallback: use image bounds with margin
  const margin = Math.min(imageWidth, imageHeight) * 0.03;
  return {
    corners: [],
    edges: allPoints,
    boundingBox: {
      left: margin,
      right: imageWidth - margin,
      top: margin,
      bottom: imageHeight - margin,
      width: imageWidth - margin * 2,
      height: imageHeight - margin * 2,
    },
  };
}

/**
 * From candidates, pick the 4 that are closest to each image corner.
 * @param {Array<{ center: Point, area: number }>} candidates
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @returns {{ topLeft: Point, topRight: Point, bottomLeft: Point, bottomRight: Point } | null}
 */
function findFourCorners(candidates, imageWidth, imageHeight) {
  if (candidates.length < 4) return null;

  const imageCorners = [
    { x: 0, y: 0 },
    { x: imageWidth, y: 0 },
    { x: 0, y: imageHeight },
    { x: imageWidth, y: imageHeight },
  ];

  /** @type {Point[]} */
  const assigned = [];
  /** @type {Set<number>} */
  const used = new Set();

  for (const corner of imageCorners) {
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;
      const dx = candidates[i].center.x - corner.x;
      const dy = candidates[i].center.y - corner.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    // Reject if the best candidate is too far from the corner (>40% of image diagonal)
    const maxDist = Math.sqrt(imageWidth * imageWidth + imageHeight * imageHeight) * 0.4;
    if (bestIdx === -1 || bestDist > maxDist) return null;

    assigned.push(candidates[bestIdx].center);
    used.add(bestIdx);
  }

  return {
    topLeft: assigned[0],
    topRight: assigned[1],
    bottomLeft: assigned[2],
    bottomRight: assigned[3],
  };
}
