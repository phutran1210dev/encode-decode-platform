"use client"

import React, { useState } from 'react';
import { MatrixLabel } from '@/components/atoms';
import { Eye, EyeOff, Key } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "[ENTER ENCRYPTION KEY...]",
  label = "ENCRYPTION KEY",
  disabled = false,
  required = false
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <MatrixLabel className="flex items-center gap-2">
        <Key className="w-3 h-3" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </MatrixLabel>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-green-500/30 bg-black/50 px-3 py-2 text-sm font-mono text-green-300 placeholder:text-green-600/50 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500/70 hover:text-green-400 transition-colors"
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}