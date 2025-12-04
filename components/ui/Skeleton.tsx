import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'text', 
  width, 
  height, 
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-surface/50 rounded';
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: ''
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  );
}

// League Card Skeleton
export function LeagueCardSkeleton() {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton width={80} height={20} className="mb-2" />
          <Skeleton width={200} height={24} />
        </div>
        <Skeleton width={60} height={28} variant="rectangular" />
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton width={14} height={14} variant="circular" />
            <Skeleton width={40} height={12} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={14} height={14} variant="circular" />
            <Skeleton width={30} height={12} />
            <Skeleton width={40} height={12} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={14} height={14} variant="circular" />
          <Skeleton width={30} height={12} />
        </div>
      </div>
      
      <Skeleton height={4} variant="rectangular" className="w-full" />
    </div>
  );
}

// Market Card Skeleton
export function MarketCardSkeleton() {
  return (
    <div className="bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-5">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <Skeleton width={60} height={16} className="mb-2" />
          <Skeleton width="100%" height={20} lines={2} />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton width={6} height={6} variant="circular" />
          <Skeleton width={80} height={12} />
        </div>
        
        <div className="flex gap-2">
          <Skeleton width={40} height={36} variant="rectangular" />
          <Skeleton width={40} height={36} variant="rectangular" />
        </div>
      </div>
    </div>
  );
}

// Stats Grid Skeleton
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width={16} height={16} variant="circular" />
            <Skeleton width={40} height={12} />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

// Leaderboard Row Skeleton
export function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-surface border-white/5">
      <div className="flex items-center gap-4">
        <Skeleton width={32} height={32} variant="circular" />
        <div>
          <Skeleton width={120} height={16} className="mb-1" />
          <Skeleton width={60} height={10} />
        </div>
      </div>
      <div className="text-right">
        <Skeleton width={80} height={16} className="mb-1" />
        <Skeleton width={40} height={10} />
      </div>
    </div>
  );
}

// Draft Slot Skeleton
export function DraftSlotSkeleton() {
  return (
    <div className="flex-shrink-0 w-20 h-24 rounded-xl border bg-surface/30 border-white/5 flex flex-col items-center justify-center gap-1">
      <Skeleton width={30} height={8} className="mb-2" />
      <Skeleton width={24} height={24} variant="circular" />
    </div>
  );
}

// Category Filter Skeleton
export function CategoryFilterSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} width={80} height={32} variant="rectangular" className="rounded-xl" />
      ))}
    </div>
  );
}

// Connection Status Skeleton
export function ConnectionStatusSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton width={8} height={8} variant="circular" />
      <Skeleton width={60} height={12} />
    </div>
  );
}

// Modal Content Skeleton
export function ModalContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={16} lines={3} />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton height={48} variant="rectangular" />
        <Skeleton height={48} variant="rectangular" />
      </div>
    </div>
  );
}

// Form Input Skeleton
export function FormInputSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton width={120} height={16} />
      <Skeleton height={44} variant="rectangular" className="rounded-lg" />
    </div>
  );
}