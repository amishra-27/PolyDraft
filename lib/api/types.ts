// Polymarket API Types

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  endTime: string;
  startTime: string;
  image: string;
  slug: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  volume: string;
  liquidity: string;
  tokenPrice: string;
  outcomePrices: number[];
  outcomes: string[];
  tags: string[];
  category: string;
  subcategory?: string;
  events: string[];
  clobTokenIds: string[];
  negRisk: boolean;
  negRiskMarketId?: string;
  negRiskOutcome?: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  slug: string;
  startTime: string;
  endTime: string;
  image: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  volume: string;
  liquidity: string;
  markets: string[];
  tags: string[];
  category: string;
  subcategory?: string;
}

export interface PolymarketTag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  markets: string[];
}

export interface PolymarketSeries {
  id: string;
  title: string;
  description: string;
  slug: string;
  startTime: string;
  endTime: string;
  image: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  volume: string;
  liquidity: string;
  markets: string[];
  events: string[];
  tags: string[];
  category: string;
  subcategory?: string;
}

export interface PolymarketComment {
  id: string;
  username: string;
  comment: string;
  timestamp: string;
  marketId: string;
  userId: string;
  likes: number;
  replies: number;
  isLiked: boolean;
}

export interface PolymarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: string;
}

// API Response Types
export interface PolymarketResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PolymarketErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp: string;
}

// Market Categories for filtering
export type MarketCategory = 
  | 'crypto' 
  | 'politics' 
  | 'sports' 
  | 'business' 
  | 'technology' 
  | 'entertainment' 
  | 'science'
  | 'other';

// Market Status
export type MarketStatus = 'open' | 'closed' | 'resolved' | 'upcoming';

// Sort Options
export type SortOption = 
  | 'volume' 
  | 'liquidity' 
  | 'endTime' 
  | 'startTime' 
  | 'created'
  | 'popular';

// API Query Parameters
export interface MarketsQuery {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  resolved?: boolean;
  tags?: string[];
  category?: MarketCategory;
  sortBy?: SortOption;
  order?: 'asc' | 'desc';
  search?: string;
}