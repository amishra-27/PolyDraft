import { 
  CLOBMessage, 
  CLOBTokenPrice, 
  CLOBConnectionState, 
  CLOBWebSocketConfig,
  CLOBSubscriptionMessage,
  TokenMarketMapping
} from './websocket';

export class CLOBWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<CLOBWebSocketConfig>;
  private state: CLOBConnectionState;
  private subscriptions: Set<string> = new Set();
  private priceUpdateCallbacks: Set<(prices: CLOBTokenPrice[]) => void> = new Set();
  private stateChangeCallbacks: Set<(state: CLOBConnectionState) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private tokenMarketMap: TokenMarketMapping = {};

  constructor(config: CLOBWebSocketConfig = {}) {
    this.config = {
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      maxReconnectDelay: config.maxReconnectDelay || 30000,
    };

    this.state = {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    };
  }

  // Connect to CLOB WebSocket
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.state.connecting) {
        // Wait for existing connection
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
        // Use WebSocket URL with proper error handling
        const wsUrl = 'wss://ws-subscriptions-clob.polymarket.com/ws';
        console.log('Connecting to CLOB WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('CLOB WebSocket connected');
          this.setState({
            connected: true,
            connecting: false,
            error: null,
            lastConnected: Date.now(),
            reconnectAttempts: 0,
          });

          // Start heartbeat
          this.startHeartbeat();

          // Resubscribe to previous subscriptions
          if (this.subscriptions.size > 0) {
            this.subscribe(Array.from(this.subscriptions));
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: CLOBMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse CLOB WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('CLOB WebSocket disconnected:', event.code, event.reason);
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
          console.error('CLOB WebSocket error:', error);
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
    });

    this.subscriptions.clear();
  }

  // Subscribe to token price updates
  public subscribe(tokenIds: string[]): void {
    if (!this.state.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const newSubscriptions = tokenIds.filter(id => !this.subscriptions.has(id));
    if (newSubscriptions.length === 0) return;

    newSubscriptions.forEach(id => this.subscriptions.add(id));

    const message: CLOBSubscriptionMessage = {
      type: 'subscribe',
      product_ids: newSubscriptions,
    };

    this.sendMessage(message);
  }

  // Unsubscribe from token price updates
  public unsubscribe(tokenIds?: string[]): void {
    if (!this.state.connected) {
      return;
    }

    let idsToUnsubscribe: string[];
    
    if (tokenIds) {
      idsToUnsubscribe = tokenIds.filter(id => this.subscriptions.has(id));
      idsToUnsubscribe.forEach(id => this.subscriptions.delete(id));
    } else {
      // Unsubscribe from all
      idsToUnsubscribe = Array.from(this.subscriptions);
      this.subscriptions.clear();
    }

    if (idsToUnsubscribe.length === 0) return;

    const message = {
      type: 'unsubscribe',
      product_ids: idsToUnsubscribe,
    };

    this.sendMessage(message);
  }

  // Get current connection state
  public getState(): CLOBConnectionState {
    return { ...this.state };
  }

  // Get current subscriptions
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  // Register callback for price updates
  public onPriceUpdate(callback: (prices: CLOBTokenPrice[]) => void): () => void {
    this.priceUpdateCallbacks.add(callback);
    return () => this.priceUpdateCallbacks.delete(callback);
  }

  // Register callback for connection state changes
  public onStateChange(callback: (state: CLOBConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  // Set token to market mapping for price updates
  public setTokenMarketMapping(mapping: TokenMarketMapping): void {
    this.tokenMarketMap = mapping;
  }

  // Private methods
  private setState(updates: Partial<CLOBConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private handleMessage(message: CLOBMessage): void {
    switch (message.type) {
      case 'price_update':
        this.handlePriceUpdate(message.data);
        break;
      case 'error':
        console.error('CLOB WebSocket error:', message.message);
        this.setState({ error: message.message });
        break;
      default:
        console.warn('Unknown CLOB WebSocket message type:', (message as any).type);
    }
  }

  private handlePriceUpdate(prices: CLOBTokenPrice[]): void {
    // Notify all callbacks
    this.priceUpdateCallbacks.forEach(callback => {
      try {
        callback(prices);
      } catch (error) {
        console.error('Error in price update callback:', error);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts),
      this.config.maxReconnectDelay
    );

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts + 1})`);
    
    this.setState({ 
      reconnectAttempts: this.state.reconnectAttempts + 1,
      error: `Reconnecting... (${this.state.reconnectAttempts + 1}/${this.config.reconnectAttempts})`
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}

// Singleton instance
export const clobWebSocketClient = new CLOBWebSocketClient({
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  maxReconnectDelay: 30000,
});