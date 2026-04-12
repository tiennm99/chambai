# Vietnamese High School Answer Sheet (Phiếu Trả Lời Trắc Nghiệm) - Technical Specifications

## Sheet Structure & Sections

**3 Main Parts:**
1. **Phần I** - Multiple choice questions (40-50 questions per sheet typical)
2. **Phần II** - True/False section (Đúng/Sai)
3. **Phần III** - Short answer section (Tự luận số)

**2025 Format Updates** (per Công văn 1239/BGDĐT):
- Exam code: 4 digits (changed from 3 digits)
- Student ID (Số báo danh): 8 digits (changed from 6 digits)
- Layout markers: Black squares (▪) instead of black horizontal lines

## Physical Specifications

**Paper Size:** A4 standard (also available in A5/A6 reduced formats)

**Printing Requirements:**
- Offset printing (laser/inkjet acceptable; NOT photocopy/color printing)
- Red color specification: 100% TRAM density for lines/circles/text, 10% TRAM for background
- Positioning tolerance: Minimum 4.5mm margin from paper edge

## Alignment & Positioning Markers

**Corner Markers:** Black squares at all 4 corners (critical for OMR scanning)

**Registration Points:**
- Test code (Mã đề) positioning points
- Student ID (Số báo danh) positioning points
- Vertical alignment guides

Standard OMR sheets have index points at 4 corners—most important parameter for scanner alignment.

## Bubble Specifications

**Bubble Size:** 10-14 points optimal (per international OMR standards)
- Smaller bubbles increase recognition error
- Larger bubbles may touch adjacent bubbles

**Spacing Requirements:**
- Minimum 3/8 inch clearance around bubbles for scanning
- No visible lines within bubble zones
- Consistent horizontal/vertical spacing between answer options (A, B, C, D typically)

**Marking Standards:**
- Students use black pencil only
- Single bubble per question
- Bubbles must be fully darkened for recognition

## Student ID Layout

**Section:** Top of sheet (standardized position)
- 8 individual digit fields arranged horizontally or in 2 rows of 4
- Each digit has: blank space for writing + bubble array below for marking (0-9 bubbles)
- Students write digit in blank, then fill corresponding bubble

## Exam Code Layout

**Section:** Top of sheet (separate from Student ID)
- 4 digit fields with same write + bubble structure
- Positioned adjacent to Student ID section

## Key Technical Insights for Bubble Detection

**Alignment:** Corner squares enable perspective correction before bubble analysis

**Detection Approach:** Contour-based detection more reliable than circle detection (HoughCircles unreliable for scanned sheets)

**Workflow:**
1. Perspective transform using corner markers
2. Identify question regions by alignment guides
3. Extract contours, filter by aspect ratio/size
4. Group into rows (one row = one question)
5. Mark darkest bubble in each row as selected answer

**Data Extraction:** After bubble detection, cross-reference marked bubbles against printed answer key

## Spacing Standards

Per international OMR:
- Horizontal spacing between answer columns: consistent (typically 8-10mm)
- Vertical spacing between questions: consistent (typically 10-15mm)
- Left/right margins: 1cm minimum
- Top/bottom margins: 1-1.5cm

## Critical Notes for Implementation

✓ **Must preserve corner markers** - removing them breaks OMR scanning
✓ **Red printed areas** - low contrast makes optical detection easier (not black)
✓ **8 digits for ID + 4 digits for exam code** - account for all 12 input fields
✓ **Bubble size consistency** - varies by manufacturer; measure from actual template
✓ **Lighting tolerance** - white/light gray background acceptable, but not colored paper

---

## Sources

- [Official 2025 Answer Sheet Usage Guide](https://xaydungchinhsach.chinhphu.vn/huong-dan-su-dung-phieu-tra-loi-trac-nghiem-thi-tot-nghiep-thpt-nam-2025-119250324144831872.htm)
- [Official Dispatch 1239/BGDĐT Technical Specifications](https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/chinh-sach-moi/81377/cong-van-1239-huong-dan-su-dung-phieu-tra-loi-trac-nghiem-thi-tot-nghiep-thpt-nam-2025)
- [TNMaker Answer Sheet Templates](https://tnmaker.net/phieu-trac-nghiem/)
- [PyImageSearch: Bubble Sheet Scanner with OpenCV](https://pyimagesearch.com/2016/10/03/bubble-sheet-multiple-choice-scanner-and-test-grader-using-omr-python-and-opencv/)
- [OMR Bubble Size Standards](https://www.addmengroup.com/omr-design/omr-bubble-size.htm)
- [General OMR Answer Sheet Specifications](https://www.yoctel.com/blogs/what-is-the-omr-answer-sheet)

---

## Unresolved Questions

1. **Exact bubble diameter in mm** - Standards specify 10-14 points but actual Vietnamese templates may vary; need to measure from official PDF template
2. **Precise spacing in mm between columns/rows** - Guidelines exist but exact measurements depend on question count per sheet
3. **Background color tolerance** - Can background be light gray or must it be pure white?
4. **Handwriting area dimensions** - For student ID digit writing field width/height specifications
