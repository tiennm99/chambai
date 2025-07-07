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
│   ├── layout.tsx          # Root layout with OpenCV.js integration
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   ├── Navigation.tsx      # Navigation between pages
│   ├── ConfigurationPage.tsx # Test configuration interface
│   ├── UploadPage.tsx      # Image upload and processing
│   ├── ResultsPage.tsx     # Results display and export
│   └── ImageProcessor.tsx  # OpenCV.js image processing
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
- Converting images to grayscale
- Applying adaptive thresholding
- Contour detection for bubble recognition
- Region of Interest (ROI) extraction

Currently implemented as a mock system that generates random realistic data for demonstration purposes. Full OpenCV implementation would require:
- Template matching for accurate bubble detection
- Advanced preprocessing for image alignment
- Robust pattern recognition algorithms

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