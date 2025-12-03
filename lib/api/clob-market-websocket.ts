/**
 * CLOB Market WebSocket Client
 * Connects to wss://ws-subscriptions-clob.polymarket.com/ws/market
 * Provides real-time order book, trade, and price updates
 */

import {
  CLOBMarketSubscription,
  CLOBMarketMessage,
  ConnectionState,
  WebSocketConfig,
  TokenPrice,
  TokenPriceMap,
} from './realtime-types';

const CLOB_MARKET_WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

export class CLOBMarketWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState;
  private tokenPrices: TokenPriceMap = new Map();
  private subscribedTokens: Set<string> = new Set();

  // Callbacks
  private messageCallbacks: Set<(message: CLOBMarketMessage) => void> = new Set();
  private priceUpdateCallbacks: Set<(prices: TokenPriceMap) => void> = new Set();
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();

  // Reconnection
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 2000,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      debug: config.debug ?? false,
    };

    this.state = {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    };
  }

  /**
   * Connect to the CLOB Market WebSocket
   */
  async connect(tokenIds: string[]): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    if (this.state.connecting) {
      this.log('Connection already in progress');
      return;
    }

    this.updateState({ connecting: true, error: null });
    this.subscribedTokens = new Set(tokenIds);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(CLOB_MARKET_WS_URL);

        this.ws.onopen = () => {
          this.log('Connected to CLOB Market WebSocket');
          this.updateState({
            connected: true,
            connecting: false,
            lastConnected: Date.now(),
            reconnectAttempts: 0,
            error: null,
          });

          // Subscribe to tokens
          if (tokenIds.length > 0) {
            this.subscribeToTokens(tokenIds);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CLOBMarketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.log('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          this.log('WebSocket error:', error);
          this.updateState({
            error: 'Connection error',
            connected: false,
            connecting: false,
          });
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          this.log('WebSocket closed:', event.code, event.reason);
          this.updateState({
            connected: false,
            connecting: false,
            error: event.reason || 'Connection closed',
          });

          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && this.state.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect(Array.from(this.subscribedTokens));
          }
        };
      } catch (error) {
        this.updateState({
          connected: false,
          connecting: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateState({
      connected: false,
      connecting: false,
      reconnectAttempts: 0,
      error: null,
    });

    this.subscribedTokens.clear();
    this.tokenPrices.clear();
  }

  /**
   * Subscribe to token price updates
   */
  private subscribeToTokens(tokenIds: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscription: CLOBMarketSubscription = {
      assets_ids: tokenIds,
      type: 'MARKET',
    };

    this.log('Subscribing to tokens:', tokenIds);
    this.ws.send(JSON.stringify(subscription));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: CLOBMarketMessage): void {
    this.log('Received message:', message.event_type, message);

    // Update token prices
    const tokenId = message.asset_id;

    switch (message.event_type) {
      case 'price_change':
        this.updateTokenPrice(tokenId, {
          tokenId,
          price: message.price,
          bestBid: message.best_bid,
          bestAsk: message.best_ask,
          lastUpdate: message.timestamp,
        });
        break;

      case 'last_trade_price':
        this.updateTokenPrice(tokenId, {
          tokenId,
          price: message.price,
          lastUpdate: message.timestamp,
        });
        break;

      case 'trade':
        const tradePrice = parseFloat(message.price);
        this.updateTokenPrice(tokenId, {
          tokenId,
          price: tradePrice,
          lastUpdate: message.timestamp,
        });
        break;
    }

    // Notify message callbacks
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        this.log('Error in message callback:', error);
      }
    });
  }

  /**
   * Update token price and notify callbacks
   */
  private updateTokenPrice(tokenId: string, update: Partial<TokenPrice>): void {
    const existing = this.tokenPrices.get(tokenId);
    const updated: TokenPrice = {
      tokenId,
      price: update.price ?? existing?.price ?? 0,
      bestBid: update.bestBid ?? existing?.bestBid,
      bestAsk: update.bestAsk ?? existing?.bestAsk,
      lastUpdate: update.lastUpdate ?? Date.now(),
    };

    this.tokenPrices.set(tokenId, updated);

    // Notify price update callbacks
    this.priceUpdateCallbacks.forEach((callback) => {
      try {
        callback(this.tokenPrices);
      } catch (error) {
        this.log('Error in price update callback:', error);
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(tokenIds: string[]): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`);

    this.updateState({
      reconnectAttempts: this.state.reconnectAttempts + 1,
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect(tokenIds).catch((error) => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Update connection state and notify callbacks
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        this.log('Error in state change callback:', error);
      }
    });
  }

  /**
   * Register callback for messages
   */
  onMessage(callback: (message: CLOBMarketMessage) => void): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: (prices: TokenPriceMap) => void): () => void {
    this.priceUpdateCallbacks.add(callback);
    return () => this.priceUpdateCallbacks.delete(callback);
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Get current prices
   */
  getPrices(): TokenPriceMap {
    return new Map(this.tokenPrices);
  }

  /**
   * Get price for specific token
   */
  getPrice(tokenId: string): TokenPrice | null {
    return this.tokenPrices.get(tokenId) || null;
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CLOBMarketWS]', ...args);
    }
  }
}

// Singleton instance
export const clobMarketWS = new CLOBMarketWebSocket({ debug: true });
