export interface SaveImageOptions {
  filename?: string;
  timestamp?: boolean;
  format?: 'png' | 'jpg';
  quality?: number;
}

export class ImageSaver {
  private static counter = 0;

  static async saveDebugImage(
    dataUrl: string, 
    options: SaveImageOptions = {}
  ): Promise<string> {
    const {
      filename = 'debug_image',
      timestamp = true,
      format = 'png',
      quality = 0.9
    } = options;

    try {
      // Generate filename with timestamp and counter
      this.counter++;
      const now = new Date();
      const timeStr = timestamp 
        ? `_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`
        : '';
      
      const finalFilename = `${filename}${timeStr}_${this.counter.toString().padStart(3, '0')}.${format}`;

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      console.log(`✅ Debug image saved: ${finalFilename}`);
      return finalFilename;
    } catch (error) {
      console.error('❌ Error saving debug image:', error);
      throw error;
    }
  }

  static async saveMultipleImages(
    images: { dataUrl: string; name: string }[],
    baseFilename: string = 'processed'
  ): Promise<string[]> {
    const savedFiles: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        const filename = await this.saveDebugImage(image.dataUrl, {
          filename: `${baseFilename}_${image.name}`,
          timestamp: true
        });
        savedFiles.push(filename);
      } catch (error) {
        console.error(`Failed to save image ${image.name}:`, error);
      }
    }

    return savedFiles;
  }

  static downloadAsZip(images: { dataUrl: string; name: string }[], zipName: string = 'debug_images.zip') {
    // This would require a library like JSZip for browser-based zip creation
    // For now, we'll save individually
    console.log('📁 Saving images individually (zip functionality requires JSZip library)');
    return this.saveMultipleImages(images, 'debug');
  }

  static async saveProcessingSteps(
    steps: {
      original: string;
      grayscale: string;
      edges: string;
      contours: string;
      warped: string;
      final: string;
    },
    baseFilename: string = 'processing_steps'
  ): Promise<string[]> {
    const imageList = [
      { dataUrl: steps.original, name: 'original' },
      { dataUrl: steps.grayscale, name: 'grayscale' },
      { dataUrl: steps.edges, name: 'edges' },
      { dataUrl: steps.contours, name: 'contours' },
      { dataUrl: steps.warped, name: 'warped' },
      { dataUrl: steps.final, name: 'final' }
    ];

    return this.saveMultipleImages(imageList, baseFilename);
  }
}

// Helper function to convert canvas to data URL with specific format
export function canvasToDataUrl(canvas: HTMLCanvasElement, format: 'png' | 'jpg' = 'png', quality: number = 0.9): string {
  if (format === 'jpg') {
    return canvas.toDataURL('image/jpeg', quality);
  }
  return canvas.toDataURL('image/png');
}

// Helper function to convert OpenCV Mat to data URL
export function matToDataUrl(mat: any, format: 'png' | 'jpg' = 'png', quality: number = 0.9): string {
  const canvas = document.createElement('canvas');
  if (window.cv && window.cv.imshow) {
    window.cv.imshow(canvas, mat);
    return canvasToDataUrl(canvas, format, quality);
  }
  throw new Error('OpenCV not available');
}

// Storage utilities for browser environment
export class LocalImageStorage {
  private static readonly STORAGE_KEY = 'chambai_debug_images';
  private static readonly MAX_IMAGES = 10;

  static saveToStorage(dataUrl: string, metadata: any = {}): string {
    const stored = this.getStoredImages();
    const id = Date.now().toString();
    
    const imageData = {
      id,
      dataUrl,
      metadata,
      timestamp: new Date().toISOString()
    };

    stored.push(imageData);

    // Keep only the latest MAX_IMAGES
    if (stored.length > this.MAX_IMAGES) {
      stored.splice(0, stored.length - this.MAX_IMAGES);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      console.log(`💾 Debug image stored in localStorage with ID: ${id}`);
      return id;
    } catch (error) {
      console.warn('⚠️ Failed to store image in localStorage (quota exceeded?):', error);
      return '';
    }
  }

  static getStoredImages(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored images:', error);
      return [];
    }
  }

  static getImageById(id: string): any | null {
    const stored = this.getStoredImages();
    return stored.find(img => img.id === id) || null;
  }

  static clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Cleared debug image storage');
  }
}