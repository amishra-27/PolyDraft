import { useState } from 'react';
import { Check, X, TrendingUp, Clock } from 'lucide-react';
import { PolymarketMarket } from '@/lib/api/types';

interface MarketCardProps {
  market: PolymarketMarket;
  isSelected?: boolean;
  onSelect?: () => void;
  showVolume?: boolean;
}

export function MarketCard({ 
  market, 
  isSelected, 
  onSelect, 
  showVolume = true 
}: MarketCardProps) {
  const [vote, setVote] = useState<'YES' | 'NO' | null>(null);
  
  const isActive = market.active && !market.closed && !market.resolved;
  const category = market.category || 'other';
  const endDate = new Date(market.endTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const yesPrice = market.outcomePrices?.[0] || 0;
  const noPrice = market.outcomePrices?.[1] || 0;
  const volume = parseFloat(market.volume || '0');

  return (
    <div
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-2xl border p-5 cursor-pointer transition-all duration-300 group
        ${isSelected
          ? 'bg-surface border-primary shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-[1.02]'
          : 'bg-surface/50 backdrop-blur-md border-white/5 hover:border-primary/30 hover:bg-surface-hover'
        }
      `}
    >
      {isSelected && <div className="absolute inset-0 bg-primary/5 z-0" />}

      <div className="relative z-10 flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
              {category}
            </span>
            {isSelected && <span className="text-[10px] font-bold text-white bg-primary px-2 py-1 rounded-md animate-pulse">SELECTED</span>}
            {!isActive && (
              <span className="text-[10px] font-bold text-text-muted bg-white/5 px-2 py-1 rounded-md border border-white/10">
                {market.resolved ? 'RESOLVED' : 'CLOSED'}
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-sm leading-snug group-hover:text-primary transition-colors line-clamp-3">
            {market.question}
          </h3>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-text-dim flex items-center gap-1.5">
            <Clock size={12} />
            {endDate}
          </div>
          {showVolume && volume > 0 && (
            <div className="text-xs font-medium text-text-dim flex items-center gap-1.5">
              <TrendingUp size={12} />
              ${volume.toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setVote('YES'); }}
            className={`h-9 px-3 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all duration-200 border ${vote === 'YES'
                ? 'bg-success text-black border-success shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-105'
                : 'bg-white/5 border-white/10 text-success hover:bg-success/10 hover:border-success/30'
              }`}
          >
            <span>YES</span>
            <span className="text-[10px] opacity-80">{(yesPrice * 100).toFixed(0)}%</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setVote('NO'); }}
            className={`h-9 px-3 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all duration-200 border ${vote === 'NO'
                ? 'bg-error text-white border-error shadow-[0_0_10px_rgba(239,68,68,0.4)] scale-105'
                : 'bg-white/5 border-white/10 text-error hover:bg-error/10 hover:border-error/30'
              }`}
          >
            <span>NO</span>
            <span className="text-[10px] opacity-80">{(noPrice * 100).toFixed(0)}%</span>
          </button>
        </div>
      </div>
    </div>
  );
}

