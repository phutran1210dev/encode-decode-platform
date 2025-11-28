import { FileData, EncodedData } from '@/types';
import { 
  processFiles as processFilesUtil,
  encodeToBase64 as encodeUtil,
  decodeFromBase64 as decodeUtil
} from '@/lib/file-utils';

export interface IFileProcessingService {
  processFiles(files: FileList | null, onProgress?: (progress: number, fileName?: string) => void): Promise<FileData[]>;
  encodeFiles(files: FileData[]): string;
  decodeData(base64: string): EncodedData;
}

// Dependency Inversion: Depend on abstractions, not concretions
export class FileProcessingService implements IFileProcessingService {
  
  // Single Responsibility: Handle file processing
  async processFiles(
    files: FileList | null, 
    onProgress?: (progress: number, fileName?: string) => void
  ): Promise<FileData[]> {
    return await processFilesUtil(files, onProgress);
  }

  // Single Responsibility: Handle encoding
  encodeFiles(files: FileData[]): string {
    return encodeUtil(files);
  }

  // Single Responsibility: Handle decoding
  decodeData(base64: string): EncodedData {
    return decodeUtil(base64);
  }
}

// Factory pattern for service creation
export const createFileProcessingService = (): IFileProcessingService => {
  return new FileProcessingService();
};