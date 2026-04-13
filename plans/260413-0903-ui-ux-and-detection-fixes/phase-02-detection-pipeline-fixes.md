# Phase 2: Detection Pipeline Fixes (P1)

## Context

- [Review report](../reports/ui-ux-review-260413-0856-answer-sheet-analysis.md)
- [Plan overview](./plan.md)
- Reference: CV1239/BGDDT 2025 Vietnamese THPT answer sheet format

## Overview

- **Priority**: P1
- **Status**: Pending
- **Effort**: 4h
- **Dependencies**: None (independent of Phase 1)
- **Blocks**: Nothing directly

## Key Issues

1. **SHEET_LAYOUT coordinates are wrong** - Student ID, Exam Code, and all three Phan sections have incorrect x/y values
2. **No perspective correction** - Corner markers are detected but only used for bounding box, not deskewing
3. **Phan III model is wrong** - Treats each answer as single digit; actual sheet supports multi-character (sign + digits + decimal comma)

## Architecture

### Detection Pipeline (After Fix)

```
Image -> Preprocess (grayscale + blur + threshold + morph)
      -> Detect 4 corner markers
      -> IF 4 markers found AND skew > 2deg:
           Apply getPerspectiveTransform + warpPerspective -> corrected image
         ELSE:
           Use bounding box as-is (current behavior)
      -> Generate bubble grid with CORRECTED coordinates
      -> Phan III: multi-column per question (sign + digits + comma)
      -> Measure fill + detect answers
      -> Return results
```

### Phan III Data Model Change

**Before:** Each question = 1 digit column (0-9)
**After:** Each question = N character columns, where each column has rows for: `-`, `,`, `0-9`

```
Question layout (per question):
  Col 0: sign column    -> rows: ["-", "blank"]  (or just "-" bubble + empty)
  Col 1: digit column 1 -> rows: [0,1,2,3,4,5,6,7,8,9]
  Col 2: digit column 2 -> rows: [0,1,2,3,4,5,6,7,8,9]
  Col 3: comma column   -> rows: [",", "blank"]
  Col 4: digit column 3 -> rows: [0,1,2,3,4,5,6,7,8,9]
```

Actual CV1239 sheet has approximately 5 character positions per question. Each character position has 12 rows: `-`, `,`, `0-9`. The detection reads filled bubbles left-to-right to form the answer string.

## Related Code Files

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/bubble-grid-generator.js` | Fix SHEET_LAYOUT coordinates; rewrite `generatePhanIIIBubbles` for multi-char model |
| `src/lib/marker-detection.js` | Add `applyPerspectiveCorrection()` export |
| `src/lib/answer-detection.js` | Rewrite `detectPhanIIIAnswers` for multi-char reading |
| `src/lib/types.js` | Add `charPosition` and `charValue` fields to Bubble typedef |
| `src/components/ImageProcessor.jsx` | Insert perspective correction step in pipeline |

### Files NOT Modified

| File | Reason |
|------|--------|
| `src/lib/image-preprocessing.js` | No changes needed |
| `src/lib/scoring.js` | Already compares strings; multi-char answers work as-is |
| `src/lib/debug-visualization.js` | Phan III debug drawing needs update but deferred to Phase 4 (Vietnamese legend) |

## Implementation Steps

### 1. Fix SHEET_LAYOUT in `bubble-grid-generator.js`

**Current (wrong) values:**
```js
studentId: { x: 0.65, y: 0.02, w: 0.25, h: 0.18, cols: 8, rows: 10 },
examCode:  { x: 0.45, y: 0.02, w: 0.15, h: 0.18, cols: 4, rows: 10 },
phanI:     { x: 0.03, y: 0.25, w: 0.94, h: 0.30, ... },
phanII:    { x: 0.03, y: 0.58, w: 0.94, h: 0.15, ... },
phanIII:   { x: 0.03, y: 0.76, w: 0.94, h: 0.22, ... },
```

**Corrected values (from PDF analysis):**
```js
studentId: { x: 0.58, y: 0.05, w: 0.24, h: 0.20, cols: 8, rows: 10 },
examCode:  { x: 0.82, y: 0.05, w: 0.13, h: 0.20, cols: 4, rows: 10 },
phanI:     { x: 0.03, y: 0.28, w: 0.94, h: 0.27, ... },
phanII:    { x: 0.03, y: 0.55, w: 0.94, h: 0.17, ... },
phanIII:   { x: 0.03, y: 0.72, w: 0.94, h: 0.26, ... },
```

Key fix: Exam Code moves from x:0.45 (left-center, WRONG) to x:0.82 (right of SBD, CORRECT).

### 2. Rewrite Phan III bubble generation

Replace the current single-digit model in `generatePhanIIIBubbles`:

```js
// New Phan III layout config
phanIII: {
  x: 0.03, y: 0.72, w: 0.94, h: 0.26,
  questions: 6,
  charsPerQuestion: 5,  // max character positions per answer
  // Row labels per character column: ['-', ',', '0', '1', ..., '9']
  charRows: 12,
}
```

Each question occupies `w / 6` width. Within each question column:
- 5 sub-columns for character positions
- 12 rows: index 0 = `-` (sign), index 1 = `,` (decimal), indices 2-11 = digits 0-9

New bubble fields:
```js
{
  section: 'section3',
  question: 1,           // 1-6
  charPosition: 0,       // 0-4 (which character slot)
  charValue: '-',        // '-', ',', '0'-'9'
  // row kept for backward compat with debug visualization
}
```

### 3. Rewrite `detectPhanIIIAnswers` in `answer-detection.js`

```js
export function detectPhanIIIAnswers(bubbles, gray, questionCount = 6) {
  const sectionBubbles = bubbles.filter(b => b.section === 'section3');
  const answers = [];

  for (let q = 1; q <= questionCount; q++) {
    const qBubbles = sectionBubbles.filter(b => b.question === q);
    // Group by charPosition, find best-filled in each position
    const charPositions = groupByField(qBubbles, 'charPosition');
    let answer = '';

    for (let pos = 0; pos < 5; pos++) {
      const posBubbles = charPositions[pos] || [];
      const best = findBestFilled(posBubbles, gray);
      if (best?.charValue) {
        answer += best.charValue;
      }
    }

    // Trim trailing empty positions, normalize
    answers.push(answer.replace(/\s+$/, ''));
  }

  return answers;
}
```

### 4. Add perspective correction to `marker-detection.js`

Add new export function after existing `detectCornerMarkers`:

```js
/**
 * Apply perspective correction using 4 detected corner markers.
 * Returns corrected image and updated bounding box, or original if skew is minimal.
 */
