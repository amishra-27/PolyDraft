'use client';

import { useQuery } from '@tanstack/react-query';
import { DraftMarketList } from '@/components/DraftMarketList';
import { Skeleton } from '@/components/ui/Skeleton';
import { RefreshCw } from 'lucide-react';

interface DraftMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
}

async function fetchDraftMarkets(): Promise<DraftMarket[]> {
  const response = await fetch('/api/draft-markets');
  if (!response.ok) {
    throw new Error('Failed to fetch draft markets');
  }
  return response.json();
}

export default function DraftPage() {
  // Poll draft markets every 10 seconds
  const { data: markets, isLoading, error, isFetching } = useQuery({
    queryKey: ['draft-markets'],
    queryFn: fetchDraftMarkets,
    refetchInterval: 10_000, // Poll every 10 seconds
    staleTime: 5_000, // Consider data stale after 5 seconds
  });

  return (
    <div className="pb-24 min-h-screen">
      <header className="mb-6 pt-2">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Draft Room</h1>
            <p className="text-text-muted text-sm">Top 20 markets by 24h volume, ending within 1 week</p>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-primary text-xs">
              <RefreshCw size={14} className="animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-surface border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">
            Error loading markets: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border border-white/5 rounded-xl p-4">
              <Skeleton width="100%" height={100} variant="rectangular" />
            </div>
          ))}
        </div>
      ) : markets ? (
        <DraftMarketList markets={markets} />
      ) : null}
    </div>
  );
}
