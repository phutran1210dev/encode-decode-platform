"use client"

import React, { useRef } from 'react';
import { MatrixCard, MatrixButton, MatrixProgress } from '@/components/atoms';
import { 
  InputModeSelector, 
  FileUploadButtons, 
  FileList, 
  ManualTextInput 
} from '@/components/molecules';
import { Upload, Shield, RotateCcw } from 'lucide-react';
import { FileData } from '@/types';

interface DataInputSectionProps {
  inputMode: 'manual' | 'file';
  onInputModeChange: (mode: 'manual' | 'file') => void;
  manualText: string;
  onManualTextChange: (text: string) => void;
  selectedFiles: FileData[];
  onFileSelect: (files: FileList | null) => void;
  onEncode: () => void;
  onReset: () => void;
  isEncoding: boolean;
  uploadProgress?: number;
  currentFileName?: string;
}

export function DataInputSection({
  inputMode,
  onInputModeChange,
  manualText,
  onManualTextChange,
  selectedFiles,
  onFileSelect,
  onEncode,
  onReset,
  isEncoding,
  uploadProgress,
  currentFileName
}: DataInputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => fileInputRef.current?.click();
  const handleFolderClick = () => folderInputRef.current?.click();

  return (
    <MatrixCard 
      title="DATA INJECTION"
      description="[LOAD TARGET DATA FOR ENCRYPTION]"
      icon={Upload}
    >
      <InputModeSelector 
        value={inputMode}
        onChange={onInputModeChange}
      />

      {inputMode === 'manual' && (
        <ManualTextInput
          value={manualText}
          onChange={onManualTextChange}
          onEncode={onEncode}
          onClear={() => onManualTextChange('')}
          disabled={isEncoding}
        />
      )}

      {inputMode === 'file' && (
        <>
          <FileUploadButtons
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
            disabled={isEncoding}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error - webkitdirectory is not in the standard but widely supported
            webkitdirectory=""
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files)}
          />

          <FileList files={selectedFiles} />
          
          {selectedFiles.length > 0 && (
            <div className="flex gap-2">
              <MatrixButton 
                onClick={onEncode}
                disabled={isEncoding}
                icon={Shield}
                className="flex-1"
              >
                ENCRYPT DATA
              </MatrixButton>
              <MatrixButton 
                variant="outline" 
                onClick={onReset}
                size="icon"
                icon={RotateCcw}
              >
              </MatrixButton>
            </div>
          )}
        </>
      )}
    </MatrixCard>
  );
}