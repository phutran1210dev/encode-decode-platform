"use client"

import React, { useState, useEffect } from 'react';
import { MatrixButton } from '@/components/atoms';
import { EyeOff, Shield, Activity } from 'lucide-react';

interface HiddenAPIControlProps {
  className?: string;
}

export function HiddenAPIControl({ className = '' }: HiddenAPIControlProps) {
  const [isHiddenActive, setIsHiddenActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hiddenAPIService, setHiddenAPIService] = useState<unknown>(null);
  
  useEffect(() => {
    const initializeHiddenAPI = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Dynamic import to avoid SSR issues
        const { hiddenAPI } = await import('@/lib/hidden-api');
        setHiddenAPIService(hiddenAPI);
        
        // Show control in dev mode or with special flag
        const urlParams = new URLSearchParams(window.location.search);
        const showControls = 
          process.env.NODE_ENV === 'development' ||
          urlParams.has('hidden') ||
          localStorage.getItem('show-hidden-controls') === 'true';
        
        setIsVisible(showControls);
        
        // Check if hidden API is active
        const isActive = localStorage.getItem('hidden-api-active') === 'true';
        setIsHiddenActive(isActive);
        
      } catch (error) {
        console.warn('Failed to initialize hidden API control:', error);
      }
    };
    
    const timer = setTimeout(initializeHiddenAPI, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const toggleHiddenAPI = () => {
    if (!hiddenAPIService) return;
    
    const newState = !isHiddenActive;
    setIsHiddenActive(newState);
    localStorage.setItem('hidden-api-active', newState.toString());
    
    if (newState) {
      console.log('🫥 Hidden API mode activated - Network requests invisible');
    } else {
      console.log('👁️ Hidden API mode deactivated - Normal network visibility');
    }
  };
  
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    localStorage.setItem('show-hidden-controls', newVisibility.toString());
  };
  
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 left-4 w-8 h-8 bg-black/80 border border-purple-500/30 rounded text-purple-500 hover:text-purple-400 text-xs opacity-30 hover:opacity-100 transition-all z-50"
        title="Show hidden API controls"
      >
        <EyeOff className="w-3 h-3 mx-auto" />
      </button>
    );
  }
  
  return (
    <div className={`fixed bottom-4 left-4 bg-black/90 border border-purple-500/30 rounded-lg p-3 backdrop-blur-sm z-50 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-purple-400 text-xs font-mono">HIDDEN API</div>
        <button
          onClick={toggleVisibility}
          className="text-purple-500/50 hover:text-purple-400 transition-colors"
          title="Hide controls"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isHiddenActive ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs font-mono text-purple-300">
          {isHiddenActive ? 'INVISIBLE' : 'NORMAL'}
        </span>
        
        <MatrixButton
          onClick={toggleHiddenAPI}
          size="sm"
          variant={isHiddenActive ? 'default' : 'outline'}
          icon={isHiddenActive ? EyeOff : Shield}
          className="ml-2 border-purple-500/50 text-purple-400 hover:text-purple-300"
        >
          {isHiddenActive ? 'VISIBLE' : 'HIDE'}
        </MatrixButton>
      </div>
      
      {isHiddenActive && (
        <div className="mt-2 text-xs text-purple-600 font-mono flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Network invisible
        </div>
      )}
      
      <div className="mt-2 flex gap-1">
        <div className="text-xs text-purple-700 bg-purple-900/20 px-1 rounded">SW</div>
        <div className="text-xs text-purple-700 bg-purple-900/20 px-1 rounded">WW</div>
        <div className="text-xs text-purple-700 bg-purple-900/20 px-1 rounded">DT</div>
      </div>
    </div>
  );
}