"use client"

import React, { useState, useEffect } from 'react';
import { MatrixButton } from '@/components/atoms';
import { Shield, ShieldOff, Eye, EyeOff } from 'lucide-react';
import { getRequestInterceptor } from '@/lib/request-interceptor';

interface StealthControlProps {
  className?: string;
}

export function StealthControl({ className = '' }: StealthControlProps) {
  const [isStealthActive, setIsStealthActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const checkInitialState = () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Check initial state
        const interceptor = getRequestInterceptor();
        const stealthActive = interceptor.isStealthActive();
        setIsStealthActive(stealthActive);
        
        // Show control in dev mode or with special flag
        const isDev = process.env.NODE_ENV === 'development';
        const urlParams = new URLSearchParams(window.location.search);
        const showControls = isDev || urlParams.has('debug') || localStorage.getItem('show-stealth-controls') === 'true';
        
        setIsVisible(showControls);
      } catch (error) {
        console.warn('Stealth control initialization failed:', error);
      }
    };
    
    // Use setTimeout to avoid synchronous setState in effect
    const timer = setTimeout(checkInitialState, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const toggleStealth = () => {
    const interceptor = getRequestInterceptor();
    
    if (isStealthActive) {
      interceptor.deactivate();
      localStorage.setItem('stealth-mode', 'false');
      setIsStealthActive(false);
    } else {
      interceptor.activate();
      localStorage.setItem('stealth-mode', 'true');
      setIsStealthActive(true);
    }
  };
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    localStorage.setItem('show-stealth-controls', (!isVisible).toString());
  };
  
  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 w-8 h-8 bg-black/80 border border-green-500/30 rounded text-green-500 hover:text-green-400 text-xs opacity-50 hover:opacity-100 transition-all z-50"
        title="Show stealth controls"
      >
        <Eye className="w-3 h-3 mx-auto" />
      </button>
    );
  }
  
  return (
    <div className={`fixed bottom-4 right-4 bg-black/90 border border-green-500/30 rounded-lg p-3 backdrop-blur-sm z-50 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-green-400 text-xs font-mono">STEALTH MODE</div>
        <button
          onClick={toggleVisibility}
          className="text-green-500/50 hover:text-green-400 transition-colors"
          title="Hide controls"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isStealthActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs font-mono text-green-300">
          {isStealthActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
        
        <MatrixButton
          onClick={toggleStealth}
          size="sm"
          variant={isStealthActive ? 'default' : 'outline'}
          icon={isStealthActive ? Shield : ShieldOff}
          className="ml-2"
        >
          {isStealthActive ? 'DISABLE' : 'ENABLE'}
        </MatrixButton>
      </div>
      
      {isStealthActive && (
        <div className="mt-2 text-xs text-green-600 font-mono">
          🥷 Requests obfuscated
        </div>
      )}
    </div>
  );
}