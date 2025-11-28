"use client"

import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MatrixLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function MatrixLabel({ children, htmlFor, className }: MatrixLabelProps) {
  return (
    <Label 
      htmlFor={htmlFor}
      className={cn('text-green-400 font-mono', className)}
    >
      {children}
    </Label>
  );
}