export function applyPerspectiveCorrection(src, markers, imageWidth, imageHeight) {
  const cv = window.cv;

  // Only correct if we have exactly 4 corners
  if (!markers.corners || markers.corners.length !== 4) {
    return { corrected: src, markers, applied: false };
  }

  const [tl, tr, br, bl] = markers.corners;

  // Calculate skew angle; skip if < 2 degrees
  const topAngle = Math.atan2(tr.y - tl.y, tr.x - tl.x) * 180 / Math.PI;
  if (Math.abs(topAngle) < 2) {
    return { corrected: src, markers, applied: false };
  }

  // Destination rectangle (axis-aligned)
  const dstWidth = Math.max(
    Math.hypot(tr.x - tl.x, tr.y - tl.y),
    Math.hypot(br.x - bl.x, br.y - bl.y)
  );
  const dstHeight = Math.max(
    Math.hypot(bl.x - tl.x, bl.y - tl.y),
    Math.hypot(br.x - tr.x, br.y - tr.y)
  );

  const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
  ]);
  const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, dstWidth, 0, dstWidth, dstHeight, 0, dstHeight
  ]);

  const M = cv.getPerspectiveTransform(srcPts, dstPts);
  const corrected = new cv.Mat();
  cv.warpPerspective(src, corrected, M, new cv.Size(dstWidth, dstHeight));

  srcPts.delete();
  dstPts.delete();
  M.delete();

  // New bounding box covers entire corrected image
  const newMarkers = {
    corners: markers.corners,
    edges: markers.edges,
    boundingBox: {
      left: 0, top: 0,
      right: dstWidth, bottom: dstHeight,
      width: dstWidth, height: dstHeight,
    },
  };

  return { corrected, markers: newMarkers, applied: true };
}
```

### 5. Integrate perspective correction in `ImageProcessor.jsx`

In `runDetectionPipeline`, after marker detection, before bubble grid generation:

```js
const markers = detectCornerMarkers(thresh, imageData.width, imageData.height);

// NEW: apply perspective correction
const { corrected, markers: correctedMarkers, applied } =
  applyPerspectiveCorrection(gray, markers, imageData.width, imageData.height);

const activeGray = applied ? corrected : gray;
const activeMarkers = correctedMarkers;
const activeWidth = applied ? corrected.cols : imageData.width;
const activeHeight = applied ? corrected.rows : imageData.height;

const bubbles = generateBubbleGrid(activeMarkers, activeWidth, activeHeight);
const studentId = detectStudentId(bubbles, activeGray);
// ... rest uses activeGray instead of gray

// Clean up
if (applied) corrected.delete();
```

### 6. Update `types.js` Bubble typedef

Add optional fields:
```js
 * @property {number} [charPosition] - Character position index (for section3 multi-char)
 * @property {string} [charValue] - Character value: '-', ',', '0'-'9' (for section3)
```

## Todo List

- [ ] Fix SHEET_LAYOUT coordinates (studentId, examCode, phanI, phanII, phanIII)
- [ ] Update phanIII layout config for multi-character model (charsPerQuestion, charRows)
- [ ] Rewrite `generatePhanIIIBubbles` for multi-character columns
- [ ] Update Bubble typedef in types.js with charPosition/charValue fields
- [ ] Rewrite `detectPhanIIIAnswers` to read multi-char answers
- [ ] Add `applyPerspectiveCorrection` to marker-detection.js
- [ ] Integrate perspective correction in ImageProcessor.jsx pipeline
- [ ] Add helper `groupByField` to answer-detection.js (or reuse groupByColumn pattern)
- [ ] Test with straight scan: verify no perspective correction applied (angle < 2deg)
- [ ] Test with skewed photo: verify perspective correction improves detection
- [ ] Test Phan III: verify "-1,5" type answers detected correctly

## Success Criteria

1. Student ID detected at correct position (x:0.58, not x:0.65)
2. Exam Code detected at RIGHT side of sheet (x:0.82, not x:0.45)
3. Phan III returns multi-character strings (e.g., "-1,5") not single digits
4. Perspective correction activates only on skewed images (>2 degrees)
5. Straight scans produce same or better results as before

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Corrected coordinates still off | Medium | High | Coordinates are in one const; easy to fine-tune with debug visualization overlay |
| Phan III char positions vary between print batches | Low | Medium | Keep charsPerQuestion configurable in SHEET_LAYOUT |
| Perspective correction introduces artifacts | Low | Medium | Only apply when skew > 2deg; use INTER_LINEAR interpolation |
| OpenCV.js getPerspectiveTransform not available | Very Low | High | Feature-detect; skip correction if function missing |

## Security Considerations

- No new attack surface; all processing is client-side
- No external network calls added
