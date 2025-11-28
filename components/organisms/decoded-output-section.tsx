"use client"

import React, { useMemo } from 'react';
import { MatrixCard, MatrixButton } from '@/components/atoms';
import { Download, FileText, Info, Terminal, Eye } from 'lucide-react';
import { FileData, EncodedData } from '@/types';
import { formatFileSize, formatTimestamp } from '@/lib/file-utils';
import { createImageService, type IImageService } from '@/lib/services';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DecodedOutputSectionProps {
  decodedData: EncodedData | null;
  onDownloadSingle: (file: FileData) => void;
  onDownloadAll: () => void;
}

export function DecodedOutputSection({ 
  decodedData, 
  onDownloadSingle, 
  onDownloadAll 
}: DecodedOutputSectionProps) {
  // SOLID Principles: Dependency Injection
  const imageService = useMemo<IImageService>(() => createImageService(), []);


  return (
    <MatrixCard 
      title="DECRYPTED ASSETS"
      description="[EXTRACTED FILES READY FOR DOWNLOAD]"
      icon={Download}
    >
      {decodedData ? (
        <>
          <div className="text-sm text-green-500/70 space-y-1 font-mono">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assets: {decodedData.metadata.totalFiles}
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Size: {formatFileSize(decodedData.metadata.totalSize)}
            </div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Timestamp: {formatTimestamp(decodedData.timestamp)}
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto border border-green-500/30 rounded-md p-2 space-y-2 bg-black/30 scanlines">
            {decodedData.files.map((file, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center text-sm p-2 hover:bg-green-500/10 rounded-sm"
              >
                <div className="flex-1 mr-2 text-green-300 font-mono">
                  <div className="truncate font-medium glow-text">{file.name}</div>
                  <div className="text-green-500/70">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <div className="flex gap-1">
                  {imageService.isImageFile(file) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <MatrixButton
                          size="sm"
                          variant="outline"
                          icon={Eye}
                        />
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-black/95 border-green-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-green-400 font-mono">
                            {file.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          {file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg') ? (
                            <div 
                              className="max-w-full max-h-[70vh] border border-green-500/30 rounded-md overflow-auto bg-white"
                              dangerouslySetInnerHTML={{ 
                                __html: file.isBinary && file.content.startsWith('data:') 
                                  ? atob(file.content.split(',')[1]) 
                                  : file.content 
                              }}
                            />
                          ) : (
                            <img 
                              src={file.isBinary && file.content.startsWith('data:') ? file.content : `data:${file.type};base64,${btoa(file.content)}`}
                              alt={file.name}
                              className="max-w-full max-h-[70vh] object-contain border border-green-500/30 rounded-md"
                              style={{ backgroundColor: 'transparent' }}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <MatrixButton
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadSingle(file)}
                    icon={Download}
                  />
                </div>
              </div>
            ))}
          </div>

          <MatrixButton 
            onClick={onDownloadAll}
            icon={Download}
            className="w-full"
          >
            EXTRACT ALL ASSETS
          </MatrixButton>
        </>
      ) : (
        <div className="text-center text-green-600/50 py-12 font-mono">
          <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>[NO DECRYPTED DATA AVAILABLE]</p>
          <p className="text-sm">PASTE PAYLOAD AND DECRYPT TO VIEW ASSETS</p>
        </div>
      )}
    </MatrixCard>
  );
}