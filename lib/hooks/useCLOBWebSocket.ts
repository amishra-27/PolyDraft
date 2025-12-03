'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clobWebSocketClient } from '@/lib/api/clob-websocket';
import { CLOBTokenPrice, CLOBConnectionState } from '@/lib/api/websocket';
import { PolymarketMarket } from '@/lib/api/types';

interface UseCLOBWebSocketOptions {
  autoConnect?: boolean;
  markets?: PolymarketMarket[];
  reconnectOnVisibilityChange?: boolean;
}

interface UseCLOBWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  livePrices: Map<string, number>;
  lastUpdate: number | null;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (tokenIds: string[]) => void;
  unsubscribe: (tokenIds?: string[]) => void;
  getPriceForMarket: (marketId: string) => number | null;
}

// Cache for live prices
const livePricesCache = new Map<string, number>();

export function useCLOBWebSocket({
  autoConnect = false, // Disable auto-connect to prevent errors
  markets = [],
  reconnectOnVisibilityChange = true,
}: UseCLOBWebSocketOptions = {}): UseCLOBWebSocketReturn {
  const [connectionState, setConnectionState] = useState<CLOBConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });
  
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  
  const priceUpdateCallbackRef = useRef<((prices: CLOBTokenPrice[]) => void) | null>(null);
  const stateChangeCallbackRef = useRef<((state: CLOBConnectionState) => void) | null>(null);
  const tokenMarketMapRef = useRef<Map<string, string[]>>(new Map());

  // Extract token IDs from markets and create mapping
  const extractTokenIds = useCallback((markets: PolymarketMarket[]) => {
    const tokenIds: string[] = [];
    const tokenMarketMap = new Map<string, string[]>();

    markets.forEach(market => {
      if (market.clobTokenIds) {
        const tokens = market.clobTokenIds.split(',');
        tokens.forEach(tokenId => {
          const trimmedTokenId = tokenId.trim();
          if (trimmedTokenId) {
            tokenIds.push(trimmedTokenId);
            
            // Map token ID to market ID for price updates
            if (!tokenMarketMap.has(trimmedTokenId)) {
              tokenMarketMap.set(trimmedTokenId, []);
            }
            tokenMarketMap.get(trimmedTokenId)!.push(market.id);
          }
        });
      }
    });

    tokenMarketMapRef.current = tokenMarketMap;
    return tokenIds;
  }, []);

  // Handle price updates
  const handlePriceUpdate = useCallback((prices: CLOBTokenPrice[]) => {
    const updatedPrices = new Map(livePrices);
    let hasUpdates = false;

    prices.forEach(price => {
      const oldPrice = livePricesCache.get(price.token_id);
      const newPrice = price.price;

      // Only update if price changed significantly (to avoid excessive re-renders)
      if (!oldPrice || Math.abs(oldPrice - newPrice) > 0.001) {
        livePricesCache.set(price.token_id, newPrice);
        
        // Update prices for all markets that use this token
        const marketIds = tokenMarketMapRef.current.get(price.token_id) || [];
        marketIds.forEach(marketId => {
          updatedPrices.set(marketId, newPrice);
          hasUpdates = true;
        });
      }
    });

    if (hasUpdates) {
      setLivePrices(updatedPrices);
      setLastUpdate(Date.now());
    }
  }, [livePrices]);

  // Handle connection state changes
  const handleStateChange = useCallback((state: CLOBConnectionState) => {
    setConnectionState(state);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await clobWebSocketClient.connect();
    } catch (error) {
      console.error('Failed to connect to CLOB WebSocket:', error);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clobWebSocketClient.disconnect();
  }, []);

  // Subscribe to token updates
  const subscribe = useCallback((tokenIds: string[]) => {
    clobWebSocketClient.subscribe(tokenIds);
  }, []);

  // Unsubscribe from token updates
  const unsubscribe = useCallback((tokenIds?: string[]) => {
    clobWebSocketClient.unsubscribe(tokenIds);
  }, []);

  // Get price for a specific market
  const getPriceForMarket = useCallback((marketId: string): number | null => {
    return livePrices.get(marketId) || null;
  }, [livePrices]);

  // Initialize connection and callbacks
  useEffect(() => {
    // Register callbacks
    priceUpdateCallbackRef.current = handlePriceUpdate;
    stateChangeCallbackRef.current = handleStateChange;

    const unsubscribePriceUpdate = clobWebSocketClient.onPriceUpdate(handlePriceUpdate);
    const unsubscribeStateChange = clobWebSocketClient.onStateChange(handleStateChange);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      unsubscribePriceUpdate();
      unsubscribeStateChange();
    };
  }, [autoConnect, connect, handlePriceUpdate, handleStateChange]);

  // Subscribe to market tokens when markets change
  useEffect(() => {
    if (connectionState.connected && markets.length > 0) {
      const tokenIds = extractTokenIds(markets);
      if (tokenIds.length > 0) {
        subscribe(tokenIds);
      }
    }
  }, [connectionState.connected, markets, extractTokenIds, subscribe]);

  // Handle visibility change for reconnection
  useEffect(() => {
    if (!reconnectOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connectionState.connected) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reconnectOnVisibilityChange, connectionState.connected, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected: connectionState.connected,
    connecting: connectionState.connecting,
    error: connectionState.error,
    livePrices,
    lastUpdate,
    reconnectAttempts: connectionState.reconnectAttempts,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getPriceForMarket,
  };
}

// Hook for live market prices with automatic subscription
export function useLiveMarketPrices(markets: PolymarketMarket[]) {
  const {
    connected,
    connecting,
    error,
    livePrices,
    lastUpdate,
    getPriceForMarket,
  } = useCLOBWebSocket({
    autoConnect: false, // Disable to prevent connection errors
    markets,
    reconnectOnVisibilityChange: true,
  });

  // Get enhanced market data with live prices
  const getMarketWithLivePrice = useCallback((market: PolymarketMarket) => {
    const livePrice = getPriceForMarket(market.id);
    
    if (livePrice !== null) {
      // Update the market's outcome prices with live data
      const updatedMarket = { ...market };
      
      // For binary markets, update the YES price
      if (market.outcomes?.length === 2 && market.outcomePrices) {
        const prices = market.outcomePrices.split(',').map(p => parseFloat(p.trim()));
        if (prices.length >= 1) {
          prices[0] = livePrice; // Update YES price
          prices[1] = 1 - livePrice; // Update NO price to maintain sum = 1
          updatedMarket.outcomePrices = prices.map(p => p.toFixed(3)).join(',');
        }
      }
      
      return updatedMarket;
    }
    
    return market;
  }, [getPriceForMarket]);

  return {
    connected,
    connecting,
    error,
    livePrices,
    lastUpdate,
    getPriceForMarket,
    getMarketWithLivePrice,
  };
}