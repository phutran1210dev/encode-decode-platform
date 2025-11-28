"use client"

import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { MatrixButton } from '@/components/atoms';
import { QrCode, Download, Copy, Smartphone, X, Timer, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/file-utils';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: string;
}

export function QRModal({ isOpen, onClose, data }: QRModalProps) {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer cleanup function
  const cleanupTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Start 60s timer
  const startTimer = () => {
    cleanupTimers();
    setTimeLeft(60);
    setIsExpired(false);

    // Countdown interval
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto expire after 60s
    timerRef.current = setTimeout(() => {
      setIsExpired(true);
      cleanupTimers();
    }, 60000);
  };

  // Auto-reload when expired
  const handleReload = async () => {
    await generateQR();
  };

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
      cleanupTimers();
      
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const result = await response.json();
      setQrCode(result.qrCode);
      setQrUrl(result.url);
      startTimer(); // Start 60s countdown
      
      toast({
        title: "QR Code generated",
        description: "Valid for 60 seconds"
      });
      
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
  
  // Auto-generate QR when modal opens
  React.useEffect(() => {
    if (isOpen && data && !qrCode) {
      generateQR();
    }
    return () => {
      cleanupTimers();
    };
  }, [isOpen, data]);

  // Cleanup on modal close
  React.useEffect(() => {
    if (!isOpen) {
      cleanupTimers();
      setQrCode('');
      setQrUrl('');
      setTimeLeft(0);
      setIsExpired(false);
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-green-500/30 text-green-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-400 font-mono flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR CODE GENERATOR
          </DialogTitle>
          <DialogDescription className="text-green-500/70 font-mono text-center">
            [MOBILE QUICK ACCESS]
          </DialogDescription>
          
          {/* Timer Display */}
          {qrCode && !isExpired && (
            <div className="flex items-center justify-center gap-2 text-sm font-mono pt-2">
              <Timer className="h-4 w-4" />
              <span className={`${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                {timeLeft}s remaining
              </span>
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-green-400 font-mono text-sm">GENERATING QR CODE...</p>
              </div>
            </div>
          ) : qrCode && !isExpired ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <Image
                    src={qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-mono">
                  <Smartphone className="h-4 w-4" />
                  SCAN TO AUTO-FILL DECODE
                </div>
                
                <div className="flex gap-2 justify-center">
                  <MatrixButton
                    variant="outline"
                    size="sm"
                    onClick={downloadQR}
                    icon={Download}
                  >
                    DOWNLOAD
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
              </div>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-red-400 text-center">
                <Timer className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-lg mb-2">QR CODE EXPIRED</p>
                <p className="text-sm text-red-400/70">Security timeout after 60 seconds</p>
              </div>
              <MatrixButton
                onClick={handleReload}
                disabled={isGenerating}
                icon={RotateCcw}
                className="px-6"
              >
                GENERATE NEW QR
              </MatrixButton>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-green-500/70 font-mono text-sm mb-4">Ready to generate QR code</p>
              <MatrixButton
                onClick={generateQR}
                disabled={!data.trim()}
                icon={QrCode}
              >
                GENERATE QR
              </MatrixButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}