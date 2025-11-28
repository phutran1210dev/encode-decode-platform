import { FileData, EncodedData } from '@/types';

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Maximum total size (50MB)
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const processFiles = async (files: FileList): Promise<FileData[]> => {
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

export const encodeToBase64 = (files: FileData[]): string => {
  const encodedData: EncodedData = {
    files,
    timestamp: Date.now(),
    metadata: {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      encoding: 'base64',
    },
  };
  
  const jsonString = JSON.stringify(encodedData);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

export const decodeFromBase64 = (base64String: string): EncodedData => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64String)));
    const data = JSON.parse(jsonString) as EncodedData;
    
    // Validate the decoded data structure
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid data structure');
    }
    
    return data;
  } catch {
    throw new Error('Invalid base64 encoded data');
  }
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAllFiles = (files: FileData[]) => {
  files.forEach(file => {
    downloadFile(file.content, file.name);
  });
};

export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
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