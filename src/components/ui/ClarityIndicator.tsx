'use client';

import { cn, getClarityLevel } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ClarityIndicatorProps {
  score: number;
  aiName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ClarityIndicator({
  score,
  aiName,
  showLabel = true,
  size = 'md',
  className,
}: ClarityIndicatorProps) {
  const level = getClarityLevel(score);
  const percentage = Math.round(score * 100);

  const sizeClasses = {
    sm: { bar: 'h-1.5', text: 'text-xs', icon: 14 },
    md: { bar: 'h-2', text: 'text-sm', icon: 18 },
    lg: { bar: 'h-3', text: 'text-base', icon: 22 },
  };

  const levelConfig = {
    high: {
      color: 'from-b2-accent-green to-b2-accent-cyan',
      bgColor: 'bg-b2-accent-green/10',
      textColor: 'text-b2-accent-green',
      label: '清醒',
      Icon: CheckCircle,
    },
    medium: {
      color: 'from-b2-accent-amber to-b2-accent-cyan',
      bgColor: 'bg-b2-accent-amber/10',
      textColor: 'text-b2-accent-amber',
      label: '警惕',
      Icon: AlertTriangle,
    },
    low: {
      color: 'from-b2-accent-pink to-b2-accent-amber',
      bgColor: 'bg-b2-accent-pink/10',
      textColor: 'text-b2-accent-pink',
      label: '失忆',
      Icon: XCircle,
    },
  };

  const config = levelConfig[level];
  const { bar, text, icon } = sizeClasses[size];

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className={cn('flex items-center justify-between', text)}>
          <div className="flex items-center gap-1.5">
            <Brain className={config.textColor} size={icon} />
            {aiName && <span className="text-b2-text-secondary">{aiName}</span>}
          </div>
          <div className={cn('flex items-center gap-1', config.textColor)}>
            <config.Icon size={icon - 2} />
            <span>{config.label}</span>
            <span className="font-mono">{percentage}%</span>
          </div>
        </div>
      )}
      
      {/* 进度条 */}
      <div className={cn('rounded-full overflow-hidden bg-white/5', bar)}>
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', config.color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

interface ClarityBadgeProps {
  score: number;
  className?: string;
}

export function ClarityBadge({ score, className }: ClarityBadgeProps) {
  const level = getClarityLevel(score);
  const percentage = Math.round(score * 100);

  const levelConfig = {
    high: {
      bgColor: 'bg-b2-accent-green/10 border-b2-accent-green/30',
      textColor: 'text-b2-accent-green',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    },
    medium: {
      bgColor: 'bg-b2-accent-amber/10 border-b2-accent-amber/30',
      textColor: 'text-b2-accent-amber',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    },
    low: {
      bgColor: 'bg-b2-accent-pink/10 border-b2-accent-pink/30',
      textColor: 'text-b2-accent-pink',
      glow: 'shadow-[0_0_8px_rgba(236,72,153,0.3)]',
    },
  };

  const config = levelConfig[level];

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono',
        config.bgColor,
        config.textColor,
        config.glow,
        className
      )}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Brain size={12} />
      <span>{percentage}%</span>
    </motion.div>
  );
}

interface StatusDotProps {
  status: 'online' | 'warning' | 'error' | 'offline';
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, pulse = true, className }: StatusDotProps) {
  const statusConfig = {
    online: {
      color: 'bg-b2-accent-green',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    },
    warning: {
      color: 'bg-b2-accent-amber',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    },
    error: {
      color: 'bg-b2-accent-pink',
      glow: 'shadow-[0_0_8px_rgba(236,72,153,0.5)]',
    },
    offline: {
      color: 'bg-b2-text-muted',
      glow: '',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      {pulse && status !== 'offline' && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.color
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          config.color,
          config.glow
        )}
      />
    </span>
  );
}
