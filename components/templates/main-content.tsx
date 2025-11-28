"use client"

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock } from 'lucide-react';
import { 
  DataInputSection, 
  EncodedOutputSection, 
  DecodeInputSection, 
  DecodedOutputSection 
} from '@/components/organisms';
import { FileData, EncodedData } from '@/types';

// SOLID Principles: Single Responsibility
// Each interface has a single purpose
interface EncodeProps {
  inputMode: 'manual' | 'file';
  onInputModeChange: (mode: 'manual' | 'file') => void;
  manualText: string;
  onManualTextChange: (text: string) => void;
  selectedFiles: FileData[];
  onFileSelect: (files: FileList | null) => void;
  encodedBase64: string;
  onEncode: () => void;
  onCopyEncoded: () => void;
  isEncoding: boolean;
  uploadProgress?: number;
  currentFileName?: string;
}

interface DecodeProps {
  base64Input: string;
  onBase64InputChange: (value: string) => void;
  decodedData: EncodedData | null;
  onDecode: () => void;
  onDownloadSingle: (file: FileData) => void;
  onDownloadAll: () => void;
  isDecoding: boolean;
}

interface CommonProps {
  onReset: () => void;
}

// Interface Segregation: MainContentProps combines only what's needed
interface MainContentProps extends EncodeProps, DecodeProps, CommonProps {}

export function MainContent({
  inputMode,
  onInputModeChange,
  manualText,
  onManualTextChange,
  selectedFiles,
  onFileSelect,
  encodedBase64,
  onEncode,
  onCopyEncoded,
  isEncoding,
  uploadProgress,
  currentFileName,
  base64Input,
  onBase64InputChange,
  decodedData,
  onDecode,
  onDownloadSingle,
  onDownloadAll,
  isDecoding,
  onReset
}: MainContentProps) {
  return (
    <Tabs defaultValue="encode" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/50 border border-green-500/30">
        <TabsTrigger 
          value="encode" 
          className="font-mono text-green-400 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
        >
          <Lock className="h-4 w-4 mr-2" />
          ENCODE
        </TabsTrigger>
        <TabsTrigger 
          value="decode"
          className="font-mono text-green-400 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
        >
          <Unlock className="h-4 w-4 mr-2" />
          DECODE
        </TabsTrigger>
      </TabsList>

      <TabsContent value="encode">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataInputSection
              inputMode={inputMode}
              onInputModeChange={onInputModeChange}
              manualText={manualText}
              onManualTextChange={onManualTextChange}
              selectedFiles={selectedFiles}
              onFileSelect={onFileSelect}
              onEncode={onEncode}
              onReset={onReset}
              isEncoding={isEncoding}
              uploadProgress={uploadProgress}
              currentFileName={currentFileName}
            />          <EncodedOutputSection
            encodedData={encodedBase64}
            onCopy={onCopyEncoded}
          />
        </div>
      </TabsContent>

      <TabsContent value="decode">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DecodeInputSection
            base64Input={base64Input}
            onInputChange={onBase64InputChange}
            onDecode={onDecode}
            isDecoding={isDecoding}
          />
          
          <DecodedOutputSection
            decodedData={decodedData}
            onDownloadSingle={onDownloadSingle}
            onDownloadAll={onDownloadAll}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}