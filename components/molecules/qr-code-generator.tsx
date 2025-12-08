"use client"

import React, { useState } from 'react';
import { MatrixButton } from '@/components/atoms';
import { QrCode, Download, Copy, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/file-utils';

interface QRCodeGeneratorProps {
  data: string;
  disabled?: boolean;
}

export function QRCodeGenerator({ data, disabled = false }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateQR = async () => {
    if (!data.trim()) {
      toast({
        title: "No data to encode",
        description: "Please encode some data first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Check if data is already uploaded to cloud storage
      const isSupabase = data.startsWith('SUPABASE:');
      const isBlob = data.startsWith('BLOB:');
      const isFile = data.startsWith('FILE:');
      const isDB = data.startsWith('DB:');
      
      // For all prefixed data (DB:, FILE:, SUPABASE:, BLOB:), let API handle it
      if (isDB || isFile || isSupabase || isBlob) {
        console.log(`Generating QR for prefixed data: ${data.substring(0, 50)}...`);
        
        const response = await fetch('/api/qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data: data
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate QR code');
        }
        
        setQrCode(result.qrCode);
        setQrUrl(result.url);
        
        const typeLabels: Record<string, string> = {
          'DB:': 'Cloud Database',
          'FILE:': 'Direct Download', 
          'SUPABASE:': 'Cloud Storage',
          'BLOB:': 'Cloud Storage'
        };
        
        const prefix = Object.keys(typeLabels).find(p => data.startsWith(p)) || 'Cloud';
        
        toast({
          title: `✅ QR Code generated (${typeLabels[prefix]})`,
          description: `Scan QR from any device. Valid for 24 hours.`,
          duration: 6000
        });
        
        return;
      }
      

      
      const QR_SIZE_LIMIT = 7000;
      
      // For large data, save to database and use DB:id reference
      if (data.length > QR_SIZE_LIMIT) {
        console.log(`Data too large (${data.length} chars), saving to database...`);
        
        try {
          toast({
            title: "⏳ Saving to cloud...",
            description: `Saving ${(data.length / 1024 / 1024).toFixed(2)}MB to database`,
          });
          
          // Save to database
          const saveResponse = await fetch('/api/save-encoded', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: data,
              fileCount: 1,
              totalSize: data.length
            })
          });
          
          if (!saveResponse.ok) {
            throw new Error('Failed to save data to database');
          }
          
          const saveResult = await saveResponse.json();
          console.log(`Saved to database with ID: ${saveResult.id}`);
          
          // Generate QR code with DB:id reference
          const dbReference = `DB:${saveResult.id}`;
          const response = await fetch('/api/qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: dbReference,
              baseUrl: window.location.origin
            })
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Failed to generate QR code');
          }
          
          setQrCode(result.qrCode);
          setQrUrl(result.url);
          
          toast({
            title: "✅ QR Code generated (Cloud Storage)",
            description: `File uploaded to cloud. Scan QR from any device.`,
            duration: 6000
          });
          
          return;
        } catch (uploadError) {
          console.error('Blob upload failed:', uploadError);
          throw new Error('Failed to upload large file to cloud storage');
        }
      }
      
      // For small data, send directly
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data,
          baseUrl: window.location.origin
        })
      });
      
      const result = await response.json();
      
      // Check if file is too large for QR (fallback mode)
      if (!response.ok || result.error === 'FILE_TOO_LARGE_FOR_QR') {
        setQrCode('');
        setQrUrl('');
        
        toast({
          title: "📦 File too large for QR code",
          description: `${(result.fileSize / 1024).toFixed(1)}KB exceeds ${(result.maxQRSize / 1024).toFixed(1)}KB limit. Use "Download All Files" button below instead.`,
          variant: "destructive",
          duration: 10000
        });
        return;
      }
      
      setQrCode(result.qrCode);
      setQrUrl(result.url);
      
      // Show appropriate message based on storage mode
      if (result.mode === 'blob-storage') {
        toast({
          title: "✅ QR Code generated (Cloud Storage)",
          description: `File uploaded to cloud. Scan QR from any device. Expires in 1 hour.`,
          duration: 6000
        });
      } else {
        toast({
          title: "✅ QR Code generated",
          description: "Scan with any device to transfer data"
        });
      }
      
    } catch (error) {
      toast({
        title: "Error generating QR code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code downloaded",
      description: "Image saved to your device"
    });
  };
  
  const copyUrl = async () => {
    if (!qrUrl) return;
    
    try {
      await copyToClipboard(qrUrl);
      toast({
        title: "URL copied",
        description: "Share this link to auto-fill decode"
      });
    } catch (error) {
      toast({
        title: "Failed to copy URL",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <MatrixButton
          onClick={generateQR}
          disabled={disabled || isGenerating || !data.trim()}
          icon={QrCode}
          className="flex-1"
        >
          {isGenerating ? 'GENERATING...' : 'GENERATE QR'}
        </MatrixButton>
      </div>
      
      {qrCode && (
        <div className="space-y-3">
          <div className="bg-black/30 border border-green-500/30 rounded-lg p-4">
            <div className="flex justify-center mb-3">
              <Image
                src={qrCode}
                alt="QR Code"
                width={250}
                height={250}
                className="rounded border border-green-500/20"
              />
            </div>
            
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-mono">
                <Smartphone className="h-4 w-4" />
                SCAN TO AUTO-FILL DECODE
              </div>
              
              {/* Warning for large files */}
              {data.length > 7000 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs font-mono text-yellow-400">
                  ⚠️ Large file: QR works on this device only
                </div>
              )}
              
              <div className="flex gap-2 justify-center flex-wrap">
                <MatrixButton
                  variant="outline"
                  size="sm"
                  onClick={downloadQR}
                  icon={Download}
                >
                  DOWNLOAD QR
                </MatrixButton>
                
                <MatrixButton
                  variant="outline"
                  size="sm"
                  onClick={copyUrl}
                  icon={Copy}
                >
                  COPY LINK
                </MatrixButton>
              </div>
              
              {/* Alternate method for large files */}
              {data.length > 7000 && (
                <div className="text-xs font-mono text-green-400/60 pt-2 border-t border-green-500/20">
                  💡 Tip: Use &quot;Download All Files&quot; below to transfer to another device
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}