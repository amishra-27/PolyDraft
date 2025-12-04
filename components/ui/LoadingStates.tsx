import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'blur' | 'solid';
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  size = 'md',
  variant = 'default'
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  const containerClasses = {
    default: 'bg-black/20 backdrop-blur-sm',
    blur: 'bg-black/10 backdrop-blur-md',
    solid: 'bg-black/80'
  };

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center ${containerClasses[variant]} rounded-lg`}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} className="animate-spin text-primary" />
        {message && (
          <p className="text-sm text-text-muted animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  type: 'clob' | 'rtds' | 'both';
  className?: string;
}

export function ConnectionStatus({ isConnected, isConnecting, type, className }: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div className={`flex items-center gap-2 text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 ${className}`}>
        <Loader2 size={12} className="animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {type === 'both' ? 'Connecting...' : `${type.toUpperCase()} Connecting...`}
        </span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center gap-2 text-success bg-success/10 px-2 py-1 rounded-md border border-success/20 ${className}`}>
        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {type === 'both' ? 'LIVE' : `${type.toUpperCase()} LIVE`}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-text-dim bg-surface/50 px-2 py-1 rounded-md border border-white/10 ${className}`}>
      <div className="w-1.5 h-1.5 bg-text-dim rounded-full" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {type === 'both' ? 'OFFLINE' : `${type.toUpperCase()} OFFLINE`}
      </span>
    </div>
  );
}

interface ProgressIndicatorProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

export function ProgressIndicator({ 
  progress, 
  size = 'md', 
  color = 'primary',
  showLabel = false,
  label
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  };

  const bgColors = {
    primary: 'bg-primary/20',
    success: 'bg-success/20',
    warning: 'bg-warning/20',
    error: 'bg-error/20'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-dim">{label || 'Progress'}</span>
          <span className="text-xs text-text-muted font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full ${bgColors[color]} ${sizeClasses[size]} rounded-full overflow-hidden`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

interface StaggeredAnimationProps {
  children: React.ReactNode;
  staggerDelay?: number; // delay between each child in ms
  className?: string;
}

export function StaggeredAnimation({ children, staggerDelay = 100, className }: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

