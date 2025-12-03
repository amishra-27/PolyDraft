/**
 * RTDS (Real-Time Data Socket) WebSocket Client
 * Connects to wss://ws-live-data.polymarket.com
 * Provides real-time crypto prices, trades, and activity updates
 */

import {
  RTDSMessage,
  RTDSSubscribeMessage,
  RTDSUnsubscribeMessage,
  CryptoPricePayload,
  TradePayload,
  CommentPayload,
  ConnectionState,
  WebSocketConfig,
} from './realtime-types';

const RTDS_WS_URL = 'wss://ws-live-data.polymarket.com';

type RTDSTopic = 'crypto_prices' | 'activity' | 'comments';

export class RTDSWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState;
  private subscribedTopics: Set<RTDSTopic> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  // Data storage
  private cryptoPrices: Map<string, CryptoPricePayload> = new Map();
  private recentTrades: TradePayload[] = [];
  private recentComments: CommentPayload[] = [];

  // Callbacks
  private messageCallbacks: Set<(message: RTDSMessage) => void> = new Set();
  private cryptoPriceCallbacks: Set<(price: CryptoPricePayload) => void> = new Set();
  private tradeCallbacks: Set<(trade: TradePayload) => void> = new Set();
  private commentCallbacks: Set<(comment: CommentPayload) => void> = new Set();
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
   * Connect to the RTDS WebSocket
   */
  async connect(topics: RTDSTopic[] = []): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      if (topics.length > 0) {
        this.subscribe(topics);
      }
      return;
    }

    if (this.state.connecting) {
      this.log('Connection already in progress');
      return;
    }

    this.updateState({ connecting: true, error: null });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(RTDS_WS_URL);

        this.ws.onopen = () => {
          this.log('Connected to RTDS WebSocket');
          this.updateState({
            connected: true,
            connecting: false,
            lastConnected: Date.now(),
            reconnectAttempts: 0,
            error: null,
          });

          // Start ping interval to keep connection alive
          this.startPing();

          // Subscribe to requested topics
          if (topics.length > 0) {
            this.subscribe(topics);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RTDSMessage = JSON.parse(event.data);
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
          this.stopPing();
          this.updateState({
            connected: false,
            connecting: false,
            error: event.reason || 'Connection closed',
          });

          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && this.state.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect(Array.from(this.subscribedTopics));
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

    this.stopPing();

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

    this.subscribedTopics.clear();
  }

  /**
   * Subscribe to topics
   */
  subscribe(topics: RTDSTopic[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscriptions = topics.map((topic) => ({
      topic,
      type: 'subscribe',
    }));

    const message: RTDSSubscribeMessage = {
      action: 'subscribe',
      subscriptions,
    };

    this.log('Subscribing to topics:', topics);
    this.ws.send(JSON.stringify(message));

    topics.forEach((topic) => this.subscribedTopics.add(topic));
  }

  /**
   * Unsubscribe from topics
   */
  unsubscribe(topics: RTDSTopic[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('Cannot unsubscribe: WebSocket not connected');
      return;
    }

    const subscriptions = topics.map((topic) => ({
      topic,
      type: 'unsubscribe',
    }));

    const message: RTDSUnsubscribeMessage = {
      action: 'unsubscribe',
      subscriptions,
    };

    this.log('Unsubscribing from topics:', topics);
    this.ws.send(JSON.stringify(message));

    topics.forEach((topic) => this.subscribedTopics.delete(topic));
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: RTDSMessage): void {
    this.log('Received message:', message.topic, message.type);

    // Notify all message callbacks
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        this.log('Error in message callback:', error);
      }
    });

    // Handle specific topics
    switch (message.topic) {
      case 'crypto_prices':
        this.handleCryptoPrice(message.payload as CryptoPricePayload);
        break;

      case 'activity':
        this.handleTrade(message.payload as TradePayload);
        break;

      case 'comments':
        this.handleComment(message.payload as CommentPayload);
        break;
    }
  }

  /**
   * Handle crypto price updates
   */
  private handleCryptoPrice(price: CryptoPricePayload): void {
    this.cryptoPrices.set(price.symbol.toLowerCase(), price);

    this.cryptoPriceCallbacks.forEach((callback) => {
      try {
        callback(price);
      } catch (error) {
        this.log('Error in crypto price callback:', error);
      }
    });
  }

  /**
   * Handle trade updates
   */
  private handleTrade(trade: TradePayload): void {
    this.recentTrades.unshift(trade);
    if (this.recentTrades.length > 100) {
      this.recentTrades = this.recentTrades.slice(0, 100);
    }

    this.tradeCallbacks.forEach((callback) => {
      try {
        callback(trade);
      } catch (error) {
        this.log('Error in trade callback:', error);
      }
    });
  }

  /**
   * Handle comment updates
   */
  private handleComment(comment: CommentPayload): void {
    this.recentComments.unshift(comment);
    if (this.recentComments.length > 50) {
      this.recentComments = this.recentComments.slice(0, 50);
    }

    this.commentCallbacks.forEach((callback) => {
      try {
        callback(comment);
      } catch (error) {
        this.log('Error in comment callback:', error);
      }
    });
  }

  /**
   * Start ping interval
   */
  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('PING');
        this.log('Sent PING');
      }
    }, 5000); // Ping every 5 seconds as per docs
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(topics: RTDSTopic[]): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`);

    this.updateState({
      reconnectAttempts: this.state.reconnectAttempts + 1,
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect(topics).catch((error) => {
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
   * Register callback for all messages
   */
  onMessage(callback: (message: RTDSMessage) => void): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  /**
   * Register callback for crypto prices
   */
  onCryptoPrice(callback: (price: CryptoPricePayload) => void): () => void {
    this.cryptoPriceCallbacks.add(callback);
    return () => this.cryptoPriceCallbacks.delete(callback);
  }

  /**
   * Register callback for trades
   */
  onTrade(callback: (trade: TradePayload) => void): () => void {
    this.tradeCallbacks.add(callback);
    return () => this.tradeCallbacks.delete(callback);
  }

  /**
   * Register callback for comments
   */
  onComment(callback: (comment: CommentPayload) => void): () => void {
    this.commentCallbacks.add(callback);
    return () => this.commentCallbacks.delete(callback);
  }

  /**
   * Register callback for state changes
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Get crypto prices
   */
  getCryptoPrices(): Map<string, CryptoPricePayload> {
    return new Map(this.cryptoPrices);
  }

  /**
   * Get crypto price for symbol
   */
  getCryptoPrice(symbol: string): CryptoPricePayload | null {
    return this.cryptoPrices.get(symbol.toLowerCase()) || null;
  }

  /**
   * Get recent trades
   */
  getRecentTrades(): TradePayload[] {
    return [...this.recentTrades];
  }

  /**
   * Get recent comments
   */
  getRecentComments(): CommentPayload[] {
    return [...this.recentComments];
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
      console.log('[RTDS]', ...args);
    }
  }
}

// Singleton instance
export const rtdsWS = new RTDSWebSocket({ debug: true });
