import { Skeleton } from './Skeleton';

interface SkeletonLoaderProps {
  type?: 'card' | 'league' | 'market' | 'leaderboard' | 'profile' | 'text';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'league':
        return (
          <div key={index} className="bg-surface border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        );

      case 'market':
        return (
          <div key={index} className="bg-surface border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div key={index} className="bg-surface border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div key={index} className="bg-surface border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        );

      default: // card
        return (
          <div key={index} className="bg-surface border border-white/10 rounded-2xl p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {skeletons.map(renderSkeleton)}
    </div>
  );
}