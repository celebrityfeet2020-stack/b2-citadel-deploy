'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';

// ==================== GlassCard ====================
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

// ==================== GlassButton ====================
interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function GlassButton({
  children,
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  const variantClasses = {
    default: 'bg-white/10 hover:bg-white/20 border-white/20',
    primary: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/30 text-cyan-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-400/30 text-red-300',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/30 text-emerald-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-lg border backdrop-blur-sm transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ==================== GlassInput ====================
interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export function GlassInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  disabled = false,
}: GlassInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full px-4 py-2 rounded-lg',
        'bg-white/5 border border-white/10',
        'text-white placeholder-white/40',
        'focus:outline-none focus:border-cyan-400/50 focus:bg-white/10',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}

// ==================== GlassSelect ====================
interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

export function GlassSelect({
  value,
  onChange,
  options,
  className,
  disabled = false,
}: GlassSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-4 py-2 rounded-lg',
        'bg-white/5 border border-white/10',
        'text-white',
        'focus:outline-none focus:border-cyan-400/50',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-gray-900">
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ==================== GlassTextarea ====================
interface GlassTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export function GlassTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  disabled = false,
}: GlassTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={cn(
        'w-full px-4 py-2 rounded-lg resize-none',
        'bg-white/5 border border-white/10',
        'text-white placeholder-white/40',
        'focus:outline-none focus:border-cyan-400/50 focus:bg-white/10',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}
