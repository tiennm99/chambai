// OpenCV utilities for chambai project
// These functions work with the browser-loaded OpenCV.js

export interface Point {
  x: number;
  y: number;
}

export interface ProcessingResult {
  answers: number[];
  score: number;
  grading: boolean[];
  processedImage?: string;
}

export function rectContour(contours: any): any {
  const cv = window.cv;
  const rectCon = new cv.MatVector();
  
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    if (area > 50) {
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);
      
      if (approx.rows === 4) {
        rectCon.push_back(contour);
      }
      
      approx.delete();
    }
  }
  
  // Sort by area (largest first)
  const sortedContours = [];
  for (let i = 0; i < rectCon.size(); i++) {
    const contour = rectCon.get(i);
    const area = cv.contourArea(contour);
    sortedContours.push({ contour, area });
  }
  
  sortedContours.sort((a, b) => b.area - a.area);
  
  const result = new cv.MatVector();
  sortedContours.forEach(item => result.push_back(item.contour));
  
  return result;
}

export function getCornerPoints(contour: any): any {
  const cv = window.cv;
  const peri = cv.arcLength(contour, true);
  const approx = new cv.Mat();
  cv.approxPolyDP(contour, approx, 0.02 * peri, true);
  return approx;
}

export function reorder(points: any): any {
  const cv = window.cv;
  const pointsArray = [];
  for (let i = 0; i < points.rows; i++) {
    pointsArray.push([points.data32S[i * 2], points.data32S[i * 2 + 1]]);
  }

  const newPoints = new cv.Mat(4, 1, cv.CV_32SC2);
  
  // Calculate sums and differences
  const sums = pointsArray.map(p => p[0] + p[1]);
  const diffs = pointsArray.map(p => p[1] - p[0]);
  
  // Find indices
  const minSumIdx = sums.indexOf(Math.min(...sums));
  const maxSumIdx = sums.indexOf(Math.max(...sums));
  const minDiffIdx = diffs.indexOf(Math.min(...diffs));
  const maxDiffIdx = diffs.indexOf(Math.max(...diffs));
  
  // Assign corners
  newPoints.data32S[0] = pointsArray[minSumIdx][0];
  newPoints.data32S[1] = pointsArray[minSumIdx][1];
  newPoints.data32S[2] = pointsArray[minDiffIdx][0];
  newPoints.data32S[3] = pointsArray[minDiffIdx][1];
  newPoints.data32S[4] = pointsArray[maxDiffIdx][0];
  newPoints.data32S[5] = pointsArray[maxDiffIdx][1];
  newPoints.data32S[6] = pointsArray[maxSumIdx][0];
  newPoints.data32S[7] = pointsArray[maxSumIdx][1];
  
  return newPoints;
}

export function splitBoxes(img: any, questions: number = 5, choices: number = 5): any[] {
  const cv = window.cv;
  const boxes: any[] = [];
  const rowHeight = Math.floor(img.rows / questions);
  const colWidth = Math.floor(img.cols / choices);
  
  for (let r = 0; r < questions; r++) {
    for (let c = 0; c < choices; c++) {
      const rect = new cv.Rect(
        c * colWidth,
        r * rowHeight,
        colWidth,
        rowHeight
      );
      const box = img.roi(rect);
      boxes.push(box);
    }
  }
  
  return boxes;
}

export function drawGrid(img: any, questions: number = 5, choices: number = 5): any {
  const cv = window.cv;
  const secW = Math.floor(img.cols / choices);
  const secH = Math.floor(img.rows / questions);
  
  for (let i = 0; i <= questions; i++) {
    cv.line(
      img,
      new cv.Point(0, secH * i),
      new cv.Point(img.cols, secH * i),
      new cv.Scalar(255, 255, 0),
      2
    );
  }
  
  for (let i = 0; i <= choices; i++) {
    cv.line(
      img,
      new cv.Point(secW * i, 0),
      new cv.Point(secW * i, img.rows),
      new cv.Scalar(255, 255, 0),
      2
    );
  }
  
  return img;
}

export function showAnswers(
  img: any,
  userAnswers: number[],
  grading: boolean[],
  correctAnswers: number[],
  questions: number = 5,
  choices: number = 5
): any {
  const cv = window.cv;
  const secW = Math.floor(img.cols / choices);
  const secH = Math.floor(img.rows / questions);
  
  for (let x = 0; x < questions; x++) {
    const myAns = userAnswers[x];
    const cX = (myAns * secW) + Math.floor(secW / 2);
    const cY = (x * secH) + Math.floor(secH / 2);
    
    if (grading[x]) {
      // Correct answer - green circle
      cv.circle(img, new cv.Point(cX, cY), 50, new cv.Scalar(0, 255, 0), cv.FILLED);
    } else {
      // Wrong answer - red circle
      cv.circle(img, new cv.Point(cX, cY), 50, new cv.Scalar(0, 0, 255), cv.FILLED);
      
      // Show correct answer - small green circle
      const correctAns = correctAnswers[x];
      const correctX = (correctAns * secW) + Math.floor(secW / 2);
      const correctY = (x * secH) + Math.floor(secH / 2);
      cv.circle(img, new cv.Point(correctX, correctY), 20, new cv.Scalar(0, 255, 0), cv.FILLED);
    }
  }
  
  return img;
}

// Simplified processAnswerSheet function for the main processing
export function processAnswerSheet(
  img: any,
  correctAnswers: number[],
  questions: number = 5,
  choices: number = 5
): ProcessingResult {
  const cv = window.cv;
  const heightImg = 700;
  const widthImg = 700;
  
  // This is a simplified version - the main processing is done in the component
  return {
    answers: [0, 1, 2, 3, 4], // Default answers
    score: 80,
    grading: [true, true, false, true, false],
  };
}

// Global declarations for TypeScript
declare global {
  interface Window {
    cv: any;
  }
}