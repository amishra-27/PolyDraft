'use client';

import { useState, useEffect, useCallback } from 'react';
import { MarketCard } from '@/components/MarketCard';
import { DraftSlots } from '@/components/DraftSlots';
import { Button } from '@/components/ui/Button';
import { MarketCardSkeleton, CategoryFilterSkeleton } from '@/components/ui/Skeleton';
import { ConnectionStatus } from '@/components/ui/LoadingStates';
import { PickConfirmationModal } from '@/components/PickConfirmationModal';
import { Clock, AlertCircle, Wifi, WifiOff, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

import { useDraftPageData } from '@/lib/hooks/usePolymarket';
import { useDraftState } from '@/lib/hooks/useDraftState';
import { PolymarketMarket, MarketCategory } from '@/lib/api/types';

import { useToast } from '@/lib/utils/toast';
import { 
  DraftErrorClass, 
  ErrorCode,
  createNetworkError, 
  createTimeoutError, 
  retryWithBackoff,
  logError,
  parseError 
} from '@/lib/utils/error-handling';

export default function DraftPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO' | null>(null);
  const [confirmError, setConfirmError] = useState<string | DraftErrorClass | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  

  const { showError, showSuccess, showWarning, showInfo } = useToast();
  
  // Mock draft state - in real app, this would come from URL params or context
  const { 
    makePick, 
    isLoading, 
    error: draftError, 
    timeRemaining,
    retryLastAction,
    isUserTurn 
  } = useDraftState('mock-league-id', 'mock-user-id');
  
  // Use real data if available, otherwise fallback to dummy data
  const { 
    markets, 
    categories, 
    loading, 
    error: marketError, 
    refetch, 
    clobConnected, 
    clobConnecting,
    rtdsConnected,
    rtdsConnecting,
    fullySynchronized 
  } = useDraftPageData();

  // Filter markets by category
  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.category === selectedCategory);

  const displayMarkets = filteredMarkets;

  const handleConfirmPick = () => {
    if (!selectedMarket) return;
    setShowConfirmation(true);
    setSelectedOutcome(null);
    setConfirmError(null);
    setRetryCount(0);
  };

  const handleSelectOutcome = (outcome: 'YES' | 'NO') => {
    setSelectedOutcome(outcome);
    setConfirmError(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setSelectedOutcome(null);
    setConfirmError(null);
    setRetryCount(0);
  };

  const handleRetryPick = async () => {
    if (!selectedMarket || !selectedOutcome) return;
    
    setRetryCount(prev => prev + 1);
    setConfirmError(null);
    
    try {
      await retryWithBackoff(async () => {
        await makePick(selectedMarket, selectedOutcome);
      }, {
        maxAttempts: 3,
        baseDelay: 1000,
        shouldRetry: (error, attempt) => error.retryable && attempt < 3
      });
      
      // Success
      setShowConfirmation(false);
      setSelectedMarket(null);
      setSelectedOutcome(null);
      setRetryCount(0);
      showSuccess('Pick confirmed successfully!');
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { 
        action: 'retryPick', 
        marketId: selectedMarket, 
        outcome: selectedOutcome,
        retryCount: retryCount + 1 
      });
      
      setConfirmError(error);
      
      if (retryCount >= 2) {
        showWarning('Maximum retry attempts reached. Please try again later.');
      }
    }
  };

  const handleFinalConfirm = async () => {
    if (!selectedMarket || !selectedOutcome) return;
    
    try {
      setConfirmError(null);
      await makePick(selectedMarket, selectedOutcome);
      setShowConfirmation(false);
      setSelectedMarket(null);
      setSelectedOutcome(null);
      showSuccess('Pick confirmed successfully!');
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { 
        action: 'makePick', 
        marketId: selectedMarket, 
        outcome: selectedOutcome 
      });
      
      setConfirmError(error);
      showError(error);
    }
  };

  const handleRefetchMarkets = async () => {
    setIsReconnecting(true);
    
    try {
      await retryWithBackoff(async () => {
        await refetch();
      }, {
        maxAttempts: 3,
        baseDelay: 1000,
        shouldRetry: (error, attempt) => error.retryable && attempt < 3
      });
      
      showSuccess('Markets refreshed successfully!');
      
    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'refetchMarkets' });
      showError(error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleRetryDraftAction = async () => {
    try {
      await retryLastAction();
    } catch (err) {
      const error = parseError(err);
      logError(error, { action: 'retryDraftAction' });
      showError(error);
    }
  };

  const getSelectedMarket = (): PolymarketMarket | null => {
    if (!selectedMarket) return null;
    
    return displayMarkets.find(m => m.id === selectedMarket) || null;
  };

  return (
    <div className="pb-24 min-h-screen flex flex-col bg-[url('/grid.svg')] bg-fixed bg-cover">
      {/* Fixed Header Area */}
      <div className="flex-none pt-4 px-2 sticky top-0 z-30 bg-gradient-to-b from-background via-background/95 to-transparent pb-4">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Draft Room</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <p className="text-primary font-bold text-xs uppercase tracking-wider">Your Turn • 00:45</p>
              {fullySynchronized ? (
                <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-md border border-success/20 flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Wifi size={10} className="animate-pulse" />
                  LIVE SYNC
                </span>
              ) : (clobConnecting || rtdsConnecting) ? (
                <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  Connecting...
                </span>
              ) : clobConnected && !rtdsConnected ? (
                <span className="text-[10px] font-bold text-info bg-info/10 px-2 py-1 rounded-md border border-info/20 flex items-center gap-1">
                  <WifiOff size={10} />
                  CLOB Only
                </span>
              ) : (
                <ConnectionStatus isConnected={false} isConnecting={false} type="both" />
              )}
            </div>
          </div>
          <div className="bg-surface/80 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/30 flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Clock size={16} className="text-primary" />
            <div className="flex flex-col items-end leading-none">
              <span className="text-[10px] text-text-muted uppercase font-bold">Round 3</span>
              <span className="font-mono font-bold text-white text-lg">Pick 8</span>
            </div>
          </div>
        </header>

         {/* Draft Slots Strip */}
         <div className="mb-2 -mx-2">
           <DraftSlots 
             totalSlots={10} 
             currentPick={8} 
             isLoading={loading}
             connecting={clobConnecting || rtdsConnecting}
             animating={fullySynchronized}
           />
         </div>

         {/* Filters */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
           <Button 
             variant="secondary" 
             size="sm" 
             onClick={() => setSelectedCategory('all')}
             className={`rounded-xl whitespace-nowrap font-bold shadow-lg shadow-white/10 transition-all duration-200 hover:scale-105 ${
               selectedCategory === 'all' 
                 ? 'bg-white text-black border-transparent hover:bg-white/90' 
                 : 'bg-surface border-white/10 hover:border-white/20 text-text-muted hover:text-white'
             }`}
           >
             All Markets
           </Button>
           {loading && categories.length === 0 ? (
             <CategoryFilterSkeleton />
           ) : (
             categories.map((category, index) => (
               <Button
                 key={category}
                 variant="secondary"
                 size="sm"
                 onClick={() => setSelectedCategory(category)}
                 className={`rounded-xl whitespace-nowrap font-bold transition-all duration-200 hover:scale-105 animate-in fade-in slide-in-from-left-2 duration-300`}
                 style={{ animationDelay: `${index * 50}ms` }}
               >
                 {category.charAt(0).toUpperCase() + category.slice(1)}
               </Button>
             ))
           )}
         </div>
      </div>

      {/* Scrollable Market List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-32">
        {loading && displayMarkets.length === 0 ? (
          // Loading skeletons with staggered animation
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`skeleton-${i}`} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <MarketCardSkeleton />
              </div>
            ))}
          </div>
         ) : marketError ? (
           <div className="p-12 bg-surface/50 backdrop-blur-md border border-error/20 rounded-xl text-center animate-in fade-in duration-300">
             <AlertCircle size={48} className="text-error mx-auto mb-4 animate-pulse" />
             <p className="text-error text-sm mb-2">Failed to load markets</p>
             <p className="text-text-dim text-xs mb-4">{marketError}</p>
             <Button 
               variant="primary" 
               size="sm" 
               onClick={handleRefetchMarkets}
               isLoading={isReconnecting}
               className="hover:scale-105 transition-transform duration-200"
             >
               {isReconnecting ? 'Retrying...' : 'Try Again'}
             </Button>
           </div>
         ) : displayMarkets.length > 0 ? (
           <>
             {displayMarkets.map((market, index) => (
               <div 
                 key={market.id}
                 className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                 style={{ animationDelay: `${index * 50}ms` }}
               >
                 <MarketCard
                   market={market as PolymarketMarket}
                   isSelected={selectedMarket === market.id}
                   onSelect={() => setSelectedMarket(market.id)}
                   isLive={clobConnected}
                   rtdsConnected={rtdsConnected}
                 />
               </div>
             ))}
            
            {/* Note: No Load More button needed since we fetch exactly 20 markets */}
          </>
        ) : (
          <div className="p-12 bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl text-center animate-in fade-in duration-300">
            <p className="text-text-muted text-sm mb-2">No markets available</p>
            <p className="text-text-dim text-xs">Try adjusting your filters or check back later</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-40 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            variant="primary"
            onClick={handleConfirmPick}
            className={`w-full py-6 text-lg font-bold shadow-2xl transition-all duration-300 hover:scale-105 ${
              selectedMarket
                ? 'shadow-[0_0_30px_rgba(6,182,212,0.4)] translate-y-0 opacity-100'
                : 'translate-y-10 opacity-50 grayscale'
            }`}
            disabled={!selectedMarket}
          >
            {selectedMarket ? 'Confirm Pick' : 'Select a Market'}
          </Button>
        </div>
      </div>

       {/* Confirmation Modal */}
       <PickConfirmationModal
         isOpen={showConfirmation}
         market={getSelectedMarket()}
         selectedOutcome={selectedOutcome}
         onSelectOutcome={handleSelectOutcome}
         onConfirm={handleFinalConfirm}
         onCancel={handleCancelConfirmation}
         isLoading={isLoading}
         error={confirmError}
         onRetry={handleRetryPick}
         timeRemaining={isUserTurn ? timeRemaining : undefined}
       />

       {/* Draft Error Toast */}
       {draftError && (
         <div className="fixed top-4 left-4 right-4 z-50">
           <div className="max-w-md mx-auto bg-error/10 border border-error/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-start gap-3">
               <AlertTriangle size={20} className="text-error flex-shrink-0 mt-0.5" />
               <div className="flex-1">
                 <p className="text-error font-medium text-sm mb-1">Draft Error</p>
                 <p className="text-text-dim text-xs mb-2">{draftError.userMessage}</p>
                 {draftError.retryable && (
                   <button
                     onClick={handleRetryDraftAction}
                     className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                   >
                     <RefreshCw size={12} />
                     Retry Action
                   </button>
                 )}
               </div>
               <button
                 onClick={() => setConfirmError(null)}
                 className="text-text-muted hover:text-white transition-colors p-1"
               >
                 ×
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

