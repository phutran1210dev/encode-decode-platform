"use client"

import React from 'react';
import { CodeEditor, MatrixButton, MatrixLabel } from '@/components/atoms';
import { Shield, RotateCcw } from 'lucide-react';

interface ManualTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onEncode: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ManualTextInput({ 
  value, 
  onChange, 
  onEncode, 
  onClear, 
  disabled = false 
}: ManualTextInputProps) {
  return (
    <div className="space-y-2">
      <MatrixLabel>CODE EDITOR</MatrixLabel>
      <CodeEditor
        value={value}
        onChange={onChange}
        placeholder="[ENTER YOUR CODE HERE...]\n// Supports all programming languages\n// Preserves exact formatting, spacing, and indentation\n// Perfect for code snippets, configurations, etc.\n// Tab indentation supported\n\nfunction example() {\n    console.log('Hello, World!');\n    return true;\n}"
        className="min-h-[400px]"
      />
      <div className="flex gap-2">
        <MatrixButton 
          onClick={onEncode}
          disabled={disabled || !value.trim()}
          icon={Shield}
          className="flex-1"
        >
          ENCRYPT TEXT
        </MatrixButton>
        <MatrixButton 
          variant="outline" 
          onClick={onClear}
          size="icon"
          icon={RotateCcw}
        />
      </div>
    </div>
  );
}