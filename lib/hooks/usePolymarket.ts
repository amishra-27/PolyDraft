'use client';

import { useState, useEffect, useCallback } from 'react';
import { polymarketAPI, transformMarketData, formatMarketForCard } from '@/lib/api/polymarket';
import { PolymarketMarket, MarketsQuery, MarketCategory } from '@/lib/api/types';
import { useRealtimeMarkets } from './useRealtimeMarkets';

interface UsePolymarketMarketsOptions {
  query?: MarketsQuery;
  autoFetch?: boolean;
}

interface UsePolymarketMarketsReturn {
  markets: PolymarketMarket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function usePolymarketMarkets({
  query = {},
  autoFetch = true
}: UsePolymarketMarketsOptions = {}): UsePolymarketMarketsReturn {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchMarkets = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentOffset = reset ? 0 : offset;
      const limit = 20; // Page size
      
      const newMarkets = await polymarketAPI.getMarkets({
        ...query,
        limit,
        offset: currentOffset,
      });

      if (reset) {
        setMarkets(newMarkets);
        setOffset(limit);
      } else {
        setMarkets(prev => [...prev, ...newMarkets]);
        setOffset(prev => prev + limit);
      }

      setHasMore(newMarkets.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  }, [query, offset]);

  const refetch = useCallback(() => fetchMarkets(true), [fetchMarkets]);
  
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchMarkets(false);
    }
  }, [fetchMarkets, loading, hasMore]);

  useEffect(() => {
    if (autoFetch) {
      fetchMarkets(true);
    }
  }, [autoFetch, fetchMarkets]);

  return {
    markets,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}

// Hook for getting markets by category
export function useMarketsByCategory(category: MarketCategory, limit = 20) {
  return usePolymarketMarkets({
    query: { category, active: true, limit },
    autoFetch: true,
  });
}

// Hook for trending markets - fetch top 10 newest active markets by volume
export function useTrendingMarkets(limit = 10) {
  return usePolymarketMarkets({
    query: { active: true, sortBy: 'volume', order: 'desc', limit },
    autoFetch: true,
  });
}

// Hook for new markets - fetch newest active markets by start time
export function useNewMarkets(limit = 10) {
  return usePolymarketMarkets({
    query: { active: true, sortBy: 'startTime', order: 'desc', limit },
    autoFetch: true,
  });
}

// Hook for markets ending soon
export function useMarketsEndingSoon(limit = 20) {
  return usePolymarketMarkets({
    query: { active: true, sortBy: 'endTime', order: 'asc', limit },
    autoFetch: true,
  });
}

// Hook for single market
export function useMarket(marketId: string | null) {
  const [market, setMarket] = useState<PolymarketMarket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) {
      setMarket(null);
      setError(null);
      return;
    }

    const fetchMarket = async () => {
      try {
        setLoading(true);
        setError(null);
        const marketData = await polymarketAPI.getMarket(marketId);
        setMarket(marketData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market');
        console.error('Error fetching market:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  return { market, loading, error };
}

// Hook for market search
export function useMarketSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await polymarketAPI.searchMarkets(query, 20);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching markets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, search]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error,
  };
}

// Hook for market categories
export function useMarketCategories() {
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const tags = await polymarketAPI.getTags();
        const uniqueCategories = Array.from(
          new Set(tags.map(tag => tag.label?.toLowerCase() as MarketCategory))
        ).filter(cat => cat && ['crypto', 'politics', 'sports', 'business', 'technology', 'entertainment', 'science'].includes(cat));
        
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// Hook for binary markets ending within 1 week, sorted by volume
export function useBinaryMarketsEndingSoon() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both markets and categories in parallel
        const [marketsData, tagsData] = await Promise.all([
          polymarketAPI.getBinaryMarketsEndingSoon(20), // 20 most active binary markets ending within 1 week
          polymarketAPI.getTags()
        ]);
        
        setMarkets(marketsData);
        
        const uniqueCategories = Array.from(
          new Set(tagsData.map(tag => tag.label?.toLowerCase() as MarketCategory))
        ).filter(cat => cat && ['crypto', 'politics', 'sports', 'business', 'technology', 'entertainment', 'science'].includes(cat));
        
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch binary markets');
        console.error('Error fetching binary markets ending soon:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [marketsData, tagsData] = await Promise.all([
        polymarketAPI.getBinaryMarketsEndingSoon(20),
        polymarketAPI.getTags()
      ]);
      
      setMarkets(marketsData);
      
      const uniqueCategories = Array.from(
        new Set(tagsData.map((tag: any) => tag.label?.toLowerCase() as MarketCategory))
      ).filter((cat: string) => cat && ['crypto', 'politics', 'sports', 'business', 'technology', 'entertainment', 'science'].includes(cat));
      
      setCategories(uniqueCategories as MarketCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch binary markets');
      console.error('Error refetching binary markets ending soon:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { markets, categories, loading, error, refetch };
}

// Hook for draft page - fetches active markets ending within 1 week, sorted by volume with live prices
export function useDraftPageData() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get real-time market data with live prices
  const {
    marketsWithLivePrices,
    clobConnected,
    clobConnecting,
    clobError,
    rtdsConnected,
    rtdsConnecting,
    rtdsError,
  } = useRealtimeMarkets({
    markets,
    enableCLOB: true,
    enableRTDS: false, // Can enable this later for additional real-time features
    autoConnect: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both markets and categories in parallel
        const [marketsData, tagsData] = await Promise.all([
          polymarketAPI.getBinaryMarketsEndingSoon(20), // 20 most active markets ending within 1 week
          polymarketAPI.getTags()
        ]);

        setMarkets(marketsData);

        const uniqueCategories = Array.from(
          new Set(tagsData.map(tag => tag.label?.toLowerCase() as MarketCategory))
        ).filter(cat => cat && ['crypto', 'politics', 'sports', 'business', 'technology', 'entertainment', 'science'].includes(cat));

        setCategories(uniqueCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch draft data');
        console.error('Error fetching draft page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [marketsData, tagsData] = await Promise.all([
        polymarketAPI.getBinaryMarketsEndingSoon(20),
        polymarketAPI.getTags()
      ]);

      setMarkets(marketsData);

      const uniqueCategories = Array.from(
        new Set(tagsData.map((tag: any) => tag.label?.toLowerCase() as MarketCategory))
      ).filter((cat: string) => cat && ['crypto', 'politics', 'sports', 'business', 'technology', 'entertainment', 'science'].includes(cat));

      setCategories(uniqueCategories as MarketCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch draft data');
      console.error('Error refetching draft page data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markets: marketsWithLivePrices,
    categories,
    loading,
    error: error || clobError || rtdsError,
    refetch,
    clobConnected,
    clobConnecting,
    rtdsConnected,
    rtdsConnecting,
    fullySynchronized: clobConnected, // For now, just check CLOB connection
  };
}