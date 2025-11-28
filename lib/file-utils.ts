import { 
  FileData, 
  EncodedData, 
  ValidationError, 
  FileProcessingError, 
  isValidEncodedData,
  isValidFileData 
} from '@/types';
import JSZip from 'jszip';

// Maximum file size (5MB per file for QR compatibility)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum total size (25MB total for all files)
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

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

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new ValidationError('Invalid file: must be a File object'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!(result instanceof ArrayBuffer)) {
        reject(new FileProcessingError('Failed to read file as ArrayBuffer'));
        return;
      }
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new FileProcessingError(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const extractZipFile = async (zipFile: File): Promise<FileData[]> => {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(zipFile);
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const extractedFiles: FileData[] = [];
    
    // Use JSZip's forEach method for proper typing
    await Promise.all(
      Object.entries(zip.files).map(async ([relativePath, zipEntry]) => {
        // Skip directories and hidden files
        if (zipEntry.dir || relativePath.startsWith('.') || relativePath.includes('__MACOSX')) {
          return;
        }
        
        try {
          const fileName = relativePath.split('/').pop() || relativePath;
          
          // Determine if this is likely a binary file based on extension
          const isBinary = /\.(jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx|zip|exe|dll|bin)$/i.test(fileName);
          
          let content: string;
          let fileType: string;
          let size: number;
          
          if (isBinary) {
            // For binary files, get as base64 data URL
            const arrayBuffer = await zipEntry.async('arraybuffer');
            const blob = new Blob([arrayBuffer]);
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            content = dataUrl;
            size = arrayBuffer.byteLength;
            fileType = 'application/octet-stream'; // Generic binary type
          } else {
            // For text files, read as text
            content = await zipEntry.async('text');
            size = content.length;
            fileType = 'text/plain';
          }
          
          extractedFiles.push({
            name: `[${zipFile.name}] ${fileName}`,
            content,
            size,
            type: fileType,
            lastModified: zipEntry.date?.getTime() || Date.now(),
            isBinary,
          });
        } catch (error) {
          // Skip files that can't be processed
          console.warn(`Skipping file ${relativePath}:`, error);
        }
      })
    );
    
    if (extractedFiles.length === 0) {
      throw new FileProcessingError('No readable text files found in ZIP archive');
    }
    
    return extractedFiles;
  } catch (error) {
    if (error instanceof FileProcessingError) {
      throw error;
    }
    throw new FileProcessingError(`Failed to extract ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const isZipFile = (file: File): boolean => {
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip-compressed' || 
         file.name.toLowerCase().endsWith('.zip');
};

export const isBinaryFile = (file: File): boolean => {
  // Check MIME type first
  if (file.type.startsWith('image/') || 
      file.type.startsWith('video/') || 
      file.type.startsWith('audio/') ||
      file.type === 'application/pdf' ||
      file.type === 'application/zip' ||
      file.type === 'application/octet-stream') {
    return true;
  }
  
  // Check file extensions for common binary files
  const binaryExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',
    '.mp3', '.wav', '.flac', '.aac', '.ogg',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib'
  ];
  
  const fileName = file.name.toLowerCase();
  return binaryExtensions.some(ext => fileName.endsWith(ext));
};

export const readFileAsBinary = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new ValidationError('Invalid file: must be a File object'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        reject(new FileProcessingError('Failed to read file as binary'));
        return;
      }
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new FileProcessingError(`Failed to read file: ${file.name}`));
    };
    
    // Use readAsDataURL for binary files to preserve data integrity
    reader.readAsDataURL(file);
  });
};

export const processFiles = async (
  files: FileList | null, 
  onProgress?: (progress: number, fileName?: string) => void
): Promise<FileData[]> => {
  if (!files || files.length === 0) {
    throw new ValidationError('No files provided');
  }
  
  const fileArray = Array.from(files);
  const processedFiles: FileData[] = [];
  const totalFiles = fileArray.length;
  
  let totalSize = 0;
  let processedCount = 0;
  
  for (const file of fileArray) {
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File "${file.name}" is too large (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }
    
    totalSize += file.size;
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new ValidationError(`Total file size exceeds limit (max: ${MAX_TOTAL_SIZE / 1024 / 1024}MB)`);
    }
    
    // Update progress
    onProgress?.(Math.round((processedCount / totalFiles) * 100), file.name);
    
    // Handle ZIP files differently
    if (isZipFile(file)) {
      try {
        const extractedFiles = await extractZipFile(file);
        processedFiles.push(...extractedFiles);
      } catch (error) {
        throw new FileProcessingError(`Failed to process ZIP file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Handle regular files - detect if binary or text
      try {
        let content: string;
        const isBinary = isBinaryFile(file);
        
        if (isBinary) {
          // Read binary files as data URL to preserve integrity
          content = await readFileAsBinary(file);
          console.log(`Reading binary file: ${file.name} (${file.type})`);
        } else {
          // Read text files normally
          content = await readFileAsText(file);
          console.log(`Reading text file: ${file.name}`);
        }

        processedFiles.push({
          name: file.name,
          content,
          size: file.size,
          type: file.type || 'text/plain',
          lastModified: file.lastModified,
          isBinary,
        });
      } catch (error) {
        throw new FileProcessingError(`Failed to process file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    processedCount++;
    onProgress?.(Math.round((processedCount / totalFiles) * 100), file.name);
  }
  
  // Complete
  onProgress?.(100);
  
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

export const downloadFile = (content: string, filename: string, isBinary: boolean = false) => {
  if (!content || typeof content !== 'string') {
    throw new ValidationError('Invalid content: must be a non-empty string');
  }
  
  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Invalid filename: must be a non-empty string');
  }
  
  try {
    let url: string;
    
    if (isBinary && content.startsWith('data:')) {
      // For binary files stored as data URLs, use the data URL directly
      url = content;
    } else {
      // For text files, create a blob
      const blob = new Blob([content], { type: isBinary ? 'application/octet-stream' : 'text/plain' });
      url = URL.createObjectURL(blob);
    }
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Only revoke URL if we created it (not for data URLs)
    if (!content.startsWith('data:')) {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new FileProcessingError(`Failed to download file: ${error.message}`);
    }
    throw new FileProcessingError('Failed to download file: unknown error');
  }
};

export const downloadAllFiles = (files: readonly FileData[]) => {
  files.forEach(file => {
    downloadFile(file.content, file.name, file.isBinary);
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