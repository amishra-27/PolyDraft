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

// Use proxy routes in development to avoid CORS, but fallback to direct API in production
const API_BASE = process.env.NODE_ENV === 'development' 
  ? '/api/polymarket' 
  : GAMMA_API;

const MARKETS_API_BASE = process.env.NODE_ENV === 'development' 
  ? '/api/polymarket/markets' 
  : `${GAMMA_API}/markets`;

const TAGS_API_BASE = process.env.NODE_ENV === 'development' 
  ? '/api/polymarket/tags' 
  : `${GAMMA_API}/tags`;

class PolymarketAPI {
  private apiKey: string | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_POLYMARKET_API_KEY || null;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async fetchWithErrorHandling<T>(
    url: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PolyDraft/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: PolymarketErrorResponse = await response.json().catch(() => ({
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString(),
          timestamp: new Date().toISOString(),
        }));
        
        // Retry on rate limiting (429) with exponential backoff
        if (response.status === 429 && retryCount < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retryCount);
          console.warn(`Rate limited. Retrying in ${delay}ms (${retryCount + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          return this.fetchWithErrorHandling<T>(url, options, retryCount + 1);
        }
        
        // Don't retry on other client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorData.error);
        }
        
        // Retry on server errors (5xx) with exponential backoff
        if (retryCount < this.maxRetries && response.status >= 500) {
          console.warn(`Retrying request (${retryCount + 1}/${this.maxRetries}) after error:`, errorData.error);
          await this.sleep(this.retryDelay * Math.pow(2, retryCount));
          return this.fetchWithErrorHandling<T>(url, options, retryCount + 1);
        }
        
        throw new Error(errorData.error);
      }

      return await response.json();
    } catch (error) {
      // More specific error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - API did not respond in time');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          // Retry network errors
          if (retryCount < this.maxRetries) {
            console.warn(`Retrying request (${retryCount + 1}/${this.maxRetries}) after network error:`, error.message);
            await this.sleep(this.retryDelay * Math.pow(2, retryCount));
            return this.fetchWithErrorHandling<T>(url, options, retryCount + 1);
          }
          throw new Error('Network error - Unable to reach API');
        }
      }
      
      console.error('Polymarket API Error:', error);
      throw error;
    }
  }

  // Markets with caching
  async getMarkets(query: MarketsQuery = {}): Promise<PolymarketMarket[]> {
    // Create cache key from query parameters
    const cacheKey = `markets_${JSON.stringify(query)}`;
    
    // Check cache first
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch fresh data if not cached
    const params = new URLSearchParams();
    
    // Map our internal query to actual Polymarket API parameters
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    
    // Map active to closed=false (Polymarket API uses closed, not active)
    if (query.active !== undefined) {
      params.append('closed', (!query.active).toString());
    } else if (query.closed !== undefined) {
      params.append('closed', query.closed.toString());
    }
    
    // Add binary market filtering
    if (query.marketType) {
      params.append('marketType', query.marketType);
    }
    if (query.binary !== undefined) {
      params.append('binary', query.binary.toString());
    }
    
    // Map sortBy and order to Polymarket API format
    if (query.sortBy) {
      params.append('order', query.sortBy);
      // Default to descending if order is specified, otherwise use ascending parameter
      if (query.order === 'desc') {
        params.append('ascending', 'false');
      } else if (query.order === 'asc') {
        params.append('ascending', 'true');
      }
    }
    
    // Date filtering parameters
    if (query.endDate_max) {
      params.append('endDate_max', query.endDate_max);
    }
    if (query.endDate_min) {
      params.append('endDate_min', query.endDate_min);
    }
    if (query.startDate_max) {
      params.append('startDate_max', query.startDate_max);
    }
    if (query.startDate_min) {
      params.append('startDate_min', query.startDate_min);
    }
    
    // Note: Polymarket API doesn't support search parameter directly
    // It has its own search endpoint
    
    // Note: category should be mapped to tag_id, but we need tag ID first
    if (query.tag_id) {
      params.append('tag_id', query.tag_id.toString());
    }

    const url = `${MARKETS_API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await this.fetchWithErrorHandling<PolymarketMarket[]>(url);
    
    // Cache the response
    dataCache.set(cacheKey, data);
    
    return data;
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

  // Tags with caching
  async getTags(): Promise<PolymarketTag[]> {
    const cacheKey = 'tags_all';
    
    // Check cache first
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await this.fetchWithErrorHandling<PolymarketTag[]>(TAGS_API_BASE);
    
    // Cache the response
    dataCache.set(cacheKey, data);
    
    return data;
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

  // Get binary markets ending within 1 week, sorted by volume (most active first)
  async getBinaryMarketsEndingSoon(limit = 20): Promise<PolymarketMarket[]> {
    // Calculate date range: markets ending within 7 days from now
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format dates as ISO strings for API
    const endDateMin = now.toISOString();
    const endDateMax = oneWeekFromNow.toISOString();

    console.log(`Fetching markets ending between ${endDateMin} and ${endDateMax}`);

    // Fetch markets ending within 7 days, sorted by volume (most active first)
    const allMarkets = await this.getMarkets({
      active: true,
      closed: false,
      sortBy: 'volumeNum',
      order: 'desc',
      endDate_min: endDateMin,  // Markets ending after now
      endDate_max: endDateMax,  // Markets ending before 7 days from now
      limit: limit * 5, // Fetch 5x to account for filtering
    });

    console.log(`Fetched ${allMarkets.length} markets, now filtering...`);

    // Filter for standalone binary markets with reasonable odds
    const binaryMarkets = allMarkets.filter(market => {
      try {
        // Must be a binary market (exactly 2 outcomes: YES/NO)
        if (!market.outcomes || !Array.isArray(market.outcomes) || market.outcomes.length !== 2) {
          return false;
        }

        // Check if outcomes are YES/NO (case insensitive)
        const outcomes = market.outcomes.map(o => o.toUpperCase().trim());
        const hasYesNoOutcomes = outcomes.includes('YES') && outcomes.includes('NO');
        
        if (!hasYesNoOutcomes) {
          return false;
        }

        // Parse outcome prices to get probabilities
        const prices = parseOutcomePrices(market.outcomePrices);
        const yesPrice = prices[0];
        const noPrice = prices[1];

        // Skip markets with extreme odds (too certain)
        // We want interesting markets where the outcome is uncertain
        if (yesPrice < 0.15 || yesPrice > 0.85) {
          console.log(`Skipping market with extreme odds: "${market.question}" (${Math.round(yesPrice * 100)}% YES, ${Math.round(noPrice * 100)}% NO)`);
          return false;
        }

        // Skip markets that are clearly part of grouped events
        // These are markets where the question is about a specific team winning a championship
        const groupedMarketPatterns = [
          /^Will .+ win (the )?(Super Bowl|World Series|NBA Championship|NBA Finals|World Cup|Stanley Cup|Premier League|Champions League)/i,
          /^Will .+ win (the )?(MVP|Cy Young|Heisman|Ballon d'Or)/i,
          /^Who will win (the )?(Super Bowl|World Series|NBA Championship|World Cup)/i,
          /^Which team will win (the )?(Super Bowl|World Series|NBA Championship)/i,
        ];

        if (groupedMarketPatterns.some(pattern => pattern.test(market.question))) {
          console.log(`Skipping grouped market: "${market.question}"`);
          return false;
        }

        // Additional check: Skip if the market question suggests it's part of a larger event
        const questionLower = market.question.toLowerCase();
        const groupedKeywords = [
          'super bowl', 'world series', 'nba championship', 'nba finals', 
          'world cup', 'stanley cup', 'premier league', 'champions league',
          'win the championship', 'win the title', 'win the cup'
        ];
        
        if (groupedKeywords.some(keyword => questionLower.includes(keyword)) && 
            !questionLower.includes('will there be') && 
            !questionLower.includes('will any')) {
          console.log(`Skipping championship market: "${market.question}"`);
          return false;
        }

        // Must have meaningful volume (at least $1000)
        const volume = parseFloat(market.volume || '0');
        if (volume < 1000) {
          console.log(`Skipping low volume market: "${market.question}" ($${volume.toLocaleString()})`);
          return false;
        }

        return true;
      } catch (error) {
        console.warn('Error filtering market:', error);
        return false;
      }
    });

    console.log(`Found ${binaryMarkets.length} interesting binary markets out of ${allMarkets.length} total markets`);

    // Sort by volume (highest first)
    const sortedMarkets = binaryMarkets.sort((a, b) => {
      const volumeA = parseFloat(a.volume || '0');
      const volumeB = parseFloat(b.volume || '0');
      return volumeB - volumeA;
    });

    // Return only the top requested number
    return sortedMarkets.slice(0, limit);
  }

  // Get trending markets (by volume) - newest active markets with highest volume
  async getTrendingMarkets(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'volumeNum', // Use volumeNum which is numeric volume field
      order: 'desc', 
      limit 
    });
  }

  // Get new markets (by start time) - newest active markets
  async getNewMarkets(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'startDate', // Use startDate instead of startTime
      order: 'desc', 
      limit 
    });
  }

  // Get markets ending soon - active markets ending soon
  async getMarketsEndingSoon(limit = 10): Promise<PolymarketMarket[]> {
    return this.getMarkets({ 
      active: true, 
      sortBy: 'endDate', 
      order: 'asc', 
      limit 
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const result = await this.fetchWithErrorHandling<{ status: string; timestamp: string }>(`${GAMMA_API}/health`);
      return result;
    } catch (error) {
      // If health check fails, try a simple markets call as fallback
      try {
        await this.getMarkets({ limit: 1 });
        return { status: 'ok', timestamp: new Date().toISOString() };
      } catch (fallbackError) {
        throw new Error('API is unavailable');
      }
    }
  }
}

// Tag cache for category filtering
class TagCache {
  private tagMap = new Map<string, number>();
  private lastFetch = 0;
  private api = new PolymarketAPI();
  
  async getTagIdByLabel(label: string): Promise<number | null> {
    // Check cache first
    if (this.tagMap.has(label)) {
      return this.tagMap.get(label)!;
    }
    
      // Fetch tags if cache is empty or stale (5 minutes)
    if (Date.now() - this.lastFetch > 5 * 60 * 1000) {
      const tags = await this.api.getTags();
      
      // Build label -> ID map
      tags.forEach(tag => {
        if (tag.label) {
          this.tagMap.set(tag.label.toLowerCase(), parseInt(tag.id));
        }
      });
      
      this.lastFetch = Date.now();
    }
    
    return this.tagMap.get(label.toLowerCase()) || null;
  }
  
  async getTags(): Promise<PolymarketTag[]> {
    return this.api.getTags();
  }
}



// Smart caching with TTL management
class PolymarketDataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  set(key: string, data: any, ttlMinutes = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp, ttl } = cached;
    
    // Return stale data if TTL exceeded
    if (Date.now() - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }
  
  // Clear expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  // Manual cache clearing
  clear() {
    this.cache.clear();
  }
  
  // Get cache size
  size() {
    return this.cache.size;
  }
  
  // Destroy cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const polymarketAPI = new PolymarketAPI();
export const dataCache = new PolymarketDataCache();

// Utility to detect binary markets
export const isBinaryMarket = (market: PolymarketMarket): boolean => {
  // Must have exactly 2 outcomes
  if (!market.outcomes || !Array.isArray(market.outcomes) || market.outcomes.length !== 2) {
    return false;
  }

  // Check if outcomes are YES/NO (case insensitive)
  const outcomes = market.outcomes.map(o => o.toUpperCase().trim());
  const hasYesNoOutcomes = outcomes.includes('YES') && outcomes.includes('NO');
  
  if (!hasYesNoOutcomes) {
    return false;
  }

  // Check if it's explicitly marked as binary
  if (market.marketType === 'binary') {
    return true;
  }

  // Check if outcome prices look like binary market prices
  if (market.outcomePrices) {
    try {
      const prices = parseOutcomePrices(market.outcomePrices);
      // Binary markets should have prices that sum to 1 (approximately)
      const sum = prices[0] + prices[1];
      return Math.abs(sum - 1) < 0.01;
    } catch (error) {
      return false;
    }
  }

  return false;
};

// Utility to detect if a market is part of a grouped event
export const isGroupedMarket = (market: PolymarketMarket): boolean => {
  const question = market.question.toLowerCase();
  
  // Patterns that indicate grouped markets (championships, tournaments, etc.)
  const groupedPatterns = [
    /^Will .+ win (the )?(Super Bowl|World Series|NBA Championship|NBA Finals|World Cup|Stanley Cup|Premier League|Champions League|MLS Cup|World Series|World Championship)/i,
    /^Who will win (the )?(Super Bowl|World Series|NBA Championship|World Cup|Stanley Cup|Premier League|Champions League)/i,
    /^Which team will win (the )?(Super Bowl|World Series|NBA Championship|World Cup|Stanley Cup)/i,
    /^Will .+ win (the )?(MVP|Cy Young|Heisman|Ballon d'Or|Golden Boot|Golden Glove)/i,
  ];

  // Check question patterns
  if (groupedPatterns.some(pattern => pattern.test(market.question))) {
    return true;
  }

  // Check for keywords that suggest grouped markets
  const groupedKeywords = [
    'super bowl', 'world series', 'nba championship', 'nba finals', 
    'world cup', 'stanley cup', 'premier league', 'champions league',
    'win the championship', 'win the title', 'win the cup', 'win the tournament',
    'win mvp', 'win the award', 'win the trophy'
  ];
  
  // If question contains these keywords AND is about a specific entity winning, it's likely grouped
  if (groupedKeywords.some(keyword => question.includes(keyword)) && 
      (question.includes('will ') || question.includes('who ')) &&
      !question.includes('will there be') && 
      !question.includes('will any') &&
      !question.includes('will at least')) {
    return true;
  }

  // Note: events field contains strings (IDs), not event objects
  // So we can't check event titles directly here
  // This check would need to be done at a higher level with event data
  
  return false;
};

// Utility to parse outcome prices correctly
export const parseOutcomePrices = (prices: string | string[]): number[] => {
  if (!prices) return [0.5, 0.5];

  try {
    let parsed: number[];

    // Handle JSON string format like "[\"0.45\", \"0.55\"]"
    if (typeof prices === 'string') {
      // Try to parse as JSON array first
      if (prices.startsWith('[')) {
        const jsonParsed = JSON.parse(prices);
        parsed = jsonParsed.map((p: any) => {
          const num = parseFloat(p);
          return isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
        });
      } else {
        // Parse as comma-separated values
        parsed = prices.split(',').map(p => {
          const trimmed = p.trim();
          const num = parseFloat(trimmed);
          return isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
        });
      }
    } else if (Array.isArray(prices)) {
      parsed = prices.map((p: any) => {
        const num = parseFloat(p);
        return isNaN(num) ? 0 : Math.max(0, Math.min(1, num));
      });
    } else {
      return [0.5, 0.5];
    }

    // Ensure we have exactly 2 values
    if (parsed.length === 0) return [0.5, 0.5];
    if (parsed.length === 1) return [parsed[0], 1 - parsed[0]];
    if (parsed.length > 2) return parsed.slice(0, 2);

    // For binary markets, ensure the prices represent valid probabilities
    // The prices should already sum to 1 for proper binary markets
    const sum = parsed[0] + parsed[1];
    
    // If sum is very close to 1, use as-is (proper binary market)
    if (Math.abs(sum - 1) < 0.01) {
      return parsed;
    }
    
    // If sum is 0 or invalid, return 50/50
    if (sum <= 0) {
      return [0.5, 0.5];
    }
    
    // Otherwise normalize to sum to 1
    return [parsed[0] / sum, parsed[1] / sum];
  } catch (error) {
    console.warn('Failed to parse outcome prices:', prices, error);
    return [0.5, 0.5];
  }
};

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