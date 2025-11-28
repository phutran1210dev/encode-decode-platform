import { FileData } from '@/types';
import { downloadFile as downloadFileUtil, downloadAllFiles as downloadAllFilesUtil } from '@/lib/file-utils';

export interface IDownloadService {
  downloadSingle(file: FileData): void;
  downloadAll(files: readonly FileData[]): void;
}

// Open/Closed Principle: Open for extension, closed for modification
export class DownloadService implements IDownloadService {
  
  // Single Responsibility: Handle single file download
  downloadSingle(file: FileData): void {
    downloadFileUtil(file.content, file.name, file.isBinary);
  }

  // Single Responsibility: Handle multiple files download
  downloadAll(files: readonly FileData[]): void {
    downloadAllFilesUtil(files);
  }
}

// Factory pattern
export const createDownloadService = (): IDownloadService => {
  return new DownloadService();
};