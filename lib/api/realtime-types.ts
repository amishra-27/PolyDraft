/**
 * Polymarket Real-Time WebSocket Types
 * Based on official Polymarket documentation
 * https://docs.polymarket.com/developers/RTDS/RTDS-overview
 */

// ============================================================================
// RTDS (Real-Time Data Socket) Types - wss://ws-live-data.polymarket.com
// ============================================================================

/**
 * Base message structure for all RTDS messages
 */
export interface RTDSMessage<T = any> {
  topic: string;
  type: string;
  timestamp: number;
  payload: T;
}

/**
 * Subscription message to subscribe to RTDS topics
 */
export interface RTDSSubscription {
  topic: string;
  type: string;
  filters?: string; // JSON string of filter object
  clob_auth?: {
    key: string;
    secret: string;
    passphrase: string;
  };
  gamma_auth?: {
    address: string;
  };
}

export interface RTDSSubscribeMessage {
  action: 'subscribe';
  subscriptions: RTDSSubscription[];
}

export interface RTDSUnsubscribeMessage {
  action: 'unsubscribe';
  subscriptions: Array<{ topic: string; type: string }>;
}

// Crypto Prices Topic
export interface CryptoPricePayload {
  symbol: string;
  timestamp: number;
  value: number;
}

// Activity Topic (Trades)
export interface TradePayload {
  asset: string;
  conditionId: string;
  eventSlug: string;
  outcome: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
}

// Comments Topic
export interface CommentPayload {
  id: string;
  body: string;
  parentEntityID: number;
  parentEntityType: string;
  userAddress: string;
  createdAt: string;
}

// ============================================================================
// CLOB Market WebSocket Types - wss://ws-subscriptions-clob.polymarket.com/ws/market
// ============================================================================

/**
 * CLOB Market subscription message
 */
export interface CLOBMarketSubscription {
  auth?: {
    apiKey: string;
    secret: string;
    passphrase: string;
  };
  assets_ids: string[]; // Token IDs to subscribe to
  type: 'MARKET';
}

/**
 * CLOB message event types
 */
export type CLOBEventType = 'book' | 'trade' | 'price_change' | 'last_trade_price';

/**
 * Order book update
 */
export interface CLOBBookUpdate {
  event_type: 'book';
  asset_id: string;
  market?: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: number;
  hash?: string;
}

/**
 * Trade execution
 */
export interface CLOBTradeUpdate {
  event_type: 'trade';
  asset_id: string;
  market?: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: number;
  order_id?: string;
}

/**
 * Price change update
 */
export interface CLOBPriceChangeUpdate {
  event_type: 'price_change';
  asset_id: string;
  price: number;
  best_bid?: number;
  best_ask?: number;
  timestamp: number;
}

/**
 * Last trade price update
 */
export interface CLOBLastTradePrice {
  event_type: 'last_trade_price';
  asset_id: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
}

export type CLOBMarketMessage =
  | CLOBBookUpdate
  | CLOBTradeUpdate
  | CLOBPriceChangeUpdate
  | CLOBLastTradePrice;

// ============================================================================
// Connection State Types
// ============================================================================

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: number | null;
  reconnectAttempts: number;
}

export interface WebSocketConfig {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  debug?: boolean;
}

// ============================================================================
// Real-time Market Data State
// ============================================================================

/**
 * Real-time price data for a market token
 */
export interface TokenPrice {
  tokenId: string;
  price: number;
  bestBid?: number;
  bestAsk?: number;
  lastUpdate: number;
}

/**
 * Map of token IDs to their current prices
 */
export type TokenPriceMap = Map<string, TokenPrice>;

/**
 * Map of market IDs to token IDs for price lookups
 */
export type MarketTokenMap = Map<string, string[]>;
