"use client"

import React from 'react';
import { MatrixButton, MatrixLabel } from '@/components/atoms';
import { FileText, Folder } from 'lucide-react';

interface FileUploadButtonsProps {
  onFileClick: () => void;
  onFolderClick: () => void;
  disabled?: boolean;
}

export function FileUploadButtons({ 
  onFileClick, 
  onFolderClick, 
  disabled = false 
}: FileUploadButtonsProps) {
  return (
    <div className="space-y-2">
      <MatrixLabel>TARGET SELECTION</MatrixLabel>
      <div className="flex gap-2">
        <MatrixButton 
          variant="outline" 
          onClick={onFileClick}
          disabled={disabled}
          icon={FileText}
          className="flex-1"
        >
          LOAD FILES
        </MatrixButton>
        <MatrixButton 
          variant="outline" 
          onClick={onFolderClick}
          disabled={disabled}
          icon={Folder}
          className="flex-1"
        >
          LOAD DIRECTORY
        </MatrixButton>
      </div>
    </div>
  );
}