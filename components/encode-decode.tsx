"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import MatrixRain from '@/components/matrix-effects';
import { HeaderSection, MainContent } from '@/components/templates';
import { StealthControl } from '@/components/molecules';
import { copyToClipboard } from '@/lib/file-utils';
import { FileData, EncodedData } from '@/types';
// SOLID Principles: Dependency Injection
import {
  createFileProcessingService,
  createDownloadService,
  createImageService,
  createEncryptionService,
  type IFileProcessingService,
  type IDownloadService,
  type IImageService,
  type IEncryptionService
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
  const encryptionService = useMemo<IEncryptionService>(() => createEncryptionService(), []);
  
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
  
  // Password states for encryption
  const [encodePassword, setEncodePassword] = useState<string>('');
  const [decodePassword, setDecodePassword] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  
  // Security states
  const [failedPasswordAttempts, setFailedPasswordAttempts] = useState<number>(0);
  const [isStreamLocked, setIsStreamLocked] = useState<boolean>(false);
  const [hasSuccessfulDecrypt, setHasSuccessfulDecrypt] = useState<boolean>(false);
  
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
  
  // Reset security state when new encrypted data is provided
  useEffect(() => {
    if (base64Input.trim()) {
      // Reset security counters when new encrypted stream is pasted
      setFailedPasswordAttempts(0);
      setIsStreamLocked(false);
      setHasSuccessfulDecrypt(false);
    }
  }, [base64Input]);
  
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
    // Validate password first
    if (!encodePassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password for encryption",
        variant: "destructive",
      });
      return;
    }
    
    if (!encryptionService.validatePassword(encodePassword)) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEncrypting(true);
      
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
      
      // First encode files to structured data
      const encodedFiles = fileProcessingService.encodeFiles(filesToEncode);
      const structuredData = fileProcessingService.decodeData(encodedFiles);
      
      // Then encrypt with AES using password
      const encrypted = await encryptionService.encrypt(structuredData, encodePassword);
      setEncodedBase64(encrypted);
      
      toast({
        title: "🔐 Encryption successful",
        description: `${filesToEncode.length} file(s) encrypted with AES-256`,
      });
    } catch (error) {
      toast({
        title: "Encryption failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecode = async () => {
    if (!base64Input.trim()) {
      toast({
        title: "No encrypted data",
        description: "Please paste encrypted data",
        variant: "destructive",
      });
      return;
    }
    
    if (isStreamLocked) {
      toast({
        title: "🔒 Stream Locked",
        description: "Encrypted stream has been locked due to too many failed attempts",
        variant: "destructive",
      });
      return;
    }
    
    if (!decodePassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter the password to decrypt",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDecoding(true);
      
      // Try AES decryption first
      const decoded = await encryptionService.decrypt(base64Input.trim(), decodePassword);
      
      // Success - reset failed attempts and mark successful decrypt
      setFailedPasswordAttempts(0);
      setHasSuccessfulDecrypt(true);
      setDecodedData(decoded);
      
      toast({
        title: "🔓 Decryption successful",
        description: `${decoded.files.length} files decrypted successfully`,
      });
    } catch (error) {
      // Failed attempt - increment counter
      const newAttempts = failedPasswordAttempts + 1;
      setFailedPasswordAttempts(newAttempts);
      
      // Hide decoded data if we previously had successful decrypt
      if (hasSuccessfulDecrypt) {
        setDecodedData(null);
        setHasSuccessfulDecrypt(false);
      }
      
      // Lock stream after 4 failed attempts
      if (newAttempts >= 4) {
        setIsStreamLocked(true);
        setBase64Input(''); // Clear encrypted stream
        setDecodePassword(''); // Clear password field
        
        toast({
          title: "🚨 Security Alert",
          description: "Stream locked and cleared due to multiple failed attempts",
          variant: "destructive",
        });
        return;
      }
      
      // If AES fails, try legacy base64 decode as fallback
      try {
        const decoded = fileProcessingService.decodeData(base64Input.trim());
        setDecodedData(decoded);
        setFailedPasswordAttempts(0); // Reset on successful legacy decode
        
        toast({
          title: "⚠️ Legacy decode successful",
          description: `${decoded.files.length} files decoded (unencrypted base64)`,
        });
      } catch (legacyError) {
        toast({
          title: `Decryption failed (${4 - newAttempts} attempts remaining)`,
          description: error instanceof Error ? error.message : "Invalid password or corrupted data",
          variant: "destructive",
        });
      }
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
    
    // Reset security states
    setFailedPasswordAttempts(0);
    setIsStreamLocked(false);
    setHasSuccessfulDecrypt(false);
    setEncodePassword('');
    setDecodePassword('');
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
          encodePassword={encodePassword}
          onEncodePasswordChange={setEncodePassword}
          isEncrypting={isEncrypting}
          base64Input={base64Input}
          onBase64InputChange={setBase64Input}
          decodedData={decodedData}
          onDecode={handleDecode}
          onDownloadSingle={handleDownloadSingle}
          onDownloadAll={handleDownloadAll}
          isDecoding={isDecoding}
          decodePassword={decodePassword}
          onDecodePasswordChange={setDecodePassword}
          isStreamLocked={isStreamLocked}
          onReset={handleReset}
        />
      </div>
      
      <StealthControl />
    </div>
  );
}