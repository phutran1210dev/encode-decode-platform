"use client"

import React from 'react';
import { MatrixCard, MatrixButton, MatrixLabel } from '@/components/atoms';
import { PasswordInput } from '@/components/molecules';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Unlock } from 'lucide-react';

interface DecodeInputSectionProps {
  base64Input: string;
  onInputChange: (value: string) => void;
  onDecode: () => void;
  isDecoding: boolean;
  password: string;
  onPasswordChange: (password: string) => void;
  isStreamLocked?: boolean;
}

export function DecodeInputSection({ 
  base64Input, 
  onInputChange, 
  onDecode, 
  isDecoding,
  password,
  onPasswordChange,
  isStreamLocked = false
}: DecodeInputSectionProps) {
  return (
    <MatrixCard 
      title="PAYLOAD INPUT"
      description="[PASTE ENCRYPTED DATA FOR DECRYPTION]"
      icon={Terminal}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <MatrixLabel>ENCRYPTED STREAM {isStreamLocked && <span className="text-red-500">[LOCKED]</span>}</MatrixLabel>
          <Textarea 
            value={base64Input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={isStreamLocked ? "[STREAM LOCKED DUE TO FAILED ATTEMPTS]" : "[PASTE BASE64 PAYLOAD HERE...]"}
            className="min-h-[200px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
            disabled={isStreamLocked}
          />
        </div>

        <PasswordInput
          value={password}
          onChange={onPasswordChange}
          label="DECRYPTION PASSWORD"
          placeholder={isStreamLocked ? "[LOCKED]" : "[ENTER PASSWORD TO DECRYPT...]"}
          required
          disabled={isDecoding || isStreamLocked}
        />

        <MatrixButton 
          onClick={onDecode}
          disabled={isDecoding || !base64Input.trim() || !password.trim() || isStreamLocked}
          icon={Unlock}
          className="w-full"
        >
          {isStreamLocked ? '🔒 STREAM LOCKED' : 'DECRYPT DATA'}
        </MatrixButton>
      </div>
    </MatrixCard>
  );
}