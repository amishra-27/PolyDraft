import {
  RTDSMessage,
  RTDSMarketUpdate,
  RTDSCryptoPriceUpdate,
  RTDSConnectionState,
  RTDSWebSocketConfig,
  RTDSSubscriptionMessage,
  RTDSDataState,
  RTDSMarketUpdateMessage,
  RTDSCryptoPriceMessage,
  RTDSErrorMessage,
  RTDSHeartbeatMessage
} from './rtds-websocket';

export class RTDSWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<RTDSWebSocketConfig>;
  private state: RTDSConnectionState;
  private dataState: RTDSDataState;
  private marketUpdateCallbacks: Set<(updates: RTDSMarketUpdate[]) => void> = new Set();
  private cryptoPriceCallbacks: Set<(prices: RTDSCryptoPriceUpdate[]) => void> = new Set();
  private stateChangeCallbacks: Set<(state: RTDSConnectionState) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;

  constructor(config: RTDSWebSocketConfig = {}) {
    this.config = {
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 2000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      maxReconnectDelay: config.maxReconnectDelay || 60000,
      enableHeartbeat: config.enableHeartbeat !== false,
    };

    this.state = {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
      subscriptions: new Set(),
    };

    this.dataState = {
      markets: new Map(),
      cryptoPrices: new Map(),
      lastMarketUpdate: null,
      lastCryptoUpdate: null,
    };
  }

  // Connect to RTDS WebSocket
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.state.connecting) {
        const checkConnection = () => {
          if (this.state.connected) {
            resolve();
          } else if (!this.state.connecting) {
            reject(new Error(this.state.error || 'Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.setState({ connecting: true, error: null });

      try {
        this.ws = new WebSocket('wss://ws-live-data.polymarket.com');

        this.ws.onopen = () => {
          console.log('RTDS WebSocket connected');
          this.setState({
            connected: true,
            connecting: false,
            error: null,
            lastConnected: Date.now(),
            reconnectAttempts: 0,
          });

          // Start heartbeat if enabled
          if (this.config.enableHeartbeat) {
            this.startHeartbeat();
          }

          // Resubscribe to previous subscriptions
          if (this.state.subscriptions.size > 0) {
            this.subscribe(Array.from(this.state.subscriptions));
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RTDSMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse RTDS WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('RTDS WebSocket disconnected:', event.code, event.reason);
          this.setState({
            connected: false,
            connecting: false,
            error: event.reason || 'Connection closed',
          });

          this.stopHeartbeat();

          // Attempt reconnection if not explicitly closed
          if (event.code !== 1000 && this.state.reconnectAttempts < this.config.reconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('RTDS WebSocket error:', error);
          this.setState({
            connected: false,
            connecting: false,
            error: 'WebSocket connection error',
          });
          reject(new Error('WebSocket connection error'));
        };
      } catch (error) {
        this.setState({
          connected: false,
          connecting: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setState({
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
      subscriptions: new Set(),
    });

    // Clear data state
    this.dataState = {
      markets: new Map(),
      cryptoPrices: new Map(),
      lastMarketUpdate: null,
      lastCryptoUpdate: null,
    };
  }

  // Subscribe to RTDS channels
  public subscribe(channels: string[], filters?: any): void {
    if (!this.state.connected) {
      console.warn('Cannot subscribe: RTDS WebSocket not connected');
      return;
    }

    channels.forEach(channel => this.state.subscriptions.add(channel));

    const message: RTDSSubscriptionMessage = {
      type: 'subscribe',
      channels: channels as ('markets' | 'crypto_prices')[],
      filters,
    };

    this.sendMessage(message);
  }

  // Unsubscribe from RTDS channels
  public unsubscribe(channels?: string[]): void {
    if (!this.state.connected) {
      return;
    }

    let channelsToUnsubscribe: string[];
    
    if (channels) {
      channelsToUnsubscribe = channels.filter(ch => this.state.subscriptions.has(ch));
      channelsToUnsubscribe.forEach(ch => this.state.subscriptions.delete(ch));
    } else {
      // Unsubscribe from all
      channelsToUnsubscribe = Array.from(this.state.subscriptions);
      this.state.subscriptions.clear();
    }

    if (channelsToUnsubscribe.length === 0) return;

    const message = {
      type: 'unsubscribe',
      channels: channelsToUnsubscribe,
    };

    this.sendMessage(message);
  }

  // Get current connection state
  public getState(): RTDSConnectionState {
    return { 
      ...this.state,
      subscriptions: new Set(this.state.subscriptions)
    };
  }

  // Get current data state
  public getDataState(): RTDSDataState {
    return {
      markets: new Map(this.dataState.markets),
      cryptoPrices: new Map(this.dataState.cryptoPrices),
      lastMarketUpdate: this.dataState.lastMarketUpdate,
      lastCryptoUpdate: this.dataState.lastCryptoUpdate,
    };
  }

  // Get market update by ID
  public getMarketUpdate(marketId: string): RTDSMarketUpdate | null {
    return this.dataState.markets.get(marketId) || null;
  }

  // Get crypto price by symbol
  public getCryptoPrice(symbol: string): RTDSCryptoPriceUpdate | null {
    return this.dataState.cryptoPrices.get(symbol.toLowerCase()) || null;
  }

  // Get all market updates
  public getAllMarketUpdates(): RTDSMarketUpdate[] {
    return Array.from(this.dataState.markets.values());
  }

  // Get all crypto prices
  public getAllCryptoPrices(): RTDSCryptoPriceUpdate[] {
    return Array.from(this.dataState.cryptoPrices.values());
  }

  // Register callback for market updates
  public onMarketUpdate(callback: (updates: RTDSMarketUpdate[]) => void): () => void {
    this.marketUpdateCallbacks.add(callback);
    return () => this.marketUpdateCallbacks.delete(callback);
  }

  // Register callback for crypto price updates
  public onCryptoPriceUpdate(callback: (prices: RTDSCryptoPriceUpdate[]) => void): () => void {
    this.cryptoPriceCallbacks.add(callback);
    return () => this.cryptoPriceCallbacks.delete(callback);
  }

  // Register callback for connection state changes
  public onStateChange(callback: (state: RTDSConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  // Private methods
  private setState(updates: Partial<RTDSConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach(callback => callback(this.getState()));
  }

  private setDataState(updates: Partial<RTDSDataState>): void {
    this.dataState = { ...this.dataState, ...updates };
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: RTDS WebSocket not connected');
    }
  }

  private handleMessage(message: RTDSMessage): void {
    switch (message.type) {
      case 'market_update':
        this.handleMarketUpdate(message);
        break;
      case 'crypto_price_update':
        this.handleCryptoPriceUpdate(message);
        break;
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      default:
        console.warn('Unknown RTDS WebSocket message type:', (message as any).type);
    }
  }

  private handleMarketUpdate(message: RTDSMarketUpdateMessage): void {
    const updates = message.data;
    
    // Update data state
    updates.forEach(update => {
      this.dataState.markets.set(update.market_id, update);
    });
    
    this.setDataState({
      markets: this.dataState.markets,
      lastMarketUpdate: Date.now(),
    });

    // Notify callbacks
    this.marketUpdateCallbacks.forEach(callback => {
      try {
        callback(updates);
      } catch (error) {
        console.error('Error in market update callback:', error);
      }
    });
  }

  private handleCryptoPriceUpdate(message: RTDSCryptoPriceMessage): void {
    const prices = message.data;
    
    // Update data state
    prices.forEach(price => {
      this.dataState.cryptoPrices.set(price.symbol.toLowerCase(), price);
    });
    
    this.setDataState({
      cryptoPrices: this.dataState.cryptoPrices,
      lastCryptoUpdate: Date.now(),
    });

    // Notify callbacks
    this.cryptoPriceCallbacks.forEach(callback => {
      try {
        callback(prices);
      } catch (error) {
        console.error('Error in crypto price callback:', error);
      }
    });
  }

  private handleHeartbeat(message: RTDSHeartbeatMessage): void {
    // Reset heartbeat timeout
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = setTimeout(() => {
        console.warn('RTDS WebSocket heartbeat timeout');
        this.setState({ error: 'Heartbeat timeout' });
      }, this.config.heartbeatInterval * 2);
    }
  }

  private handleError(message: RTDSErrorMessage): void {
    console.error('RTDS WebSocket error:', message.message, message.details);
    this.setState({ error: message.message });
  }

  private startHeartbeat(): void {
    if (!this.config.enableHeartbeat) return;

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        
        // Set timeout for response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('RTDS WebSocket heartbeat timeout');
          this.setState({ error: 'Heartbeat timeout' });
        }, this.config.heartbeatInterval * 2);
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    console.log(`Scheduling RTDS reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`);
    
    this.setState({ 
      reconnectAttempts: this.state.reconnectAttempts + 1,
      error: `Reconnecting... (${this.state.reconnectAttempts + 1}/${this.config.reconnectAttempts})`
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('RTDS reconnection failed:', error);
      });
    }, delay);
  }
}

// Singleton instance
export const rtdsWebSocketClient = new RTDSWebSocketClient({
  reconnectAttempts: 5,
  reconnectDelay: 2000,
  heartbeatInterval: 30000,
  maxReconnectDelay: 60000,
  enableHeartbeat: true,
});