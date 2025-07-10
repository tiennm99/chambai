# Claude Code Prompt: Vietnamese Multiple Choice Test Scoring Web Application

## Project Overview
Create a web application that allows teachers to:
1. Set up test configurations (number of questions, correct answers)
2. Upload and process scanned student answer sheets
3. Automatically recognize student IDs and answers using OpenCV
4. Calculate scores and export results to CSV

## Technical Requirements

### Core Technologies
- **Frontend**: HTML5, CSS3, JavaScript (vanilla or React)
- **Image Processing**: OpenCV.js for browser-based image recognition
- **File Handling**: FileReader API for image uploads
- **Data Storage**: localStorage for persistence (with reset functionality)
- **Export**: CSV generation and download

### Application Structure
```
/chambai/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── opencv-setup.js
│   ├── image-processor.js
│   ├── answer-recognizer.js
│   └── csv-exporter.js
├── lib/
│   └── opencv.js
└── README.md
```

## Detailed Feature Requirements

### 1. Test Configuration Page
**UI Components:**
- Input for total number of questions per section:
  - Phần I (Multiple Choice): Input field + answer key grid (A/B/C/D buttons)
  - Phần II (True/False): Input field + answer key grid (True/False buttons)
  - Phần III (Numerical): Input field + answer input boxes
- "Save Configuration" button
- "Reset All Data" button (clears localStorage)

**Data Structure:**
```javascript
const testConfig = {
  phanI: {
    questionCount: 40,
    answers: ['A', 'B', 'C', 'D', 'A', ...] // Array of correct answers
  },
  phanII: {
    questionCount: 8,
    answers: [
      { a: true, b: false, c: true, d: true }, // Question 1
      { a: false, b: true, c: false, d: true }, // Question 2
      // ... more questions
    ]
  },
  phanIII: {
    questionCount: 6,
    answers: ['-1.5', '2.3', '45', ...] // Array of correct numerical answers
  }
}
```

### 2. Image Upload and Processing Page
**UI Components:**
- Drag & drop zone for images (JPG/PNG)
- Image preview area
- "Process Image" button
- Progress indicator
- Results display table

**Image Processing Requirements:**
- Use OpenCV.js to:
  - Convert image to grayscale
  - Apply adaptive thresholding
  - Detect filled bubbles using contour detection
  - Extract student ID from section 7 (số báo danh)
  - Extract answers from all three sections

**Recognition Logic:**
- **Student ID**: Recognize filled bubbles in the grid format shown in the PDF
- **Phần I**: Detect A/B/C/D bubble selections
- **Phần II**: Detect True/False bubble selections for each sub-question
- **Phần III**: Detect numerical bubble selections (0-9, comma, negative sign)

### 3. Results Management
**Features:**
- Display processed results in a table
- Allow manual correction of misrecognized answers
- Calculate scores automatically
- Show individual question results
- Export to CSV functionality

**Data Structure:**
```javascript
const studentResults = [
  {
    studentId: '123456789',
    phanI: ['A', 'B', 'C', 'D', ...], // Student's answers
    phanII: [
      { a: true, b: false, c: true, d: false },
      // ... more answers
    ],
    phanIII: ['-1.5', '2.0', '45', ...],
    score: {
      phanI: 35, // out of 40
      phanII: 6,  // out of 8
      phanIII: 4, // out of 6
      total: 45,  // out of 54
      percentage: 83.33
    }
  }
]
```

### 4. CSV Export Format
```csv
Student ID,Total Score,Percentage,P1_Q1,P1_Q2,...,P2_Q1_a,P2_Q1_b,...,P3_Q1,P3_Q2,...
123456789,45,83.33,A,B,C,D,true,false,true,false,-1.5,2.0,45
```

## OpenCV Implementation Guide

### Image Preprocessing
```javascript
// Convert to grayscale
let gray = new cv.Mat();
cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

// Apply adaptive threshold
let thresh = new cv.Mat();
cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
```

### Bubble Detection
```javascript
// Find contours
let contours = new cv.MatVector();
let hierarchy = new cv.Mat();
cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

// Filter circular contours (bubbles)
// Check if bubble is filled by analyzing pixel density
```

### Region of Interest (ROI) Extraction
- Define coordinate ranges for each section based on the template
- Extract specific regions for student ID, Phần I, Phần II, Phần III
- Process each region separately

## User Interface Design

### Step-by-Step Workflow
1. **Setup Page**: Configure test parameters
2. **Upload Page**: Process answer sheets
3. **Review Page**: Verify and correct recognition results
4. **Export Page**: Download CSV results

### Responsive Design
- Mobile-friendly interface
- Clear navigation between steps
- Visual feedback for processing status
- Error handling and user guidance

## Error Handling
- Invalid image formats
- Poor image quality detection
- Ambiguous bubble selections
- Missing student ID recognition
- Network/processing errors

## Additional Features to Consider
- Batch processing multiple images
- Image rotation/alignment correction
- Template matching for better accuracy
- Statistics and analytics dashboard
- Print-friendly result summaries

## Implementation Priority
1. Basic UI structure and navigation
2. OpenCV.js integration and setup
3. Image upload and preprocessing
4. Student ID recognition
5. Multiple choice (Phần I) recognition
6. True/False (Phần II) recognition
7. Numerical (Phần III) recognition
8. Scoring logic and results display
9. CSV export functionality
10. Error handling and UI polish

Create this web application with clean, well-documented code, focusing on accuracy of bubble detection and user-friendly interface for teachers to efficiently score multiple choice tests.
