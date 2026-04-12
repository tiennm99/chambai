# Vietnamese Multiple Choice Test Scoring Web Application

A Next.js web application for automatically scoring Vietnamese multiple choice tests using OpenCV.js for image recognition.

## Features

- **Test Configuration**: Set up answer keys for three types of questions:
  - Phần I: Multiple choice (A, B, C, D)
  - Phần II: True/False questions with sub-parts
  - Phần III: Numerical answers

- **Image Processing**: 
  - Drag & drop image upload
  - Automatic bubble detection using OpenCV.js
  - Student ID recognition
  - Answer recognition for all question types

- **Results Management**:
  - Automatic scoring calculation
  - Detailed student results view
  - CSV export functionality
  - Data persistence using localStorage

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Image Processing**: OpenCV.js
- **Data Export**: CSV generation
- **Storage**: localStorage

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### 1. Configure Test (Cấu hình đề thi)
- Set the number of questions for each section
- Input the correct answers for each question
- Save the configuration

### 2. Upload and Process Images (Tải và xử lý ảnh)
- Drag and drop or select image files (JPG, PNG)
- Click "Xử lý ảnh" to process the images
- Wait for the automatic recognition to complete

### 3. View Results (Kết quả)
- Review automatically calculated scores
- View detailed answers for each student
- Export results to CSV format

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with OpenCV.js integration
│   ├── page.tsx                # Main application page
│   └── globals.css             # Global styles
├── components/
│   ├── Navigation.tsx          # Navigation between pages
│   ├── ConfigurationPage.tsx   # Test configuration + scoring config
│   ├── UploadPage.tsx          # Image upload with thumbnails and progress
│   ├── ResultsPage.tsx         # Results table with sorting/filtering/export
│   └── ImageProcessor.tsx      # Orchestrator for the detection pipeline
├── lib/
│   ├── image-preprocessing.ts  # Grayscale, thresholding, bubble fill measurement
│   ├── marker-detection.ts     # Corner marker detection for alignment
│   ├── bubble-grid-generator.ts # Vietnamese THPT answer sheet layout
│   ├── answer-detection.ts     # Student ID, exam code, answer detection
│   ├── debug-visualization.ts  # Debug overlay drawing
│   └── scoring.ts              # Weighted scoring (Phần I/II/III)
└── types/
    ├── index.ts                # Shared types (TestConfig, StudentResult, etc.)
    └── opencv.ts               # OpenCV.js type declarations
```

## Data Structure

### Test Configuration
```typescript
interface TestConfig {
  phanI: {
    questionCount: number;
    answers: string[];
  };
  phanII: {
    questionCount: number;
    answers: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  };
  phanIII: {
    questionCount: number;
    answers: string[];
  };
}
```

### Student Results
```typescript
interface StudentResult {
  id: string;
  fileName: string;
  studentId: string;
  phanI: string[];
  phanII: Array<{ a: boolean; b: boolean; c: boolean; d: boolean }>;
  phanIII: string[];
  score: {
    phanI: number;
    phanII: number;
    phanIII: number;
    total: number;
    percentage: number;
  };
}
```

## Image Processing

The application uses OpenCV.js for:
- Converting images to grayscale and adaptive thresholding
- Corner marker detection for sheet alignment
- Contour-based bubble detection (not HoughCircles)
- Region of Interest (ROI) extraction and fill measurement
- Debug visualization with color-coded overlay

The detection pipeline follows the Vietnamese THPT answer sheet layout (Công văn 1239/BGDĐT 2025):
1. Preprocess image (grayscale + Gaussian blur + adaptive threshold)
2. Detect 4 corner markers for alignment reference
3. Generate bubble grid using proportional layout ratios
4. Measure bubble fill intensity for answer detection
5. Create debug overlay showing all detected positions

## Development Notes

- The application uses localStorage for data persistence
- OpenCV.js is loaded asynchronously for browser compatibility
- All text is in Vietnamese for the target audience
- Responsive design works on mobile and desktop
- Error handling is implemented for common use cases

## Future Enhancements

- Real OpenCV.js bubble detection implementation
- Batch processing optimization
- Image quality validation
- Template-based recognition for better accuracy
- Database integration for persistent storage
- User authentication and multi-teacher support

## License

MIT License