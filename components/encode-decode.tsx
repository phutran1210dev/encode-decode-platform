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
      
      // Encode files to base64
      const encoded = fileProcessingService.encodeFiles(filesToEncode);
      setEncodedBase64(encoded);
      
      toast({
        title: "Encoding successful",
        description: `${filesToEncode.length} file(s) encoded to base64`,
      });
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