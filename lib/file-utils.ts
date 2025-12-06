import { 
  FileData, 
  EncodedData, 
  ValidationError, 
  FileProcessingError, 
  isValidEncodedData,
  isValidFileData 
} from '@/types';
import JSZip from 'jszip';

// Maximum file size (50MB per file with streaming support)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
// Maximum total size (50MB total for all files)
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
          // Preserve full relative path for directory structure
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
            name: fileName, // Keep original filename only
            content,
            size,
            type: fileType,
            lastModified: zipEntry.date?.getTime() || Date.now(),
            isBinary,
            path: relativePath, // Preserve full path from ZIP
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
  
  console.log(`📁 Processing ${totalFiles} files...`);
  
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
    
    // Handle all files uniformly - no extraction for ZIP files
    try {
      let content: string;
      const isBinary = isBinaryFile(file);
      
      console.log(`  📄 Processing file ${processedCount + 1}/${totalFiles}: ${file.name} (${isBinary ? 'binary' : 'text'}, ${(file.size / 1024).toFixed(2)}KB)`);
      
      if (isBinary) {
        // Read binary files (including ZIP) as data URL to preserve integrity
        content = await readFileAsBinary(file);
      } else {
        // Read text files normally
        content = await readFileAsText(file);
      }

      const fileData: FileData = {
        name: file.name,
        content,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        isBinary,
      };
      
      processedFiles.push(fileData);
      console.log(`  ✅ File ${processedCount + 1} processed successfully: ${file.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to process file "${file.name}":`, error);
      throw new FileProcessingError(`Failed to process file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    processedCount++;
    onProgress?.(Math.round((processedCount / totalFiles) * 100), file.name);
  }
  
  // Complete
  onProgress?.(100);
  
  console.log(`✅ All ${processedFiles.length} files processed successfully`);
  
  return processedFiles;
};

export const encodeToBase64 = (files: readonly FileData[]): string => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ValidationError('Invalid files array provided');
  }
  
  console.log(`🔐 Encoding ${files.length} files to base64...`);
  
  // Validate all files have required properties
  const invalidFiles = files.filter(file => !isValidFileData(file));
  
  if (invalidFiles.length > 0) {
    console.error('❌ Invalid files found:', invalidFiles);
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
  
  console.log(`  📊 Metadata: ${encodedData.metadata.totalFiles} files, ${(encodedData.metadata.totalSize / 1024).toFixed(2)}KB total`);
  
  try {
    const jsonString = JSON.stringify(encodedData);
    const encoded = btoa(unescape(encodeURIComponent(jsonString)));
    console.log(`  ✅ Encoded successfully: ${(encoded.length / 1024).toFixed(2)}KB base64`);
    return encoded;
  } catch (error) {
    console.error('❌ Encoding failed:', error);
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
      const dataObj = data as Record<string, unknown>;
      console.error('Invalid decoded data structure:', {
        receivedType: typeof data,
        hasFiles: Array.isArray(dataObj?.files),
        filesCount: Array.isArray(dataObj?.files) 
          ? (dataObj.files as unknown[]).length 
          : 0,
        metadata: dataObj?.metadata,
      });
      
      const dataObj2 = data as Record<string, unknown>;
      throw new ValidationError('Decoded data does not match expected format', {
        receivedType: typeof data,
        hasFiles: Array.isArray(dataObj2?.files),
        filesCount: Array.isArray(dataObj2?.files) 
          ? (dataObj2.files as unknown[]).length 
          : 0,
      });
    }
    
    // Log successful decode for debugging
    console.log('Successfully decoded data:', {
      filesCount: data.files.length,
      totalSize: data.metadata.totalSize,
      timestamp: data.timestamp,
    });
    
    return data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    if (error instanceof Error) {
      console.error('Decode error:', error);
      throw new FileProcessingError(`Failed to decode data: ${error.message}`);
    }
    
    throw new FileProcessingError('Invalid encoded data: unknown error occurred');
  }
};

export const downloadFile = async (content: string, filename: string, isBinary: boolean = false, path?: string, useFilePicker: boolean = true) => {
  if (!content || typeof content !== 'string') {
    throw new ValidationError('Invalid content: must be a non-empty string');
  }
  
  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Invalid filename: must be a non-empty string');
  }
  
  try {
    let blob: Blob;
    
    if (isBinary && content.startsWith('data:')) {
      // For binary files stored as data URLs, extract MIME type and convert to blob
      const matches = content.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // Fallback if data URL format is unexpected
        blob = new Blob([content], { type: 'application/octet-stream' });
      }
    } else {
      // For text files, create a blob with appropriate MIME type
      blob = new Blob([content], { type: isBinary ? 'application/octet-stream' : 'text/plain' });
    }
    
    // Try to use File System Access API if supported and enabled
    if (useFilePicker && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: path || filename,
          types: [{
            description: 'Files',
            accept: {
              '*/*': ['.txt', '.json', '.jpg', '.png', '.pdf', '.zip', '.*']
            }
          }]
        });
        
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        // User cancelled or API not available, fall back to standard download
        if ((err as Error).name !== 'AbortError') {
          console.warn('File picker failed, using fallback:', err);
        }
      }
    }
    
    // Fallback: Standard download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use path if available to preserve directory structure, otherwise use filename
    a.download = path || filename;
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

export const downloadAllFiles = async (files: readonly FileData[]) => {
  if (!files || files.length === 0) {
    throw new ValidationError('No files to download');
  }
  
  // If only one file, download directly
  if (files.length === 1) {
    downloadFile(files[0].content, files[0].name, files[0].isBinary, files[0].path);
    return;
  }
  
  // Multiple files: create ZIP archive
  try {
    const zip = new JSZip();
    const failedFiles: string[] = [];
    let successCount = 0;
    
    for (const file of files) {
      try {
        // Validate file data first
        if (!file.name || typeof file.content !== 'string') {
          failedFiles.push(`${file.name || 'unnamed'} (missing name or content)`);
          console.error(`Invalid file data:`, { name: file.name, hasContent: !!file.content });
          continue;
        }
        
        if (file.isBinary && file.content.startsWith('data:')) {
          // Handle binary files stored as data URLs
          const matches = file.content.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const base64Data = matches[2];
            // Validate base64 data
            if (!base64Data || base64Data.length === 0) {
              failedFiles.push(`${file.name} (empty base64 data)`);
              console.error(`Empty base64 data for file: ${file.name}`);
              continue;
            }
            
            // Add to ZIP with path to preserve directory structure
            const filePath = file.path || file.name;
            zip.file(filePath, base64Data, { base64: true });
            successCount++;
            console.log(`Successfully added binary file to ZIP: ${filePath}`);
          } else {
            failedFiles.push(`${file.name} (invalid data URL format)`);
            console.error(`Invalid data URL format for file: ${file.name}, content preview: ${file.content.substring(0, 100)}`);
          }
        } else {
          // Handle text files
          const filePath = file.path || file.name;
          zip.file(filePath, file.content);
          successCount++;
          console.log(`Successfully added text file to ZIP: ${filePath}`);
        }
      } catch (fileError) {
        // Track failed files
        const errorMsg = fileError instanceof Error ? fileError.message : 'Unknown error';
        failedFiles.push(`${file.name} (${errorMsg})`);
        console.error(`Failed to add file ${file.name} to ZIP:`, {
          error: fileError,
          fileSize: file.size,
          isBinary: file.isBinary,
          contentLength: file.content?.length || 0,
        });
      }
    }
    
    // Validate that we have at least some files in the ZIP
    if (successCount === 0) {
      throw new FileProcessingError(`Failed to add any files to ZIP. All ${files.length} files failed to process. Failed files: ${failedFiles.join(', ')}`);
    }
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    const zipFilename = `decoded-files-${Date.now()}.zip`;
    
    // Try to use File System Access API if supported
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: zipFilename,
          types: [{
            description: 'ZIP Archive',
            accept: {
              'application/zip': ['.zip']
            }
          }]
        });
        
        const writable = await handle.createWritable();
        await writable.write(zipBlob);
        await writable.close();
        
        // Throw warning if some files failed but at least some succeeded
        if (failedFiles.length > 0) {
          console.error(`Warning: ${failedFiles.length} of ${files.length} files failed:`, failedFiles);
          throw new FileProcessingError(`Downloaded ${successCount} of ${files.length} files. Failed files: ${failedFiles.map(f => f.split(' (')[0]).join(', ')}`);
        }
        
        return;
      } catch (err) {
        // User cancelled or API not available, fall back to standard download
        if ((err as Error).name !== 'AbortError') {
          console.warn('File picker failed, using fallback:', err);
        }
      }
    }
    
    // Fallback: Standard download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Throw warning if some files failed but at least some succeeded
    if (failedFiles.length > 0) {
      console.error(`Warning: ${failedFiles.length} of ${files.length} files failed:`, failedFiles);
      throw new FileProcessingError(`Downloaded ${successCount} of ${files.length} files. Failed files: ${failedFiles.map(f => f.split(' (')[0]).join(', ')}`);
    }
    
  } catch (error) {
    if (error instanceof Error) {
      throw new FileProcessingError(`Failed to create ZIP archive: ${error.message}`);
    }
    throw new FileProcessingError('Failed to create ZIP archive: unknown error');
  }
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