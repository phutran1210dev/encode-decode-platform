"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
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
  const [rawFiles, setRawFiles] = useState<FileList | null>(null); // Store original File objects
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
  
  // Tab state - auto switch to decode when autofill data exists
  const [activeTab, setActiveTab] = useState<string>(autoFillData ? 'decode' : 'encode');
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Auto-fill effect for QR code navigation
  useEffect(() => {
    if (autoFillData && autoFillData !== base64Input) {
      // Switch to decode tab
      setActiveTab('decode');
      
      // Fill the input
      setBase64Input(autoFillData);
      
      // Auto-decode if valid data
      const timer = setTimeout(() => {
        if (autoFillData.trim()) {
          handleDecode();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillData]);
  

  
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setIsEncoding(true);
      setUploadProgress(0);
      setCurrentFileName(undefined);
      
      // Store raw File objects for direct upload (especially for ZIP files)
      setRawFiles(files);
      
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
        // Use raw File object instead of base64 conversion (much faster!)
        const rawFile = rawFiles?.[0];
        
        if (!rawFile) {
          throw new Error('Original file not found. Please re-select the file.');
        }
        
        // Upload directly from client to Supabase Storage (no API route, no size limit!)
        const { supabase } = await import('@/lib/supabase');
        const fileName = `zips/${Date.now()}-${rawFile.name}`;
        
        toast({
          title: "⏳ Uploading ZIP...",
          description: `Uploading ${(rawFile.size / 1024 / 1024).toFixed(2)}MB directly to cloud storage`,
        });
        
        const { data, error } = await supabase.storage
          .from('encoded-files')
          .upload(fileName, rawFile, {
            contentType: 'application/zip',
            upsert: false
          });
        
        if (error) {
          console.error('Supabase storage error:', error);
          throw new Error(`Upload failed: ${error.message}`);
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('encoded-files')
          .getPublicUrl(data.path);
        
        // Store with FILE: prefix to indicate direct file download
        const fileUrl = `FILE:${publicUrl}:${rawFile.name}`;
        
        // CRITICAL FIX: Use flushSync to force immediate state update and re-render
        // This ensures the state is updated synchronously before continuing
        flushSync(() => {
          setEncodedBase64(fileUrl);
        });
        
        // Show success toast
        toast({
          title: "✅ ZIP uploaded successfully",
          description: `${rawFile.name} is ready for QR generation`,
          duration: 5000
        });
        
        // Return to exit ZIP handling - finally block will run
        return;
      }
      
      // Encode files to base64 (for non-ZIP files)
      const encoded = fileProcessingService.encodeFiles(filesToEncode);
      
      // Check if data is too large for Supabase (>2MB)
      const encodedSizeBytes = new Blob([encoded]).size;
      const maxSupabaseSize = 2 * 1024 * 1024; // 2MB limit for safe Supabase storage
      
      if (encodedSizeBytes > maxSupabaseSize) {
        // Use blob storage for large data
        console.log(`Data size (${(encodedSizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds Supabase limit, using blob storage`);
        
        try {
          const blobResponse = await fetch('/api/upload-blob-client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: encoded,
              fileName: `encoded-${Date.now()}.bin`,
            })
          });
          
          if (!blobResponse.ok) {
            throw new Error('Failed to upload to blob storage');
          }
          
          const blobResult = await blobResponse.json();
          
          // Store blob URL instead
          setEncodedBase64(`BLOB:${blobResult.url}`);
          
          toast({
            title: "✅ Encoding successful",
            description: `${filesToEncode.length} file(s) encoded (${(encodedSizeBytes / 1024 / 1024).toFixed(2)}MB). Ready to share via QR.`,
            duration: 5000
          });
        } catch (blobError) {
          throw new Error(`Failed to upload large data to blob storage: ${blobError instanceof Error ? blobError.message : 'Unknown error'}`);
        }
      } else {
        // Save to Supabase database for smaller data (prevents UI lag)
        try {
          const saveResponse = await fetch('/api/save-encoded', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: encoded,
              fileCount: filesToEncode.length,
              totalSize: encoded.length
            })
          });
          
          if (!saveResponse.ok) {
            throw new Error('Failed to save to database');
          }
          
          const saveResult = await saveResponse.json();
          
          // Store only the ID (lightweight, no UI lag!)
          setEncodedBase64(`DB:${saveResult.id}`);
          
          toast({
            title: "✅ Encoding successful",
            description: `${filesToEncode.length} file(s) encoded and saved. Ready to share via QR.`,
            duration: 5000
          });
        } catch (saveError) {
          console.error('Database save error:', saveError);
          
          // Fallback: Store locally if database fails
          setEncodedBase64(encoded);
          
          toast({
            title: "⚠️ Encoding successful (Local)",
            description: `Saved locally. Database unavailable.`,
            variant: "destructive",
            duration: 6000
          });
        }
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
      
      let dataTodecode = base64Input.trim();
      
      // Check if it's a blob storage URL reference
      if (dataTodecode.startsWith('BLOB:')) {
        const blobUrl = dataTodecode.replace('BLOB:', '');
        
        try {
          const blobResponse = await fetch(blobUrl);
          
          if (!blobResponse.ok) {
            throw new Error('Blob data not found or expired');
          }
          
          dataTodecode = await blobResponse.text();
          
          toast({
            title: "📥 Data retrieved from blob storage",
            description: `Large file loaded successfully`,
            duration: 3000
          });
          
          // Delete blob after loading (cleanup) - don't wait
          setTimeout(() => {
            fetch('/api/delete-blob', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: blobUrl })
            }).catch(err => console.error('Failed to delete blob:', err));
          }, 1000);
        } catch (blobError) {
          console.error('Blob fetch error:', blobError);
          throw new Error('Failed to retrieve data from blob storage. It may have expired.');
        }
      }
      // Check if it's a database ID reference
      else if (dataTodecode.startsWith('DB:')) {
        const id = dataTodecode.replace('DB:', '');
        
        try {
          const fetchResponse = await fetch(`/api/get-encoded/${id}`);
          
          if (!fetchResponse.ok) {
            throw new Error('Data not found or expired');
          }
          
          const fetchResult = await fetchResponse.json();
          dataTodecode = fetchResult.data;
          
          toast({
            title: "📥 Data retrieved from cloud",
            description: `${fetchResult.fileCount} file(s) loaded`,
            duration: 3000
          });
        } catch (fetchError) {
          console.error('Database fetch error:', fetchError);
          throw new Error('Failed to retrieve data from cloud. It may have expired.');
        }
      }
      
      const decoded = fileProcessingService.decodeData(dataTodecode);
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

  const handleDownloadAll = async () => {
    if (!decodedData?.files.length) return;
    
    const fileCount = decodedData.files.length;
    
    try {
      await downloadService.downloadAll(decodedData.files);
      
      // Clear all data after download - complete reset
      setEncodedBase64('');
      setBase64Input('');
      setDecodedData(null);
      
      toast({
        title: "All files downloaded",
        description: fileCount === 1 
          ? `${decodedData.files[0].name} downloaded successfully`
          : `${fileCount} files packaged as ZIP and downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download files",
        variant: "destructive",
      });
    }
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
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