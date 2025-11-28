import { FileData } from '@/types';

export interface IImageService {
  isImageFile(file: FileData): boolean;
  getImagePreviewData(file: FileData): string;
  isSvgFile(file: FileData): boolean;
}

// Liskov Substitution Principle: Can be substituted by any implementation
export class ImageService implements IImageService {
  private readonly imageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/bmp', 'image/webp', 'image/svg+xml'
  ];
  
  private readonly imageExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'
  ];

  // Single Responsibility: Check if file is an image
  isImageFile(file: FileData): boolean {
    return this.imageTypes.includes(file.type.toLowerCase()) || 
           this.imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  // Single Responsibility: Get image data for preview
  getImagePreviewData(file: FileData): string {
    if (file.isBinary && file.content.startsWith('data:')) {
      return file.content;
    }
    return `data:${file.type};base64,${btoa(file.content)}`;
  }

  // Single Responsibility: Check if file is SVG
  isSvgFile(file: FileData): boolean {
    return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  }

  // Single Responsibility: Get SVG content for rendering
  getSvgContent(file: FileData): string {
    if (file.isBinary && file.content.startsWith('data:')) {
      return atob(file.content.split(',')[1]);
    }
    return file.content;
  }
}

// Factory pattern
export const createImageService = (): IImageService => {
  return new ImageService();
};