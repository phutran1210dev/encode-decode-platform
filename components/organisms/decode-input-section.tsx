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
}

export function DecodeInputSection({ 
  base64Input, 
  onInputChange, 
  onDecode, 
  isDecoding,
  password,
  onPasswordChange
}: DecodeInputSectionProps) {
  return (
    <MatrixCard 
      title="PAYLOAD INPUT"
      description="[PASTE ENCRYPTED DATA FOR DECRYPTION]"
      icon={Terminal}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <MatrixLabel>ENCRYPTED STREAM</MatrixLabel>
          <Textarea 
            value={base64Input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="[PASTE BASE64 PAYLOAD HERE...]"
            className="min-h-[200px] font-mono text-xs bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50"
          />
        </div>

        <PasswordInput
          value={password}
          onChange={onPasswordChange}
          label="DECRYPTION PASSWORD"
          placeholder="[ENTER PASSWORD TO DECRYPT...]"
          required
          disabled={isDecoding}
        />

        <MatrixButton 
          onClick={onDecode}
          disabled={isDecoding || !base64Input.trim() || !password.trim()}
          icon={Unlock}
          className="w-full"
        >
          DECRYPT DATA
        </MatrixButton>
      </div>
    </MatrixCard>
  );
}