"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlitchText } from '@/components/matrix-effects';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatrixCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function MatrixCard({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className 
}: MatrixCardProps) {
  return (
    <Card className={cn('hacker-terminal pulse-effect', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400 font-mono glow-text">
          {Icon && <Icon className="h-5 w-5" />}
          <GlitchText text={title} />
        </CardTitle>
        {description && (
          <CardDescription className="text-green-500/70 font-mono">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}