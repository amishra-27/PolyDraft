'use client';

import { useState, useEffect } from 'react';
import { MarketCard } from '@/components/MarketCard';
import { DraftSlots } from '@/components/DraftSlots';
import { Button } from '@/components/ui/Button';
import { Skeleton, MarketCardSkeleton } from '@/components/ui/Skeleton';
import { Clock, Filter, Search, AlertCircle } from 'lucide-react';
import { useDevSettings } from '@/lib/contexts/DevSettingsContext';
import { useTrendingMarkets, useMarketCategories } from '@/lib/hooks/usePolymarket';
import { PolymarketMarket, MarketCategory } from '@/lib/api/types';
import { dummyMarkets } from '@/lib/data/dummyData';

export default function DraftPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all');
  const { settings } = useDevSettings();
  
  // Use real data if available, otherwise fallback to dummy data
  const { markets, loading, error, refetch, loadMore, hasMore } = useTrendingMarkets(50);
  const { categories, loading: categoriesLoading } = useMarketCategories();

  // Filter markets by category
  const filteredMarkets = selectedCategory === 'all' 
    ? markets 
    : markets.filter(market => market.category === selectedCategory);

  const displayMarkets = settings.showDummyData ? dummyMarkets : filteredMarkets;

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
          <DraftSlots totalSlots={10} currentPick={8} />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setSelectedCategory('all')}
            className={`rounded-xl whitespace-nowrap font-bold shadow-lg shadow-white/10 ${
              selectedCategory === 'all' 
                ? 'bg-white text-black border-transparent hover:bg-white/90' 
                : 'bg-surface border-white/10 hover:border-white/20 text-text-muted hover:text-white'
            }`}
          >
            All Markets
          </Button>
          {categoriesLoading ? (
            <Skeleton width={60} height={32} variant="rectangular" />
          ) : (
            categories.map((category) => (
              <Button
                key={category}
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl whitespace-nowrap font-bold ${
                  selectedCategory === category
                    ? 'bg-white text-black border-transparent hover:bg-white/90'
                    : 'bg-surface border-white/10 hover:border-white/20 text-text-muted hover:text-white'
                }`}
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
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <MarketCardSkeleton key={`skeleton-${i}`} />
          ))
        ) : error ? (
          <div className="p-12 bg-surface/50 backdrop-blur-md border border-error/20 rounded-xl text-center">
            <AlertCircle size={48} className="text-error mx-auto mb-4" />
            <p className="text-error text-sm mb-2">Failed to load markets</p>
            <p className="text-text-dim text-xs mb-4">{error}</p>
            <Button variant="primary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          </div>
        ) : displayMarkets.length > 0 ? (
          <>
            {displayMarkets.map((market) => {
              if (settings.showDummyData) {
                // Type assertion for dummy market
                const dummyMarket = market as { id: string; title: string; category: string; endDate: string; };
                
                // Convert dummy market to PolymarketMarket format
                const polymarketMarket: PolymarketMarket = {
                  id: dummyMarket.id,
                  question: dummyMarket.title,
                  description: '',
                  endTime: new Date().toISOString(),
                  startTime: new Date().toISOString(),
                  image: '',
                  slug: dummyMarket.id,
                  active: true,
                  closed: false,
                  resolved: false,
                  volume: '0',
                  liquidity: '0',
                  tokenPrice: '0',
                  outcomePrices: [0.5, 0.5],
                  outcomes: ['YES', 'NO'],
                  tags: [dummyMarket.category],
                  category: dummyMarket.category,
                  clobTokenIds: [],
                  events: [],
                  negRisk: false,
                };
                
                return (
                  <MarketCard
                    key={dummyMarket.id}
                    market={polymarketMarket}
                    isSelected={selectedMarket === dummyMarket.id}
                    onSelect={() => setSelectedMarket(dummyMarket.id)}
                  />
                );
              }
              
              return (
                <MarketCard
                  key={market.id}
                  market={market as PolymarketMarket}
                  isSelected={selectedMarket === market.id}
                  onSelect={() => setSelectedMarket(market.id)}
                />
              );
            })}
            
            {/* Load More Button */}
            {hasMore && !settings.showDummyData && (
              <div className="text-center py-4">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Load More Markets'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl text-center">
            <p className="text-text-muted text-sm mb-2">
              {settings.showDummyData ? 'No markets available' : 'No markets found'}
            </p>
            <p className="text-text-dim text-xs">
              {settings.showDummyData 
                ? 'Enable dummy data in dev settings to see draft markets'
                : 'Try adjusting your filters or check back later'
              }
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-40 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            variant="primary"
            className={`w-full py-6 text-lg font-bold shadow-2xl transition-all duration-300 ${selectedMarket
                ? 'shadow-[0_0_30px_rgba(6,182,212,0.4)] translate-y-0 opacity-100'
                : 'translate-y-10 opacity-50 grayscale'
              }`}
            disabled={!selectedMarket}
          >
            Confirm Pick
          </Button>
        </div>
      </div>
    </div>
  );
}

