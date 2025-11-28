// SOLID Principles: Dependency Inversion
// Central export for all services following SOLID principles

// Service interfaces and implementations
export * from './services/file-processing.service';
export * from './services/download.service';
export * from './services/image.service';

// Factory pattern for easy service creation
import { createFileProcessingService } from './services/file-processing.service';
import { createDownloadService } from './services/download.service';
import { createImageService } from './services/image.service';

export const createAllServices = () => ({
  fileProcessing: createFileProcessingService(),
  download: createDownloadService(),
  image: createImageService(),
});