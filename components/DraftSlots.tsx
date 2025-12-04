import { Check, X, User, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface DraftSlotsProps {
  totalSlots: number;
  currentPick: number;
  picks?: Array<{
    pickNumber: number;
    userId: string;
    userName: string;
    outcome: 'YES' | 'NO';
    marketTitle?: string;
    error?: string;
  }>;
  currentUserId?: string;
  animating?: boolean;
  isLoading?: boolean;
  connecting?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function DraftSlots({ 
  totalSlots, 
  currentPick, 
  picks = [], 
  currentUserId, 
  animating = false,
  isLoading = false,
  connecting = false,
  error = null,
  onRetry
}: DraftSlotsProps) {
  const getPickData = (slotNum: number) => {
    return picks.find(pick => pick.pickNumber === slotNum);
  };

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto py-4 px-4 no-scrollbar snap-x mask-linear-fade">
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex-shrink-0 w-20 h-24 rounded-xl border bg-surface/30 border-white/5 flex flex-col items-center justify-center gap-1">
              <div className="w-6 h-2 bg-surface/50 rounded" />
              <div className="w-8 h-8 bg-surface/50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-error/5 border border-error/20 rounded-xl">
        <AlertTriangle size={24} className="text-error mb-2" />
        <p className="text-error text-sm font-medium text-center mb-2">Draft Error</p>
        <p className="text-text-dim text-xs text-center mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto py-4 px-4 no-scrollbar snap-x mask-linear-fade">
      {Array.from({ length: totalSlots }).map((_, i) => {
        const slotNum = i + 1;
        const isCurrent = slotNum === currentPick;
        const pickData = getPickData(slotNum);
        const isCurrentUserPick = pickData?.userId === currentUserId;

        return (
          <div
            key={i}
            className={`
              relative flex-shrink-0 w-20 h-24 rounded-xl border flex flex-col items-center justify-center gap-1 snap-center transition-all duration-300 hover:scale-105
              ${pickData
                ? pickData.outcome === 'YES'
                  ? 'bg-success/10 border-success/50 text-success shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-error/10 border-error/50 text-error shadow-[0_0_10px_rgba(185,28,28,0.3)]'
                : isCurrent
                  ? `bg-surface border-primary scale-110 shadow-[0_0_25px_rgba(239,68,68,0.5)] z-10 ${animating ? 'animate-pulse' : ''}`
                  : 'bg-surface/30 border-white/5 text-text-dim hover:border-white/10'
              }
              ${isCurrentUserPick ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
              ${connecting && isCurrent ? 'animate-pulse' : ''}
            `}
            style={{
              animationDelay: connecting && isCurrent ? `${i * 100}ms` : undefined
            }}
          >
            {/* Pick number label */}
            <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">
              Pick
            </span>
            
            {/* Pick number or user initials */}
            {pickData ? (
              <div className="flex flex-col items-center gap-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${pickData.outcome === 'YES' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-error/20 text-error'
                  }
                `}>
                  {getUserInitials(pickData.userName)}
                </div>
                
                {/* Outcome indicator */}
                <div className="flex items-center gap-1">
                  {pickData.outcome === 'YES' ? (
                    <Check size={12} className="text-success" />
                  ) : (
                    <X size={12} className="text-error" />
                  )}
                  <span className={`text-[10px] font-bold ${
                    pickData.outcome === 'YES' ? 'text-success' : 'text-error'
                  }`}>
                    {pickData.outcome}
                  </span>
                </div>
              </div>
            ) : (
              <span className={`font-bold text-2xl ${isCurrent ? 'text-white' : ''}`}>
                {slotNum}
              </span>
            )}

            {/* Current pick indicator with enhanced animation */}
            {isCurrent && (
              <>
                <div className="absolute -bottom-1 w-10 h-1 bg-primary rounded-full blur-[2px] animate-pulse" />
                <div className="absolute inset-0 rounded-xl border-2 border-primary/30 animate-ping" />
                {connecting && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                )}
                {animating && !connecting && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </>
            )}

            {/* Hover tooltip for completed picks */}
            {pickData && (
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-surface border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20">
                <div className="font-semibold">{pickData.userName}</div>
                {pickData.marketTitle && (
                  <div className="text-text-muted text-[10px] line-clamp-1">
                    {pickData.marketTitle}
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface" />
                </div>
              </div>
            )}

            {/* User indicator for current user's picks */}
            {isCurrentUserPick && (
              <div className="absolute -top-1 -right-1">
                <User size={12} className="text-primary" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

