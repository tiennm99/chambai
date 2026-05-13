# Vietnamese Multiple Choice Test Scoring Web Application

A Next.js web application for automatically scoring Vietnamese multiple choice tests using OpenCV.js for image recognition.

## Features

- **Test Configuration**: Set up answer keys for three types of questions:
  - Phần I: Multiple choice (A, B, C, D)
  - Phần II: True/False questions with sub-parts
  - Phần III: Numerical answers

- **Image Processing**: 
  - Drag & drop image upload
  - Automatic image resize for large photos (12MP+ phone cameras)
  - Adaptive fill threshold (per-image baseline from empty bubbles)
  - Image quality pre-check (blur detection, resolution, corner markers)
  - Bubble detection using OpenCV.js
  - Student ID and exam code recognition
  - Answer recognition for all question types

- **Manual Correction**:
  - Click-to-toggle answer correction in editable grid
  - Low-confidence detections highlighted for review
  - Live score preview during correction

- **Session Management**:
  - Create, list, delete exam sessions
  - Session-based data isolation (config + results per session)
  - Session export/import (.chambai.json files)
  - Automatic localStorage-to-IndexedDB migration

- **Results & Analytics**:
  - Automatic scoring calculation
  - Per-question item analysis (correct%, wrong%, blank%, difficulty)
  - Score distribution histogram with configurable buckets
  - Class statistics (mean, median, min, max)
  - Detailed student results view
  - CSV export functionality
  - Print-optimized layout
  - Data persistence using IndexedDB

## Tech Stack

- **Frontend**: Next.js 15
- **Styling**: Tailwind CSS
- **Image Processing**: OpenCV.js
- **Data Export**: CSV generation, JSON session export
- **Storage**: IndexedDB (sessions, results, debug images)

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   pnpm dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### 1. Create a Session
- Click "Tạo phiên mới" on the landing page
- Name your exam session

### 2. Configure Test (Cấu hình đề thi)
- Set the number of questions for each section
- Input correct answers (manual, paste from Excel, or CSV import)
- Save the configuration

### 3. Upload and Process Images (Tải và xử lý ảnh)
- Drag and drop or select image files (JPG, PNG)
- Click "Xử lý ảnh" to process the images
- Review quality warnings for blurry/low-resolution images
- Wait for automatic recognition to complete

### 4. Review and Correct (Sửa đáp án)
- Click "Xem" on any student result
- Click "Sửa đáp án" to manually correct detected answers
- Low-confidence detections are highlighted in yellow

### 5. View Results (Kết quả)
- Review scores in the results table
- Switch to "Phân tích câu hỏi" for per-question analysis
- Switch to "Phân phối điểm" for score distribution
- Export results to CSV or print

## Project Structure

```
src/
├── app/
│   ├── layout.jsx              # Root layout with OpenCV.js integration
│   ├── page.jsx                # Main app: session management + page routing
│   └── globals.css             # Global styles + print CSS
├── components/
│   ├── Navigation.jsx          # Navigation between pages
│   ├── ConfigurationPage.jsx   # Test config + scoring + CSV import
│   ├── UploadPage.jsx          # Image upload with progress + quality warnings
│   ├── ResultsPage.jsx         # Results table + tabs (analysis, distribution)
│   ├── ImageProcessor.jsx      # Thin wrapper calling detection pipeline
│   ├── session-list.jsx        # Session list with create/delete/export/import
│   ├── session-header.jsx      # Active session header bar
│   ├── student-detail-modal.jsx # Per-student detail + correction button
│   ├── manual-correction-modal.jsx # Editable answer grid with live scoring
│   ├── item-analysis-view.jsx  # Per-question analysis table
│   ├── score-distribution-chart.jsx # Histogram with mean/median
│   ├── phan-i-answer-grid.jsx  # Keyboard-navigable answer input grid
│   └── image-processor-error-boundary.jsx # Error boundary for pipeline
└── lib/
    ├── detection-pipeline.js   # Full OMR pipeline (extracted, pure function)
    ├── image-preprocessing.js  # Grayscale, thresholding, resize, adaptive threshold
    ├── image-quality-check.js  # Blur/resolution/sheet boundary validation
    ├── marker-detection.js     # Contour-based sheet detection + perspective correction
    ├── corner-marker-fallback.js # Fallback corner marker detection (legacy)
    ├── bubble-grid-generator.js # Vietnamese THPT answer sheet layout
    ├── answer-detection.js     # Student ID, exam code, answer detection
    ├── debug-visualization.js  # Debug overlay drawing
    ├── scoring.js              # Weighted scoring (Phần I/II/III)
    ├── statistics.js           # Class-level statistics
    ├── item-analysis.js        # Per-question item analysis
    ├── indexed-db-store.js     # Core IndexedDB (openDB, debug images)
    ├── indexed-db-sessions.js  # Session CRUD
    ├── indexed-db-results.js   # Results CRUD (session-scoped)
    ├── local-storage-migration.js # One-time localStorage migration
    ├── session-export-import.js # Export/import sessions as JSON
    └── types.js                # JSDoc type definitions
```

## Image Processing

The application uses OpenCV.js for:
- Converting images to grayscale and adaptive thresholding
- Auto-resizing large images (>2000px width) for reliable processing
- Adaptive fill threshold computation from empty bubble baseline
- Image quality validation (blur, resolution, sheet boundary)
- Contour-based sheet boundary detection (largest rectangle) with corner marker fallback
- Perspective correction always applied when sheet boundary detected
- Binary threshold + pixel counting for robust bubble fill measurement
- Region of Interest (ROI) extraction with Otsu thresholding
- Debug visualization with color-coded overlay

The detection pipeline follows the Vietnamese THPT answer sheet layout (Công văn 1239/BGDĐT 2025):
1. Resize image to max 2000px width
2. Preprocess (grayscale + Gaussian blur + adaptive threshold)
3. Detect sheet boundary via contour detection (fallback: corner markers)
4. Validate image quality (blur, resolution, boundary detection)
5. Apply perspective correction (always when 4 corners detected)
6. Generate bubble grid using proportional layout ratios
7. Compute adaptive fill threshold from empty bubble regions
8. Measure bubble fill via binary threshold + dark pixel count
9. Return results with confidence map for manual review

## License

MIT License
