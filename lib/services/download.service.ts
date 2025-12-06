import { FileData } from '@/types';
import { downloadFile as downloadFileUtil, downloadAllFiles as downloadAllFilesUtil } from '@/lib/file-utils';

export interface IDownloadService {
  downloadSingle(file: FileData): void;
  downloadAll(files: readonly FileData[]): Promise<void>;
}

// Open/Closed Principle: Open for extension, closed for modification
export class DownloadService implements IDownloadService {
  
  // Single Responsibility: Handle single file download
  downloadSingle(file: FileData): void {
    downloadFileUtil(file.content, file.name, file.isBinary, file.path);
  }

  // Single Responsibility: Handle multiple files download as ZIP
  async downloadAll(files: readonly FileData[]): Promise<void> {
    await downloadAllFilesUtil(files);
  }
}

// Factory pattern
export const createDownloadService = (): IDownloadService => {
  return new DownloadService();
};