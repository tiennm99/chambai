// OpenCV.js type declarations for browser usage

export interface OpenCVRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OpenCVScalar {
  [key: number]: number;
}

export interface OpenCVSize {
  width: number;
  height: number;
}

export interface OpenCVMat {
  delete: () => void;
  roi: (rect: OpenCVRect) => OpenCVMat;
  setTo: (scalar: OpenCVScalar) => void;
  rows: number;
  cols: number;
  size: () => number;
  get: (index: number) => OpenCVMat;
  data64F: Float64Array;
  data: Uint8Array;
  ucharPtr: (row: number, col: number) => Uint8Array;
  type: () => number;
}

export interface OpenCV {
  matFromImageData: (imageData: ImageData) => OpenCVMat;
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  adaptiveThreshold: (src: OpenCVMat, dst: OpenCVMat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, C: number) => void;
  threshold: (src: OpenCVMat, dst: OpenCVMat, thresh: number, maxval: number, type: number) => number;
  findContours: (image: OpenCVMat, contours: OpenCVMat, hierarchy: OpenCVMat, mode: number, method: number) => void;
  contourArea: (contour: OpenCVMat) => number;
  arcLength: (contour: OpenCVMat, closed: boolean) => number;
  boundingRect: (contour: OpenCVMat) => { x: number; y: number; width: number; height: number };
  mean: (src: OpenCVMat, mask?: OpenCVMat) => number[];
  meanStdDev: (src: OpenCVMat, mean: OpenCVMat, stdDev: OpenCVMat, mask?: OpenCVMat) => void;
  GaussianBlur: (src: OpenCVMat, dst: OpenCVMat, ksize: OpenCVSize, sigmaX: number) => void;
  medianBlur: (src: OpenCVMat, dst: OpenCVMat, ksize: number) => void;
  morphologyEx: (src: OpenCVMat, dst: OpenCVMat, op: number, kernel: OpenCVMat) => void;
  getStructuringElement: (shape: number, ksize: OpenCVSize) => OpenCVMat;
  getPerspectiveTransform: (src: OpenCVMat, dst: OpenCVMat) => OpenCVMat;
  warpPerspective: (src: OpenCVMat, dst: OpenCVMat, M: OpenCVMat, dsize: OpenCVSize) => void;
  circle: (img: OpenCVMat, center: { x: number; y: number }, radius: number, color: number[], thickness: number) => void;
  Mat: new (rows?: number, cols?: number, type?: number) => OpenCVMat;
  MatVector: new () => OpenCVMat;
  Rect: new (x: number, y: number, width: number, height: number) => OpenCVRect;
  Scalar: new (...values: number[]) => OpenCVScalar;
  Size: new (width: number, height: number) => OpenCVSize;
  // Color conversion codes
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  // Threshold types
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  ADAPTIVE_THRESH_MEAN_C: number;
  THRESH_BINARY: number;
  THRESH_BINARY_INV: number;
  THRESH_OTSU: number;
  // Contour retrieval modes
  RETR_EXTERNAL: number;
  RETR_LIST: number;
  RETR_TREE: number;
  // Contour approximation
  CHAIN_APPROX_SIMPLE: number;
  CHAIN_APPROX_NONE: number;
  // Mat types
  CV_8UC1: number;
  CV_8UC3: number;
  CV_8UC4: number;
  CV_32FC2: number;
  // Morphology
  MORPH_CLOSE: number;
  MORPH_OPEN: number;
  MORPH_RECT: number;
  MORPH_ELLIPSE: number;
  // Lifecycle
  onRuntimeInitialized: () => void;
}

declare global {
  interface Window {
    cv: OpenCV;
  }
}
