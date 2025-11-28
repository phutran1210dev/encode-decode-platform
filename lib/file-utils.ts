import { 
  FileData, 
  EncodedData, 
  ValidationError, 
  FileProcessingError, 
  isValidEncodedData,
  isValidFileData 
} from '@/types';

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum total size (50MB)
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new ValidationError('Invalid file: must be a File object'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        reject(new FileProcessingError('Failed to read file as text'));
        return;
      }
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new FileProcessingError(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
};

export const processFiles = async (files: FileList | null): Promise<FileData[]> => {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }
  
  const fileArray = Array.from(files);
  const processedFiles: FileData[] = [];
  
  let totalSize = 0;
  
  for (const file of fileArray) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File "${file.name}" is too large (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    
    totalSize += file.size;
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error(`Total file size exceeds limit (max: ${MAX_TOTAL_SIZE / 1024 / 1024}MB)`);
    }
    
    const content = await readFileAsText(file);
    processedFiles.push({
      name: file.name,
      content,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });
  }
  
  return processedFiles;
};

export const encodeToBase64 = (files: readonly FileData[]): string => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ValidationError('Invalid files array provided');
  }
  
  // Validate all files have required properties
  const invalidFiles = files.filter(file => !isValidFileData(file));
  
  if (invalidFiles.length > 0) {
    throw new ValidationError(`Invalid file data: ${invalidFiles.length} files missing required properties`);
  }
  
  const encodedData: EncodedData = {
    files,
    timestamp: Date.now(),
    metadata: {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
      encoding: 'base64' as const,
    },
  };
  
  try {
    const jsonString = JSON.stringify(encodedData);
    return btoa(unescape(encodeURIComponent(jsonString)));
  } catch (error) {
    throw new FileProcessingError(`Failed to encode data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const decodeFromBase64 = (base64String: string): EncodedData => {
  if (!base64String || typeof base64String !== 'string') {
    throw new ValidationError('Invalid encoded string: must be a non-empty string');
  }
  
  try {
    const jsonString = decodeURIComponent(escape(atob(base64String)));
    const data = JSON.parse(jsonString) as unknown;
    
    // Type guard to ensure decoded data matches EncodedData interface
    if (!isValidEncodedData(data)) {
      throw new ValidationError('Decoded data does not match expected format', {
        receivedType: typeof data,
        hasFiles: Array.isArray((data as any)?.files)
      });
    }
    
    return data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new FileProcessingError(`Failed to decode data: ${error.message}`);
    }
    
    throw new FileProcessingError('Invalid encoded data: unknown error occurred');
  }
};

export const downloadFile = (content: string, filename: string) => {
  if (!content || typeof content !== 'string') {
    throw new ValidationError('Invalid content: must be a non-empty string');
  }
  
  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Invalid filename: must be a non-empty string');
  }
  
  try {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw new FileProcessingError(`Failed to download file: ${error.message}`);
    }
    throw new FileProcessingError('Failed to download file: unknown error');
  }
};

export const downloadAllFiles = (files: readonly FileData[]) => {
  files.forEach(file => {
    downloadFile(file.content, file.name);
  });
};

export const copyToClipboard = async (text: string): Promise<void> => {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Invalid text: must be a non-empty string');
  }
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;';
    document.body.appendChild(textArea);
    
    try {
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      
      if (!successful) {
        throw new Error('Copy command failed');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new FileProcessingError(`Failed to copy to clipboard: ${error.message}`);
    }
    throw new FileProcessingError('Failed to copy to clipboard: unknown error');
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};