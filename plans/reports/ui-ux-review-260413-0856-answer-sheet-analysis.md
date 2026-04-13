# UI/UX Review & Answer Sheet Analysis Report

**Date:** 2026-04-13 | **Branch:** main | **Status:** Complete

---

## Part 1: Answer Sheet Layout Analysis (CV1239/BGDDT 2025)

### Sheet Structure (Page 0 - Answer Sheet)

The official Vietnamese THPT answer sheet has the following layout from top to bottom:

#### Header Section (top ~15% of sheet)
- Title: **"PHIEU TRA LOI TRAC NGHIEM"** (centered, bold)
- Fields: Ky thi, Mon thi, Ngay thi
- **Item 7: "So bao danh"** (Student ID) - top-right area, 8-digit grid
- **Item 8: "Ma de thi"** (Exam Code) - far top-right, 4-digit grid  
- Left side: Examiner signature boxes (Giam thi 1, Giam thi 2)
- Items 1-6: Exam metadata (Hoi dong thi, Diem thi, Phong so, Ho va ten thi sinh, Ngay sinh, Chu ky thi sinh)
- Note at bottom of header: *"Chu y: Thi sinh can doc ky huong dan o mat sau Phieu nay."*

#### PHAN I Section (~30% of sheet, middle area)
- Label: **"PHAN I"** (bold, left-aligned)
- Layout: **4 columns of 10 questions each = 40 questions total**
- Column 1: Questions 1-10
- Column 2: Questions 11-20  
- Column 3: Questions 21-30
- Column 4: Questions 31-40
- Each question has **4 bubbles: A, B, C, D** (circles, inline)

#### PHAN II Section (~15% of sheet)
- Label: **"PHAN II"** (bold, left-aligned)
- Layout: **8 questions (Cau 1 to Cau 8) arranged in a single row**
- Each question has: header "Cau N / Dung Sai"
- Sub-options: **a), b), c), d)** each with **2 bubbles: Dung (True) / Sai (False)**
- Arranged as 4 questions per visual group, spanning full width

#### PHAN III Section (~25% of sheet, bottom)
- Label: **"PHAN III"** (bold, left-aligned)
- Layout: **6 questions (Cau 1 to Cau 6) in 6 columns**
- Each question has a column for writing a numerical answer
- Below each writing area: **10 rows of bubbles (digits 0-9)**
- There's also a **"-" (negative sign) bubble** at the top
- And a **"," (decimal comma) bubble** 

#### Corner/Alignment Markers
- **4 corner markers**: solid black squares at corners of the answer area
- Located at: top-left, top-right, bottom-left, bottom-right of the bubble grid area
- NOT at the paper corners - they frame the scoring area specifically

### Page 1 - Instructions
- Shows how to fill bubbles with 4 example figures (Hinh 1-4)
- Hinh 1: Phan I example (fill one circle per question)
- Hinh 2: Phan II example (fill Dung/Sai per sub-option)
- Hinh 3: Phan III negative number example ("-1.5")
- Hinh 4: Phan III positive number example ("1.5")

### Key Layout Proportions (for OpenCV calibration)

Based on visual analysis of the 1638x2339 pixel rendering:

| Section | Approx Y Start (%) | Approx Y End (%) | Height (%) |
|---------|-------------------|------------------|------------|
| Header + SBD/Ma de | 0% | 28% | 28% |
| PHAN I | 28% | 55% | 27% |
| PHAN II | 55% | 72% | 17% |
| PHAN III | 72% | 98% | 26% |

| Section | Approx X Start (%) | Approx X End (%) | Width (%) |
|---------|-------------------|------------------|-----------|
| SBD (8 digits) | 58% | 82% | 24% |
| Ma de thi (4 digits) | 82% | 95% | 13% |
| PHAN I (all 4 cols) | 3% | 97% | 94% |
| PHAN II (all 8 qs) | 3% | 97% | 94% |
| PHAN III (all 6 qs) | 3% | 97% | 94% |

### Critical Observations vs Current Code

**Current `bubble-grid-generator.js` SHEET_LAYOUT discrepancies:**

1. **Student ID position is WRONG**: Code has `{ x: 0.65, y: 0.02, w: 0.25, h: 0.18 }` but actual sheet puts SBD at ~`{ x: 0.58, y: 0.05, w: 0.24, h: 0.20 }` (within the header area, not at the very top)
2. **Exam Code position is WRONG**: Code has `{ x: 0.45, y: 0.02 }` but actual sheet puts Ma de thi to the RIGHT of SBD at ~`{ x: 0.82, y: 0.05 }`
3. **PHAN I Y position needs adjustment**: Code has `y: 0.25` but actual is closer to `y: 0.28`
4. **PHAN II Y position needs adjustment**: Code has `y: 0.58` but actual is closer to `y: 0.55`
5. **PHAN III**: Code has `y: 0.76` but actual starts at ~`y: 0.72`
6. **PHAN III missing features**: The actual sheet has **negative sign "-"** and **decimal comma ","** bubbles that the code doesn't handle
7. **PHAN III is multi-digit per question**: Each question can have multiple digits (e.g., "-1.5" = 4 characters), not just a single digit. Current code treats each question as a single digit selection.

