"use client"

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MatrixRain, { TypingText, GlitchText } from '@/components/matrix-effects';
import { EncodedOutputSection } from '@/components/organisms';

import { 
  Upload, 
  Download, 
  Copy, 
  FileText, 
  Folder,
  RotateCcw,
  Info,
  Shield,
  Lock,
  Unlock,
  Terminal,
  Edit
} from 'lucide-react';
import {
  processFiles,
  encodeToBase64,
  decodeFromBase64,
  downloadFile,
  downloadAllFiles,
  copyToClipboard,
  formatFileSize,
  formatTimestamp,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE
} from '@/lib/file-utils';
import { FileData, EncodedData } from '@/types';

interface EncodeDecodeProps {
  initialDecodeData?: string;
}

export default function EncodeDecode({ initialDecodeData }: EncodeDecodeProps = {}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Encoder state
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [encodedBase64, setEncodedBase64] = useState<string>('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'file'>('file');
  const [manualText, setManualText] = useState<string>('');
  
  // Decoder state
  const [base64Input, setBase64Input] = useState<string>(initialDecodeData || '');
  const [decodedData, setDecodedData] = useState<EncodedData | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialDecodeData ? 'decode' : 'encode');
  
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    try {
      setIsEncoding(true);
      const processedFiles = await processFiles(files);
      setSelectedFiles(processedFiles);
      
      toast({
        title: "Files loaded successfully",
        description: `${processedFiles.length} files ready for encoding`,
      });
    } catch (error) {
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
    downloadFile(file.content, file.name);
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

  // Auto-decode when initialDecodeData is provided
  React.useEffect(() => {
    if (initialDecodeData && !decodedData) {
      handleDecode();
    }
  }, [initialDecodeData]);

  const handleReset = () => {
    setSelectedFiles([]);
    setEncodedBase64('');
    setBase64Input('');
    setDecodedData(null);
    setManualText('');
    setInputMode('file');
    setActiveTab('encode');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen relative">
      {/* Matrix Rain Background */}
      <MatrixRain />
      
      <div className="container mx-auto p-6 max-w-6xl relative z-10">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Terminal className="h-8 w-8 text-green-500" />
            <h1 className="text-4xl font-bold font-mono glow-text">
              <GlitchText text="ENDCODE CODE VAULT" />
            </h1>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-green-400 text-lg font-mono">
            <TypingText 
              text="[SECURE FILE ENCODING/DECODING SYSTEM]"
              delay={1000}
              speed={100}
            />
          </div>
          <div className="mt-2 text-green-500/70 text-sm font-mono">
            <TypingText 
              text=":: Penetration Testing File Transfer Protocol ::"
              delay={3000}
              speed={80}
            />
          </div>
        </div>

        <div className="mb-6">
          <Card className="hacker-terminal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                <Info className="h-5 w-5" />
                <GlitchText text="SYSTEM PARAMETERS" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-500/70 font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Max file size: {formatFileSize(MAX_FILE_SIZE)}
                </div>
                <div className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Max total size: {formatFileSize(MAX_TOTAL_SIZE)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              {/* File Upload Section */}
              <Card className="hacker-terminal pulse-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400 font-mono glow-text">
                    <Upload className="h-5 w-5" />
                    <GlitchText text="DATA INJECTION" />
                  </CardTitle>
                  <CardDescription className="text-green-500/70 font-mono">
                    [LOAD TARGET DATA FOR ENCRYPTION]
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                {/* Input Mode Selection */}
                <div className="space-y-2">
                  <Label className="text-green-400 font-mono">INPUT MODE</Label>
                  <Tabs value={inputMode} onValueChange={(value: string) => setInputMode(value as 'manual' | 'file')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-green-500/30">
                      <TabsTrigger 
                        value="manual" 
                        className="font-mono text-green-400 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        MANUAL TEXT
                      </TabsTrigger>
                      <TabsTrigger 
                        value="file"
                        className="font-mono text-green-400 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        FILE UPLOAD
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Manual Text Input */}
                {inputMode === 'manual' && (
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">CODE EDITOR</Label>
                    <Textarea 
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="[ENTER YOUR CODE HERE...]\n// Supports all programming languages\n// Preserves exact formatting, spacing, and indentation\n// Perfect for code snippets, configurations, etc.\n// Tab indentation supported\n\nfunction example() {\n    console.log('Hello, World!');\n    return true;\n}"
                      className="min-h-[400px] code-editor preserve-formatting text-sm bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50 resize-none"
                      spellCheck={false}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleEncode}
                        disabled={isEncoding || !manualText.trim()}
                        className="flex-1 matrix-button font-mono text-black"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        ENCRYPT TEXT
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setManualText('')}
                        size="icon"
                        className="matrix-button"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                {inputMode === 'file' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-green-400 font-mono">TARGET SELECTION</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 matrix-button font-mono"
                          disabled={isEncoding}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          LOAD FILES
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => folderInputRef.current?.click()}
                          className="flex-1 matrix-button font-mono"
                          disabled={isEncoding}
                        >
                          <Folder className="h-4 w-4 mr-2" />
                          LOAD DIRECTORY
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                      <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        // @ts-expect-error - webkitdirectory is not in the standard but widely supported
                        webkitdirectory=""
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-green-400 font-mono">LOADED ASSETS ({selectedFiles.length})</Label>
                        <div className="max-h-48 overflow-y-auto border border-green-500/30 rounded-md p-2 space-y-1 bg-black/30 scanlines">
                          {selectedFiles.map((file, index) => (
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
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleEncode}
                            disabled={isEncoding}
                            className="flex-1 matrix-button font-mono text-black"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            ENCRYPT DATA
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleReset}
                            size="icon"
                            className="matrix-button"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

              {/* Encoded Output Section */}
              <EncodedOutputSection 
                encodedData={encodedBase64}
                onCopy={handleCopyEncoded}
              />
            </div>
          </TabsContent>

          <TabsContent value="decode">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Base64 Input Section */}
              <Card className="hacker-terminal pulse-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400 font-mono glow-text">
                    <Terminal className="h-5 w-5" />
                    <GlitchText text="PAYLOAD INPUT" />
                  </CardTitle>
                  <CardDescription className="text-green-500/70 font-mono">
                    [PASTE ENCRYPTED DATA FOR DECRYPTION]
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-green-400 font-mono">ENCRYPTED STREAM</Label>
                    <Textarea 
                      value={base64Input}
                      onChange={(e) => setBase64Input(e.target.value)}
                      placeholder="[PASTE BASE64 PAYLOAD HERE...]"
                      className="min-h-[300px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
                    />
                    <Button 
                      onClick={handleDecode}
                      disabled={isDecoding || !base64Input.trim()}
                      className="w-full matrix-button font-mono text-black"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      DECRYPT DATA
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Decoded Files Section */}
              <Card className="hacker-terminal pulse-effect">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400 font-mono glow-text">
                    <Download className="h-5 w-5" />
                    <GlitchText text="DECRYPTED ASSETS" />
                  </CardTitle>
                  <CardDescription className="text-green-500/70 font-mono">
                    [EXTRACTED FILES READY FOR DOWNLOAD]
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadSingle(file)}
                              className="matrix-button"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button 
                        onClick={handleDownloadAll}
                        className="w-full matrix-button font-mono text-black"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        EXTRACT ALL ASSETS
                      </Button>
                    </>
                  ) : (
                    <div className="text-center text-green-600/50 py-12 font-mono">
                      <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>[NO DECRYPTED DATA AVAILABLE]</p>
                      <p className="text-sm">PASTE PAYLOAD AND DECRYPT TO VIEW ASSETS</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="matrix-button font-mono"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            SYSTEM RESET
          </Button>
        </div>
      </div>
    </div>
  );
}