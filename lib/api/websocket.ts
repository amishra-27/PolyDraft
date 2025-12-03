// Polymarket Real-Time WebSocket Types
// Based on: https://github.com/Polymarket/real-time-data-client

// Base message structure
export interface BaseMessage<T = any> {
  topic: string;
  type: string;
  payload: T;
}

// Subscription structure
export interface Subscription {
  topic: string;
  type: string;
  filters?: string; // JSON string of filter object
  clob_auth?: {
    key: string;
    secret: string;
    passphrase: string;
  };
}

export interface SubscribeMessage {
  type: 'subscribe';
  subscriptions: Subscription[];
}

export interface UnsubscribeMessage {
  type: 'unsubscribe';
  subscriptions: Subscription[];
}

// Activity topic (trades)
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

// CLOB Market topic
export interface PriceChangePayload {
  asset_id: string;
  price: number;
  side: 'BUY' | 'SELL';
  size: number;
  best_bid?: number;
  best_ask?: number;
  timestamp: number;
}

export interface OrderBookPayload {
  asset_id: string;
  market: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: number;
  hash: string;
}

export interface LastTradePricePayload {
  asset_id: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
}

// Crypto Prices topic
export interface CryptoPricePayload {
  symbol: string;
  timestamp: number;
  value: number;
}

// Comments topic
export interface CommentPayload {
  id: string;
  body: string;
  parentEntityID: number;
  parentEntityType: string;
  userAddress: string;
  createdAt: string;
}

// Message type unions
export type ActivityMessage = BaseMessage<TradePayload>;
export type ClobMarketMessage = BaseMessage<PriceChangePayload | OrderBookPayload | LastTradePricePayload>;
export type CryptoPriceMessage = BaseMessage<CryptoPricePayload>;
export type CommentMessage = BaseMessage<CommentPayload>;

export type WebSocketMessage =
  | ActivityMessage
  | ClobMarketMessage
  | CryptoPriceMessage
  | CommentMessage
  | SubscribeMessage
  | UnsubscribeMessage;

// Connection state
export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: number | null;
  reconnectAttempts: number;
}

// WebSocket config
export interface WebSocketConfig {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  maxReconnectDelay?: number;
  enableHeartbeat?: boolean;
}

// Data state for storing updates
export interface DataState {
  trades: Map<string, TradePayload>;
  orderBooks: Map<string, OrderBookPayload>;
  prices: Map<string, PriceChangePayload>;
  cryptoPrices: Map<string, CryptoPricePayload>;
  lastUpdate: number | null;
}

// Token to market mapping (for legacy CLOB compatibility)
export interface TokenMarketMapping {
  [tokenId: string]: string[];
}

// Legacy CLOB types (deprecated, use real-time client format instead)
export interface CLOBTokenPrice {
  token_id: string;
  price: number;
  timestamp: number;
}

export interface CLOBPriceUpdate {
  type: 'price_update';
  data: CLOBTokenPrice[];
}

export interface CLOBSubscriptionMessage {
  type: 'subscribe';
  product_ids: string[];
}

export interface CLOBUnsubscribeMessage {
  type: 'unsubscribe';
  product_ids?: string[];
}

export interface CLOBErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

export type CLOBMessage = CLOBPriceUpdate | CLOBSubscriptionMessage | CLOBUnsubscribeMessage | CLOBErrorMessage;

export interface CLOBConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: number | null;
  reconnectAttempts: number;
}

export interface CLOBWebSocketConfig {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  maxReconnectDelay?: number;
}
