"use client"

import React from 'react';
import { MatrixLabel } from '@/components/atoms';
import { FileData } from '@/types';
import { formatFileSize } from '@/lib/file-utils';

interface FileListProps {
  files: FileData[];
}

export function FileList({ files }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <MatrixLabel>LOADED ASSETS ({files.length})</MatrixLabel>
      <div className="max-h-48 overflow-y-auto border border-green-500/30 rounded-md p-2 space-y-1 bg-black/30 scanlines">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center text-sm p-2 hover:bg-green-500/10 rounded-sm text-green-300 font-mono"
          >
            <span className="truncate mr-2 glow-text">{file.name}</span>
            <span className="text-green-500/70">
              {formatFileSize(file.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}