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
 * Connection state for RTDS WebSocket
 */
export interface RTDSConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
  subscriptions?: string[];
}

/**
 * Market update data structure
 */
export interface RTDSMarketUpdate {
  market_id: string;
  question: string;
  description?: string;
  outcomes: Array<{
    outcome: string;
    price: number;
    probability: number;
  }>;
  volume?: string;
  liquidity?: string;
  end_time?: string;
  category?: string;
  image_url?: string;
  slug?: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  timestamp: number;
}

/**
 * Crypto price update data structure
 */
export interface RTDSCryptoPriceUpdate {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap?: number;
  timestamp: number;
}

/**
 * RTDS WebSocket configuration
 */
export interface RTDSWebSocketConfig {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  subscriptions?: RTDSSubscription[];
}

/**
 * RTDS subscription message
 */
export interface RTDSSubscriptionMessage {
  action: 'subscribe' | 'unsubscribe';
  topic: string;
  type?: string;
  filters?: Record<string, any>;
}

/**
 * RTDS market update message
 */
export interface RTDSMarketUpdateMessage extends RTDSMessage<RTDSMarketUpdate[]> {
  topic: 'markets';
  type: 'update';
  data: RTDSMarketUpdate[];
}

/**
 * RTDS crypto price message
 */
export interface RTDSCryptoPriceMessage extends RTDSMessage<RTDSCryptoPriceUpdate[]> {
  topic: 'crypto_prices';
  type: 'update';
  data: RTDSCryptoPriceUpdate[];
}

/**
 * RTDS heartbeat message
 */
export interface RTDSHeartbeatMessage extends RTDSMessage<null> {
  topic: 'heartbeat';
  type: 'ping';
}

/**
 * RTDS error message
 */
export interface RTDSErrorMessage extends RTDSMessage<{ error: string; code?: string }> {
  topic: 'error';
  type: 'error';
}

/**
 * RTDS data state
 */
export interface RTDSDataState {
  markets: Record<string, RTDSMarketUpdate>;
  cryptoPrices: Record<string, RTDSCryptoPriceUpdate>;
  lastUpdated: number;
  lastMarketUpdate?: number;
  lastCryptoUpdate?: number;
}

/**
 * Token price information
 */
export interface TokenPrice {
  token_id: string;
  price: string;
  best_bid?: string;
  best_ask?: string;
  timestamp: number;
}

/**
 * Map of token IDs to their current prices
 */
export type TokenPriceMap = Map<string, TokenPrice>;

/**
 * Map of market IDs to token IDs for price lookups
 */
export type MarketTokenMap = Map<string, string[]>;
