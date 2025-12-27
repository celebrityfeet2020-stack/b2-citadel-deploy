'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  holographic?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = false,
  holographic = false,
  onClick,
}: GlassCardProps) {
  const baseClasses = cn(
    'rounded-xl backdrop-blur-[16px]',
    'bg-white/[0.05] border border-white/10',
    'shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]',
    hover && 'transition-all duration-300 cursor-pointer hover:bg-white/[0.1] hover:border-white/20 hover:shadow-[0_8px_32px_0_rgba(0,212,255,0.1)]',
    holographic && 'holographic-border',
    className
  );

  if (hover) {
    return (
      <motion.div
        className={baseClasses}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
}

interface GlassButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

export function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}: GlassButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: cn(
      'bg-gradient-to-r from-b2-accent-cyan/20 to-b2-accent-purple/20',
      'border-b2-accent-cyan/30 text-b2-accent-cyan',
      'hover:from-b2-accent-cyan/30 hover:to-b2-accent-purple/30',
      'hover:border-b2-accent-cyan/50 hover:shadow-glow-cyan'
    ),
    secondary: cn(
      'bg-white/5 border-white/10 text-b2-text-primary',
      'hover:bg-white/10 hover:border-white/20'
    ),
    danger: cn(
      'bg-gradient-to-r from-b2-accent-pink/20 to-b2-accent-amber/20',
      'border-b2-accent-pink/30 text-b2-accent-pink',
      'hover:from-b2-accent-pink/30 hover:to-b2-accent-amber/30',
      'hover:border-b2-accent-pink/50 hover:shadow-glow-pink'
    ),
  };

  return (
    <motion.button
      className={cn(
        'rounded-lg font-medium transition-all duration-300 border',
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'password' | 'email';
  disabled?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function GlassInput({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  disabled = false,
  autoFocus = false,
  onKeyDown,
}: GlassInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full px-4 py-3 rounded-lg',
        'bg-white/[0.05] backdrop-blur-[16px]',
        'border border-white/10',
        'text-b2-text-primary placeholder-b2-text-muted',
        'focus:outline-none focus:border-b2-accent-cyan/50',
        'focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)]',
        'transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  );
}

interface GlassTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function GlassTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
  disabled = false,
  autoFocus = false,
  onKeyDown,
}: GlassTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      rows={rows}
      onKeyDown={onKeyDown}
      className={cn(
        'w-full px-4 py-3 rounded-lg resize-none',
        'bg-white/[0.05] backdrop-blur-[16px]',
        'border border-white/10',
        'text-b2-text-primary placeholder-b2-text-muted',
        'focus:outline-none focus:border-b2-accent-cyan/50',
        'focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)]',
        'transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  );
}
