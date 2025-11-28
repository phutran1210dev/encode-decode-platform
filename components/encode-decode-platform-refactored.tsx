"use client"

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import MatrixRain from '@/components/matrix-effects';
import { HeaderSection, MainContent } from '@/components/templates';
import {
  processFiles,
  encodeToBase64,
  decodeFromBase64,
  downloadFile,
  downloadAllFiles,
  copyToClipboard,
} from '@/lib/file-utils';
import { FileData, EncodedData } from '@/types';

interface EncodeDecodeProps {
  autoFillData?: string;
}

export default function EncodeDecode({ autoFillData }: EncodeDecodeProps = {}) {
  const { toast } = useToast();
  
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
      
      const processedFiles = await processFiles(files, (progress, fileName) => {
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

  const handleEncode = () => {
    if (inputMode === 'file') {
      if (selectedFiles.length === 0) {
        toast({
          title: "No files selected",
          description: "Please select files to encode",
          variant: "destructive",
        });
        return;
      }

      try {
        const encoded = encodeToBase64(selectedFiles);
        setEncodedBase64(encoded);
        
        toast({
          title: "Files encoded successfully",
          description: `${selectedFiles.length} files encoded to base64`,
        });
      } catch (error) {
        toast({
          title: "Encoding failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    } else {
      if (!manualText.trim()) {
        toast({
          title: "No text provided",
          description: "Please enter text to encode",
          variant: "destructive",
        });
        return;
      }

      try {
        const manualFile: FileData = {
          name: "manual-input.txt",
          content: manualText,
          size: new Blob([manualText]).size,
          type: "text/plain",
          lastModified: Date.now(),
        };
        
        const encoded = encodeToBase64([manualFile]);
        setEncodedBase64(encoded);
        
        toast({
          title: "Text encoded successfully",
          description: "Manual text encoded to base64",
        });
      } catch (error) {
        toast({
          title: "Encoding failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  };

  const handleDecode = () => {
    if (!base64Input.trim()) {
      toast({
        title: "No base64 data",
        description: "Please paste base64 encoded data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecoding(true);
      const decoded = decodeFromBase64(base64Input.trim());
      setDecodedData(decoded);
      
      toast({
        title: "Data decoded successfully",
        description: `${decoded.files.length} files decoded from base64`,
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

  const handleDownloadSingle = (file: FileData) => {
    downloadFile(file.content, file.name, file.isBinary);
    toast({
      title: "File downloaded",
      description: `${file.name} downloaded successfully`,
    });
  };

  const handleDownloadAll = () => {
    if (!decodedData?.files.length) return;
    
    downloadAllFiles(decodedData.files);
    toast({
      title: "All files downloaded",
      description: `${decodedData.files.length} files downloaded successfully`,
    });
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
    <div className="min-h-screen relative">
      <MatrixRain />
      
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