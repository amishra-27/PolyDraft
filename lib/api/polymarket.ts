import { 
  PolymarketMarket, 
  PolymarketEvent, 
  PolymarketTag, 
  PolymarketSeries,
  PolymarketComment,
  PolymarketPrice,
  MarketsQuery,
  MarketCategory,
  PolymarketResponse,
  PolymarketErrorResponse
} from './types';

// API Endpoints
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

// Use proxy route in development to avoid CORS, but fallback to direct API in production
const API_BASE = process.env.NODE_ENV === 'development' 
  ? '/api/polymarket' 
  : GAMMA_API;

// For tags endpoint, always use direct API (no proxy needed)
const TAGS_API_BASE = GAMMA_API;

class PolymarketAPI {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_POLYMARKET_API_KEY || null;
  }

  private async fetchWithErrorHandling<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData: PolymarketErrorResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString(),
          timestamp: new Date().toISOString(),
        }));
        throw new Error(errorData.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Polymarket API Error:', error);
      throw error;
    }
  }

  // Markets
  async getMarkets(query: MarketsQuery = {}): Promise<PolymarketMarket[]> {
    const params = new URLSearchParams();
    
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.active !== undefined) params.append('active', query.active.toString());
    if (query.closed !== undefined) params.append('closed', query.closed.toString());
    if (query.resolved !== undefined) params.append('resolved', query.resolved.toString());
    if (query.tags?.length) params.append('tags', query.tags.join(','));
    if (query.category) params.append('category', query.category);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.order) params.append('order', query.order);
    if (query.search) params.append('search', query.search);

    const url = `${API_BASE}/markets${params.toString() ? `?${params.toString()}` : ''}`;
    return this.fetchWithErrorHandling<PolymarketMarket[]>(url);
  }

  async getMarket(id: string): Promise<PolymarketMarket> {
    return this.fetchWithErrorHandling<PolymarketMarket>(`${GAMMA_API}/markets/${id}`);
  }

  // Events
  async getEvents(query: Partial<MarketsQuery> = {}): Promise<PolymarketEvent[]> {
    const params = new URLSearchParams();
    
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.active !== undefined) params.append('active', query.active.toString());
    if (query.category) params.append('category', query.category);

    const url = `${GAMMA_API}/events${params.toString() ? `?${params.toString()}` : ''}`;
    return this.fetchWithErrorHandling<PolymarketEvent[]>(url);
  }

  async getEvent(id: string): Promise<PolymarketEvent> {
    return this.fetchWithErrorHandling<PolymarketEvent>(`${GAMMA_API}/events/${id}`);
  }

  // Tags
  async getTags(): Promise<PolymarketTag[]> {
    return this.fetchWithErrorHandling<PolymarketTag[]>(`${TAGS_API_BASE}/tags`);
  }

  // Series
  async getSeries(query: Partial<MarketsQuery> = {}): Promise<PolymarketSeries[]> {
    const params = new URLSearchParams();
    
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.category) params.append('category', query.category);

    const url = `${GAMMA_API}/series${params.toString() ? `?${params.toString()}` : ''}`;
    return this.fetchWithErrorHandling<PolymarketSeries[]>(url);
  }

  // Comments
  async getComments(marketId: string, limit = 50): Promise<PolymarketComment[]> {
    return this.fetchWithErrorHandling<PolymarketComment[]>(
      `${GAMMA_API}/comments?marketId=${marketId}&limit=${limit}`
    );
  }

  // Crypto Prices (Real-time data)
  async getCryptoPrices(): Promise<PolymarketPrice[]> {
    return this.fetchWithErrorHandling<PolymarketPrice[]>(`${GAMMA_API}/prices`);
  }

  // Search - search markets with query
  async searchMarkets(query: string, limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ search: query, limit });
  }

  // Get markets by category
  async getMarketsByCategory(category: MarketCategory, limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ category, active: true, limit });
  }

  // Get trending markets (by volume) - newest active markets with highest volume
  async getTrendingMarkets(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'volume', 
      order: 'desc', 
      limit 
    });
  }

  // Get new markets (by start time) - newest active markets
  async getNewMarkets(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'startTime', 
      order: 'desc', 
      limit 
    });
  }

  // Get markets ending soon - active markets ending soon
  async getMarketsEndingSoon(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'endTime', 
      order: 'asc', 
      limit 
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchWithErrorHandling<{ status: string; timestamp: string }>(`${GAMMA_API}/health`);
  }
}

// Singleton instance
export const polymarketAPI = new PolymarketAPI();

// Utility functions for data transformation
export const transformMarketData = (market: PolymarketMarket) => {
  return {
    id: market.id,
    title: market.question,
    description: market.description,
    category: market.category || 'other',
    endDate: new Date(market.endTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    startTime: new Date(market.startTime),
    endTime: new Date(market.endTime),
    isActive: market.active && !market.closed && !market.resolved,
    isResolved: market.resolved,
    volume: parseFloat(market.volume || '0'),
    liquidity: parseFloat(market.liquidity || '0'),
    outcomes: market.outcomes,
    outcomePrices: market.outcomePrices,
    tags: market.tags,
    image: market.image,
    slug: market.slug,
    tokenPrice: parseFloat(market.tokenPrice || '0'),
  };
};

export const formatMarketForCard = (market: PolymarketMarket) => {
  const transformed = transformMarketData(market);
  
  return {
    id: transformed.id,
    title: transformed.title,
    category: transformed.category.charAt(0).toUpperCase() + transformed.category.slice(1),
    endDate: transformed.endDate,
    isActive: transformed.isActive,
    volume: transformed.volume,
    outcomes: transformed.outcomes,
    outcomePrices: transformed.outcomePrices,
    image: transformed.image,
  };
};