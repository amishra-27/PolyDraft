'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface TrendingMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso: string;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  volume24hr: string;
  volume1wk: string;
  volumeNum: string;
  liquidityNum: number;
  oneHourPriceChange?: number;
  oneDayPriceChange?: number;
  spread: number;
  midPrice: number;
}

async function fetchTrendingMarkets(): Promise<TrendingMarket[]> {
  const response = await fetch('/api/trending');
  if (!response.ok) {
    throw new Error('Failed to fetch trending markets');
  }
  return response.json();
}

function formatTimeToEnd(endDateIso: string): string {
  if (!endDateIso) return 'N/A';
  
  const endDate = new Date(endDateIso);
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff < 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export default function AnalyticsPage() {
  const { data: markets, isLoading, error, isFetching } = useQuery({
    queryKey: ['trending-markets'],
    queryFn: fetchTrendingMarkets,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
  });

  return (
    <div className="pb-24">
      <header className="mb-6 pt-2">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Trending 20</h1>
            <p className="text-text-muted text-sm">Top markets by 24h volume</p>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-primary text-xs">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
              <Skeleton width="100%" height={60} variant="rectangular" />
            </div>
          ))}
        </div>
      ) : markets && markets.length > 0 ? (
        <div className="space-y-2">
          {markets.map((market, index) => {
            const priceChange1h = market.oneHourPriceChange ?? 0;
            const priceChange24h = market.oneDayPriceChange ?? 0;
            const isPositive1h = priceChange1h >= 0;
            const isPositive24h = priceChange24h >= 0;

            return (
              <div
                key={market.id}
                className="bg-surface border border-white/5 rounded-xl p-4 hover:border-primary/30 hover:bg-surface-hover transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-text-muted">#{index + 1}</span>
                      <a
                        href={`https://polymarket.com/market/${market.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-bold text-sm hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        {market.question}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTimeToEnd(market.endDateIso)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} />
                        <span>Liq: {formatCurrency(market.liquidityNum)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-white mb-1">
                      {formatPercent(market.lastTradePrice)}
                    </div>
                    <div className="text-xs text-text-muted">Last Price</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Bid / Ask</div>
                    <div className="text-sm font-medium text-white">
                      {formatPercent(market.bestBid)} / {formatPercent(market.bestAsk)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      Spread: {formatPercent(market.spread)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-text-muted mb-1">24h Volume</div>
                    <div className="text-sm font-bold text-white">
                      {formatCurrency(market.volume24hr)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-text-muted mb-1">1w Volume</div>
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(market.volume1wk)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-text-muted mb-1">Price Change</div>
                    <div className="flex items-center gap-2">
                      {market.oneHourPriceChange !== undefined && (
                        <div className={`text-xs font-medium flex items-center gap-1 ${isPositive1h ? 'text-success' : 'text-red-400'}`}>
                          {isPositive1h ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatPercent(Math.abs(priceChange1h))}
                        </div>
                      )}
                      {market.oneDayPriceChange !== undefined && (
                        <div className={`text-xs font-medium flex items-center gap-1 ${isPositive24h ? 'text-success' : 'text-red-400'}`}>
                          {isPositive24h ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatPercent(Math.abs(priceChange24h))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <p className="text-text-muted text-sm">No trending markets found</p>
        </div>
      )}
    </div>
  );
}
