"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatrixButtonProps {
  children?: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function MatrixButton({ 
  children, 
  icon: Icon, 
  onClick, 
  disabled, 
  variant = 'default', 
  size = 'default',
  className,
  type = 'button',
  ...props 
}: MatrixButtonProps) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn('matrix-button font-mono', variant === 'default' && 'text-black', className)}
      {...props}
    >
      {Icon && <Icon className={cn('h-4 w-4', children && 'mr-2')} />}
      {children}
    </Button>
  );
}