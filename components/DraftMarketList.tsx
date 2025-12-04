'use client';

interface DraftMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
}

interface DraftMarketListProps {
  markets: DraftMarket[];
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(endDateIso: string): string {
  if (!endDateIso) return 'N/A';
  
  try {
    const date = new Date(endDateIso);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

export function DraftMarketList({ markets }: DraftMarketListProps) {
  if (markets.length === 0) {
    return (
      <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
        <p className="text-text-muted text-sm">No markets available</p>
        <p className="text-text-dim text-xs mt-1">Markets will appear here as they become available</p>
      </div>
    );
  }

  // Deduplicate markets by ID to prevent React key warnings
  const uniqueMarkets = markets.reduce((acc, market) => {
    if (!acc.find(m => m.id === market.id)) {
      acc.push(market);
    }
    return acc;
  }, [] as DraftMarket[]);

  return (
    <div className="space-y-3">
      {uniqueMarkets.map((market) => (
        <div
          key={market.id}
          className="bg-surface border border-white/5 rounded-xl p-4 hover:border-primary/30 hover:bg-surface-hover transition-all"
        >
          <div className="mb-3">
            <h3 className="font-medium text-white text-sm leading-snug mb-2">
              {market.question}
            </h3>
            <div className="text-xs text-text-muted">
              Ends: {formatDate(market.endDateIso)}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-white/5">
            <div className="flex-1 bg-success/10 border border-success/30 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold text-success uppercase mb-1">YES</div>
              <div className="text-sm font-bold text-white">{formatPercent(market.yesPrice)}</div>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold text-red-400 uppercase mb-1">NO</div>
              <div className="text-sm font-bold text-white">{formatPercent(market.noPrice)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

