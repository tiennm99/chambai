import { processAnswerSheet, ProcessingResult } from './opencvUtils';

export interface ImageProcessingOptions {
  questions: number;
  choices: number;
  correctAnswers: number[];
  debugMode?: boolean;
}

export interface ProcessingSteps {
  original: string;
  grayscale: string;
  edges: string;
  contours: string;
  warped: string;
  final: string;
}

export class ImageProcessor {
  private isOpenCVReady = false;

  constructor() {
    this.initializeOpenCV();
  }

  private async initializeOpenCV(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.cv && window.cv.Mat) {
        this.isOpenCVReady = true;
        resolve();
      } else if (typeof window !== 'undefined') {
        window.cv = window.cv || {};
        window.cv.onRuntimeInitialized = () => {
          this.isOpenCVReady = true;
          resolve();
        };
      }
    });
  }

  public async processImage(
    imageData: ImageData,
    options: ImageProcessingOptions
  ): Promise<ProcessingResult & { steps?: ProcessingSteps }> {
    if (!this.isOpenCVReady) {
      await this.initializeOpenCV();
    }

    // Convert ImageData to cv.Mat
    const src = window.cv.matFromImageData(imageData);
    
    try {
      const result = processAnswerSheet(
        src,
        options.correctAnswers,
        options.questions,
        options.choices
      );

      if (options.debugMode) {
        // Generate debug images showing processing steps
        const steps = await this.generateDebugSteps(src, options);
        return { ...result, steps };
      }

      return result;
    } finally {
      src.delete();
    }
  }

  private async generateDebugSteps(
    src: any,
    options: ImageProcessingOptions
  ): Promise<ProcessingSteps> {
    const heightImg = 700;
    const widthImg = 700;

    const cv = window.cv;
    
    // Resize image
    const resized = new cv.Mat();
    cv.resize(src, resized, new cv.Size(widthImg, heightImg));

    // Convert to grayscale
    const imgGray = new cv.Mat();
    cv.cvtColor(resized, imgGray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur
    const imgBlur = new cv.Mat();
    cv.GaussianBlur(imgGray, imgBlur, new cv.Size(5, 5), 1);

    // Apply Canny edge detection
    const imgCanny = new cv.Mat();
    cv.Canny(imgBlur, imgCanny, 10, 70);

    // Find contours for visualization
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(imgCanny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_NONE);

    // Create contour visualization
    const imgContours = resized.clone();
    cv.drawContours(imgContours, contours, -1, new cv.Scalar(0, 255, 0), 2);

    // Convert images to data URLs for display
    const steps: ProcessingSteps = {
      original: this.matToDataURL(resized),
      grayscale: this.matToDataURL(imgGray),
      edges: this.matToDataURL(imgCanny),
      contours: this.matToDataURL(imgContours),
      warped: this.matToDataURL(resized), // Placeholder
      final: this.matToDataURL(resized),  // Placeholder
    };

    // Clean up
    resized.delete();
    imgGray.delete();
    imgBlur.delete();
    imgCanny.delete();
    imgContours.delete();
    contours.delete();
    hierarchy.delete();

    return steps;
  }

  private matToDataURL(mat: any): string {
    const canvas = document.createElement('canvas');
    window.cv.imshow(canvas, mat);
    return canvas.toDataURL();
  }

  public async processImageFromFile(
    file: File,
    options: ImageProcessingOptions
  ): Promise<ProcessingResult & { steps?: ProcessingSteps }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = await this.processImage(imageData, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  public async processImageFromCanvas(
    canvas: HTMLCanvasElement,
    options: ImageProcessingOptions
  ): Promise<ProcessingResult & { steps?: ProcessingSteps }> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.processImage(imageData, options);
  }

  public isReady(): boolean {
    return this.isOpenCVReady;
  }
}

export const imageProcessor = new ImageProcessor();