import { X, Check, AlertTriangle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PolymarketMarket } from '@/lib/api/types';
import { parseOutcomePrices } from '@/lib/api/polymarket';
import { DraftErrorClass, ErrorCode } from '@/lib/utils/error-handling';

interface PickConfirmationModalProps {
  isOpen: boolean;
  market: PolymarketMarket | null;
  selectedOutcome: 'YES' | 'NO' | null;
  onSelectOutcome: (outcome: 'YES' | 'NO') => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | DraftErrorClass | null;
  onRetry?: () => void;
  timeRemaining?: number;
}

export function PickConfirmationModal({
  isOpen,
  market,
  selectedOutcome,
  onSelectOutcome,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
  onRetry,
  timeRemaining
}: PickConfirmationModalProps) {
  if (!isOpen || !market) return null;

  const [yesPrice, noPrice] = parseOutcomePrices(market.outcomePrices);
  const selectedPrice = selectedOutcome === 'YES' ? yesPrice : noPrice;

  const getEndDate = () => {
    try {
      const dateStr = market.endDate || market.endTime;
      if (!dateStr) return 'TBD';

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'TBD';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
       {/* Modal */}
       <div className="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl shadow-primary/20 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-white/5">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-text-muted" />
          </button>
          
          <div className="pr-8">
            <h2 className="text-xl font-bold text-white mb-2">Confirm Your Pick</h2>
            <p className="text-text-dim text-sm">Choose YES or NO for this market</p>
          </div>
        </div>

        {/* Market Details */}
        <div className="p-6 pb-4">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
              {market.category || 'other'}
            </span>
          </div>
          
          <h3 className="font-bold text-white text-lg leading-snug mb-4">
            {market.question}
          </h3>
          
          {market.description && (
            <p className="text-text-dim text-sm mb-4 line-clamp-2">
              {market.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-dim mb-6">
            <span>Ends: {getEndDate()}</span>
            {market.volume && parseFloat(market.volume) > 0 && (
              <span>Volume: ${parseFloat(market.volume).toLocaleString()}</span>
            )}
          </div>

          {/* Outcome Selection */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-white">Select your outcome:</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* YES Button */}
              <button
                onClick={() => onSelectOutcome('YES')}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 font-bold
                  ${selectedOutcome === 'YES'
                    ? 'bg-success text-black border-success shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                    : 'bg-white/5 border-white/10 text-success hover:bg-success/10 hover:border-success/30'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <Check size={20} />
                  <span className="text-lg">YES</span>
                  <span className="text-sm opacity-80">
                    {Math.round(yesPrice * 100)}% chance
                  </span>
                </div>
                {selectedOutcome === 'YES' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
                )}
              </button>

              {/* NO Button */}
              <button
                onClick={() => onSelectOutcome('NO')}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 font-bold
                  ${selectedOutcome === 'NO'
                    ? 'bg-error text-white border-error shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105'
                    : 'bg-white/5 border-white/10 text-error hover:bg-error/10 hover:border-error/30'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <X size={20} />
                  <span className="text-lg">NO</span>
                  <span className="text-sm opacity-80">
                    {Math.round(noPrice * 100)}% chance
                  </span>
                </div>
                {selectedOutcome === 'NO' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Selected Outcome Summary */}
          {selectedOutcome && (
            <div className={`
              p-4 rounded-xl border-2 mb-6
              ${selectedOutcome === 'YES'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-error/10 border-error/30 text-error'
              }
            `}>
              <div className="flex items-center gap-3">
                {selectedOutcome === 'YES' ? (
                  <Check size={20} />
                ) : (
                  <X size={20} />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    You picked {selectedOutcome}
                  </p>
                  <p className="text-xs opacity-80">
                    {Math.round(selectedPrice * 100)}% implied probability
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Remaining Warning */}
          {timeRemaining !== undefined && timeRemaining <= 10 && timeRemaining > 0 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-warning text-sm">
                <Clock size={16} className="animate-pulse" />
                <span>Hurry! Only {timeRemaining}s remaining to make your pick.</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-error flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-error text-sm">
                    {typeof error === 'string' ? error : error.userMessage}
                  </p>
                  
                  {/* Retry option for retryable errors */}
                  {typeof error !== 'string' && error.retryable && onRetry && (
                    <button
                      onClick={onRetry}
                      disabled={isLoading}
                      className="mt-2 text-xs text-error hover:text-error/80 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                      {isLoading ? 'Retrying...' : 'Retry Pick'}
                    </button>
                  )}
                  
                  {/* Error code for debugging */}
                  {typeof error !== 'string' && process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-text-dim mt-1">
                      Error code: {error.code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            disabled={!selectedOutcome || isLoading}
            className={`
              flex-1 h-11 px-6 inline-flex items-center justify-center font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm
              ${selectedOutcome === 'YES'
                ? 'bg-success hover:bg-success/90 text-white border-2 border-success shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : selectedOutcome === 'NO'
                ? 'bg-error hover:bg-error/90 text-white border-2 border-error shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-primary hover:bg-primary-hover text-white border-2 border-primary shadow-[0_0_15px_rgba(255,107,157,0.4)]'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              `Confirm ${selectedOutcome || 'Pick'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}