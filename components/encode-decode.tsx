"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import MatrixRain from '@/components/matrix-effects';
import { HeaderSection, MainContent } from '@/components/templates';
import { copyToClipboard } from '@/lib/file-utils';
import { FileData, EncodedData } from '@/types';
// SOLID Principles: Dependency Injection
import {
  createFileProcessingService,
  createDownloadService,
  createImageService,
  type IFileProcessingService,
  type IDownloadService,
  type IImageService
} from '@/lib/services';

interface EncodeDecodeProps {
  autoFillData?: string;
}

export default function EncodeDecode({ autoFillData }: EncodeDecodeProps = {}) {
  const { toast } = useToast();
  
  // SOLID Principles: Dependency Injection - Services are injected at runtime
  const fileProcessingService = useMemo<IFileProcessingService>(() => createFileProcessingService(), []);
  const downloadService = useMemo<IDownloadService>(() => createDownloadService(), []);
  const imageService = useMemo<IImageService>(() => createImageService(), []);
  
  // Encoder state
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [encodedBase64, setEncodedBase64] = useState<string>('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'file'>('file');
  const [manualText, setManualText] = useState<string>('');
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined);
  
  // Decoder state
  const [base64Input, setBase64Input] = useState<string>('');
  const [decodedData, setDecodedData] = useState<EncodedData | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Auto-fill effect for QR code navigation
  useEffect(() => {
    if (autoFillData && autoFillData !== base64Input) {
      setBase64Input(autoFillData);
      // Auto-decode if valid data
      setTimeout(() => {
        if (autoFillData.trim()) {
          handleDecode();
        }
      }, 500);
    }
  }, [autoFillData]);
  

  
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setIsEncoding(true);
      setUploadProgress(0);
      setCurrentFileName(undefined);
      
      const processedFiles = await fileProcessingService.processFiles(files, (progress, fileName) => {
        setUploadProgress(progress);
        setCurrentFileName(fileName);
      });
      
      setSelectedFiles(processedFiles);
      
      // Hide progress bar after completion
      setTimeout(() => {
        setUploadProgress(undefined);
        setCurrentFileName(undefined);
      }, 1000);
      
      toast({
        title: "Files loaded successfully",
        description: `${processedFiles.length} files ready for encoding`,
      });
    } catch (error) {
      setUploadProgress(undefined);
      setCurrentFileName(undefined);
      
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleEncode = async () => {
    try {
      setIsEncoding(true);
      
      let filesToEncode: FileData[];
      
      if (inputMode === 'file') {
        if (selectedFiles.length === 0) {
          toast({
            title: "No files selected",
            description: "Please select files to encode",
            variant: "destructive",
          });
          return;
        }
        filesToEncode = selectedFiles;
      } else {
        if (!manualText.trim()) {
          toast({
            title: "No text provided",
            description: "Please enter text to encode",
            variant: "destructive",
          });
          return;
        }
        
        filesToEncode = [{
          name: "manual-input.txt",
          content: manualText,
          size: new Blob([manualText]).size,
          type: "text/plain",
          lastModified: Date.now(),
          isBinary: false,
        }];
      }
      
      // Check if it's a ZIP file - upload directly without encoding
      const isZipFile = filesToEncode.length === 1 && 
        (filesToEncode[0].name.toLowerCase().endsWith('.zip') || 
         filesToEncode[0].type === 'application/zip' ||
         filesToEncode[0].type === 'application/x-zip-compressed');
      
      if (isZipFile) {
        console.log('ZIP file detected, uploading directly to Supabase...');
        
        try {
          const zipFile = filesToEncode[0];
          // Convert base64 content back to blob for ZIP files
          const binaryString = atob(zipFile.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/zip' });
          
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('fileName', zipFile.name);
          
          const uploadResponse = await fetch('/api/upload-supabase', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload ZIP to Supabase');
          }
          
          const uploadResult = await uploadResponse.json();
          
          console.log(`ZIP uploaded to Supabase: ${uploadResult.url}`);
          
          // Store with FILE: prefix to indicate direct file download
          setEncodedBase64(`FILE:${uploadResult.url}:${zipFile.name}`);
          
          toast({
            title: "✅ ZIP file uploaded",
            description: `${zipFile.name} ready for QR download. No encoding needed.`,
            duration: 6000
          });
          return;
        } catch (uploadError) {
          console.error('ZIP upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: "Failed to upload ZIP file. Please try again.",
            variant: "destructive",
            duration: 8000
          });
          return;
        }
      }
      
      // Encode files to base64 (for non-ZIP files)
      const encoded = fileProcessingService.encodeFiles(filesToEncode);
      
      // Check if encoded data is large (> 1MB)
      const SIZE_THRESHOLD = 1 * 1024 * 1024; // 1MB
      
      if (encoded.length > SIZE_THRESHOLD) {
        console.log(`Large file detected (${(encoded.length / 1024 / 1024).toFixed(2)}MB), uploading to Supabase storage...`);
        
        try {
          // Upload to Supabase Storage
          const blob = new Blob([encoded], { type: 'application/octet-stream' });
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('fileName', `encoded-${Date.now()}.bin`);
          
          const uploadResponse = await fetch('/api/upload-supabase', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload to Supabase');
          }
          
          const uploadResult = await uploadResponse.json();
          
          console.log(`Uploaded to Supabase: ${uploadResult.url}`);
          
          // Store Supabase URL instead of actual data
          setEncodedBase64(`SUPABASE:${uploadResult.url}`);
          
          toast({
            title: "✅ Encoding successful (Supabase Storage)",
            description: `${filesToEncode.length} file(s) uploaded to cloud. Generate QR to share.`,
            duration: 6000
          });
        } catch (uploadError) {
          console.error('Supabase upload error:', uploadError);
          
          // Fallback: Store encoded data locally (may cause UI lag for very large files)
          setEncodedBase64(encoded);
          
          toast({
            title: "⚠️ Encoding successful (Local)",
            description: `File too large for cloud upload. QR generation may not work.`,
            variant: "destructive",
            duration: 8000
          });
        }
      } else {
        // For small files, store normally
        setEncodedBase64(encoded);
        
        toast({
          title: "Encoding successful",
          description: `${filesToEncode.length} file(s) encoded to base64`,
        });
      }
    } catch (error) {
      toast({
        title: "Encoding failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!base64Input.trim()) {
      toast({
        title: "No data to decode",
        description: "Please paste base64 encoded data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecoding(true);
      
      const decoded = fileProcessingService.decodeData(base64Input.trim());
      setDecodedData(decoded);
      
      toast({
        title: "Decode successful",
        description: `${decoded.files.length} files decoded successfully`,
      });
    } catch (error) {
      toast({
        title: "Decoding failed",
        description: error instanceof Error ? error.message : "Invalid base64 data",
        variant: "destructive",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopyEncoded = async () => {
    if (!encodedBase64) return;
    
    try {
      await copyToClipboard(encodedBase64);
      toast({
        title: "Copied to clipboard",
        description: "Base64 encoded data copied successfully",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // SOLID Principles: Single Responsibility - Download operations
  const handleDownloadSingle = (file: FileData) => {
    downloadService.downloadSingle(file);
    // Clear all data after download - no need to keep anything
    setEncodedBase64('');
    setBase64Input('');
    setDecodedData(null);
    toast({
      title: "File downloaded",
      description: `${file.name} downloaded successfully`,
    });
  };

  const handleDownloadAll = () => {
    if (!decodedData?.files.length) return;
    
    const fileCount = decodedData.files.length;
    downloadService.downloadAll(decodedData.files);
    // Clear all data after download - complete reset
    setEncodedBase64('');
    setBase64Input('');
    setDecodedData(null);
    toast({
      title: "All files downloaded",
      description: `${fileCount} files downloaded successfully`,
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setEncodedBase64('');
    setBase64Input('');
    setDecodedData(null);
    setManualText('');
    setInputMode('file');
  };

  return (
    <div 
      className="min-h-screen relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <MatrixRain />
      
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-green-900/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-black/80 border-2 border-dashed border-green-400 rounded-lg p-8 text-center">
            <div className="text-green-400 text-2xl font-mono mb-2">
              📁 DROP FILES TO UPLOAD
            </div>
            <div className="text-green-500/70 font-mono">
              Release to add files for encoding
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto p-6 max-w-6xl relative z-10">
        <HeaderSection onReset={handleReset} />
        
        <MainContent
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          manualText={manualText}
          onManualTextChange={setManualText}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          encodedBase64={encodedBase64}
          onEncode={handleEncode}
          onCopyEncoded={handleCopyEncoded}
          isEncoding={isEncoding}
          uploadProgress={uploadProgress}
          currentFileName={currentFileName}
          base64Input={base64Input}
          onBase64InputChange={setBase64Input}
          decodedData={decodedData}
          onDecode={handleDecode}
          onDownloadSingle={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
          isDecoding={isDecoding}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}