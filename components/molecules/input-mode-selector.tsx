"use client"

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatrixLabel } from '@/components/atoms';
import { Edit, FileText } from 'lucide-react';

interface InputModeSelectorProps {
  value: 'manual' | 'file';
  onChange: (value: 'manual' | 'file') => void;
}

export function InputModeSelector({ value, onChange }: InputModeSelectorProps) {
  return (
    <div className="space-y-2">
      <MatrixLabel>INPUT MODE</MatrixLabel>
      <Tabs 
        value={value} 
        onValueChange={(val: string) => onChange(val as 'manual' | 'file')} 
        className="w-full"
      >
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
  );
}