// Polymarket API Types

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  endTime: string; // When betting closes
  startTime: string;
  endDate?: string; // Alternative end date field (ISO format)
  closedTime?: string; // When the market was actually closed
  resolutionSource?: string; // Source used for resolution
  image: string;
  slug: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  volume: string;
  liquidity: string;
  tokenPrice: string;
  outcomePrices: string; // API returns as comma-separated string "0.65,0.35"
  outcomes: string[];
  tags: string[];
  category: string;
  subcategory?: string;
  events: string[];
  clobTokenIds: string;
  negRisk: boolean;
  negRiskMarketId?: string;
  negRiskOutcome?: string;
  marketType?: string; // For filtering binary markets
  // Additional fields from API
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  volume24hr?: number;
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
  label: string;
  slug: string;
  description?: string;
  color?: string;
  markets?: string[];
  forceShow?: boolean;
  forceHide?: boolean;
  isCarousel?: boolean;
  publishedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
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
  | 'volumeNum'
  | 'liquidity' 
  | 'liquidityNum'
  | 'endTime' 
  | 'endDate'
  | 'startTime' 
  | 'startDate'
  | 'created'
  | 'createdAt'
  | 'popular'
  | 'id';

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
  // Polymarket API specific parameters
  tag_id?: number;
  ascending?: boolean;
  order_fields?: string;
  // Date filtering parameters
  endDate_max?: string;  // Markets ending before this date
  endDate_min?: string;  // Markets ending after this date
  startDate_max?: string; // Markets starting before this date
  startDate_min?: string; // Markets starting after this date
  // Binary market filtering
  marketType?: string;  // Filter for binary markets
  binary?: boolean;      // Alternative binary filter
}