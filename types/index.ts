export interface FileData {
  name: string;
  content: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface EncodedData {
  files: FileData[];
  timestamp: number;
  metadata: {
    totalFiles: number;
    totalSize: number;
    encoding: string;
  };
}