---

## Part 2: UI/UX Review

### Critical Bugs (P0)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **localStorage race condition** | `UploadPage.jsx:99-104` | `setTimeout(100)` hack for saving results - results can be silently lost |
| 2 | **`useState` misused as `useEffect`** | `UploadPage.jsx:271-275` | `ImageThumbnail` never updates URL on prop change, never revokes old URLs (memory leak) |
| 3 | **localStorage overflow risk** | `UploadPage.jsx:101-103` | Debug image data URLs (~1-2MB each) stored per result. 50+ students = blown 5MB limit |

### UX Issues (P1)

| # | Issue | Impact |
|---|-------|--------|
| 4 | Save/Reset buttons at TOP of ConfigurationPage | Teachers must scroll up after filling 40+ answers to save |
| 5 | No validation before Upload tab | Teachers can try processing without saving config |
| 6 | No step-completion indicators on Navigation | Teachers don't know which steps are done |
| 7 | No keyboard navigation for Phan I answer input | Inputting 40 answers requires 40 mouse clicks minimum |
| 8 | Debug legend in English, rest in Vietnamese | Inconsistent language |
| 9 | Status messages auto-dismiss in 3 seconds | Too fast for non-tech-savvy teachers |
| 10 | No manual answer correction in results | Teachers can't fix OCR errors |

### Workflow Improvements (P2)

| # | Suggestion | Benefit |
|---|-----------|---------|
| 11 | Lift state to parent component or use React Context | Eliminates localStorage sync bugs between tabs |
| 12 | Auto-advance prompts after key actions | Guides teachers through the 3-step flow |
| 13 | Paste-from-spreadsheet for Phan I answers | Teachers often have answer keys in Excel |
| 14 | Class summary statistics (mean, median, distribution) | Essential for teacher reporting |
| 15 | Phan II: distinguish "unanswered" vs "answered Sai" visually | Currently ambiguous |

### Visual Polish (P3)

| # | Suggestion |
|---|-----------|
| 16 | Extract shared StatusMessage component (duplicated in Config + Upload) |
| 17 | Increase touch targets (w-8 h-8 = 32px, should be 44px for mobile/tablet) |
| 18 | Add collapsible help text on each page |
| 19 | Replace native `confirm()` with inline confirmation + undo |
| 20 | Dark mode deprioritized - low value for target users (teachers in school settings) |

---

## Part 3: Core Logic Analysis - OpenCV Detection Pipeline

### Current Pipeline
```
Image -> Grayscale + GaussianBlur + AdaptiveThreshold + MorphClose
      -> FindContours -> Filter square-ish contours -> Pick 4 corners
      -> Generate bubble grid from proportional layout
      -> MeasureBubbleFill per bubble (mean intensity in ROI)
      -> Pick best-filled bubble per question group
```

### Strengths
- Solid preprocessing chain (adaptive threshold handles variable lighting)
- Morphological closing fills bubble gaps
- Fill measurement approach (mean intensity) is proven for bubble sheets
- Fallback to image bounds when markers aren't detected

### Weaknesses & Improvement Areas

1. **No perspective correction/deskewing**: Markers are detected but only used for bounding box. Should apply `cv.getPerspectiveTransform` + `cv.warpPerspective` to correct camera angle/rotation.

2. **Bubble size is hardcoded ratio (0.012)**: Should be derived from marker size or from the distance between detected marker corners.

3. **No image quality validation**: No check for blur, resolution, exposure. Should warn if image is too small or too blurry.

4. **FILL_THRESHOLD = 0.35 is static**: Should be adaptive - calculate the mean of "definitely empty" bubbles and "definitely filled" bubbles per sheet, then set threshold between them (Otsu-like approach per sheet).

5. **PHAN III model is wrong**: Current code assumes 1 digit per question. Actual sheet supports multi-character answers (e.g., "-1.5" needs 4 character positions including sign and decimal).

6. **No multi-answer detection for PHAN I**: If a student fills 2 bubbles for one question, current code just picks the darkest. Should flag as "multiple answers" (invalid).

7. **No confidence reporting per answer**: The detection returns answers but no per-answer confidence. Teachers need to see which answers are low-confidence for manual review.

---

## Unresolved Questions

1. How large are debug visualization data URLs in practice? If >1MB each, IndexedDB migration is P0.
2. Is there a standard Vietnamese THPT answer key format (Excel template) for paste-import?
3. Do teachers need to support multiple exam codes (answer keys) simultaneously?
4. PHAN III: what is the maximum number of characters per answer? The sheet shows sign + digits + decimal.
5. Should the app support camera capture directly (mobile use case) vs only file upload?
