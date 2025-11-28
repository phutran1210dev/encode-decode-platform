"use client"

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  /** Maximum character limit */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Error state */
  error?: boolean;
  /** Validation function */
  validate?: (value: string) => string | null;
}

export function CodeEditor({ 
  value, 
  onChange, 
  placeholder = "[ENTER YOUR CODE HERE...]", 
  disabled = false,
  className,
  rows = 20,
  maxLength,
  showCharCount = false,
  error = false,
  validate
}: CodeEditorProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null);
  
  const handleChange = React.useCallback((newValue: string) => {
    // Apply max length if specified
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    // Validate input if validator provided
    if (validate) {
      const errorMessage = validate(newValue);
      setValidationError(errorMessage);
    }
    
    onChange(newValue);
  }, [onChange, maxLength, validate]);
  
  const hasError = error || validationError !== null;
  
  return (
    <div className="space-y-2">
      <Textarea 
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        error={hasError}
        className={cn(
          "code-editor preserve-formatting text-sm bg-black/50 border-green-500/30 text-green-300 placeholder:text-green-600/50 resize-none font-mono",
          className
        )}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      
      {/* Character count and validation feedback */}
      <div className="flex justify-between text-xs">
        {validationError && (
          <span className="text-red-400 font-mono">⚠ {validationError}</span>
        )}
        {showCharCount && maxLength && (
          <span className={cn(
            "font-mono ml-auto",
            value.length > maxLength * 0.8 ? "text-yellow-400" : "text-green-500/60",
            value.length >= maxLength ? "text-red-400" : ""
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}