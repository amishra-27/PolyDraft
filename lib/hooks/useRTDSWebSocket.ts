'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { rtdsWebSocketClient } from '@/lib/api/rtds-websocket-client';
import { 
  RTDSConnectionState, 
  RTDSDataState, 
  RTDSMarketUpdate, 
  RTDSCryptoPriceUpdate,
  RTDSWebSocketConfig 
} from '@/lib/api/rtds-websocket';
import { PolymarketMarket } from '@/lib/api/types';

interface UseRTDSWebSocketOptions {
  autoConnect?: boolean;
  autoSubscribe?: boolean;
  channels?: ('markets' | 'crypto_prices')[];
  filters?: {
    categories?: string[];
    active_only?: boolean;
    symbols?: string[];
  };
  reconnectOnVisibilityChange?: boolean;
  config?: RTDSWebSocketConfig;
}

interface UseRTDSWebSocketReturn {
  // Connection state
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  subscriptions: Set<string>;
  
  // Data state
  marketUpdates: Map<string, RTDSMarketUpdate>;
  cryptoPrices: Map<string, RTDSCryptoPriceUpdate>;
  lastMarketUpdate: number | null;
  lastCryptoUpdate: number | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: (channels: string[], filters?: any) => void;
  unsubscribe: (channels?: string[]) => void;
  
  // Data getters
  getMarketUpdate: (marketId: string) => RTDSMarketUpdate | null;
  getCryptoPrice: (symbol: string) => RTDSCryptoPriceUpdate | null;
  getAllMarketUpdates: () => RTDSMarketUpdate[];
  getAllCryptoPrices: () => RTDSCryptoPriceUpdate[];
  
  // Synchronization helpers
  getMarketWithRTDSData: (market: PolymarketMarket) => PolymarketMarket;
  getMarketsWithRTDSData: (markets: PolymarketMarket[]) => PolymarketMarket[];
}

// Cache for RTDS data
const rtdsDataCache = {
  markets: new Map<string, RTDSMarketUpdate>(),
  cryptoPrices: new Map<string, RTDSCryptoPriceUpdate>(),
};

export function useRTDSWebSocket({
  autoConnect = false, // Disable auto-connect to prevent errors
  autoSubscribe = true,
  channels = ['markets', 'crypto_prices'],
  filters,
  reconnectOnVisibilityChange = true,
  config,
}: UseRTDSWebSocketOptions = {}): UseRTDSWebSocketReturn {
  const [connectionState, setConnectionState] = useState<RTDSConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
    subscriptions: new Set(),
  });
  
  const [dataState, setDataState] = useState<RTDSDataState>({
    markets: new Map(),
    cryptoPrices: new Map(),
    lastMarketUpdate: null,
    lastCryptoUpdate: null,
  });

  const marketUpdateCallbackRef = useRef<((updates: RTDSMarketUpdate[]) => void) | null>(null);
  const cryptoPriceCallbackRef = useRef<((prices: RTDSCryptoPriceUpdate[]) => void) | null>(null);
  const stateChangeCallbackRef = useRef<((state: RTDSConnectionState) => void) | null>(null);

  // Handle market updates
  const handleMarketUpdate = useCallback((updates: RTDSMarketUpdate[]) => {
    const updatedMarkets = new Map(dataState.markets);
    
    updates.forEach(update => {
      updatedMarkets.set(update.market_id, update);
      rtdsDataCache.markets.set(update.market_id, update);
    });

    setDataState(prev => ({
      ...prev,
      markets: updatedMarkets,
      lastMarketUpdate: Date.now(),
    }));
  }, [dataState.markets]);

  // Handle crypto price updates
  const handleCryptoPriceUpdate = useCallback((prices: RTDSCryptoPriceUpdate[]) => {
    const updatedPrices = new Map(dataState.cryptoPrices);
    
    prices.forEach(price => {
      updatedPrices.set(price.symbol.toLowerCase(), price);
      rtdsDataCache.cryptoPrices.set(price.symbol.toLowerCase(), price);
    });

    setDataState(prev => ({
      ...prev,
      cryptoPrices: updatedPrices,
      lastCryptoUpdate: Date.now(),
    }));
  }, [dataState.cryptoPrices]);

  // Handle connection state changes
  const handleStateChange = useCallback((state: RTDSConnectionState) => {
    setConnectionState(state);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      await rtdsWebSocketClient.connect();
    } catch (error) {
      console.error('Failed to connect to RTDS WebSocket:', error);
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    rtdsWebSocketClient.disconnect();
  }, []);

  // Subscribe to channels
  const subscribe = useCallback((channels: string[], filters?: any) => {
    rtdsWebSocketClient.subscribe(channels, filters);
  }, []);

  // Unsubscribe from channels
  const unsubscribe = useCallback((channels?: string[]) => {
    rtdsWebSocketClient.unsubscribe(channels);
  }, []);

  // Get market update by ID
  const getMarketUpdate = useCallback((marketId: string): RTDSMarketUpdate | null => {
    return dataState.markets.get(marketId) || rtdsDataCache.markets.get(marketId) || null;
  }, [dataState.markets]);

  // Get crypto price by symbol
  const getCryptoPrice = useCallback((symbol: string): RTDSCryptoPriceUpdate | null => {
    return dataState.cryptoPrices.get(symbol.toLowerCase()) || 
           rtdsDataCache.cryptoPrices.get(symbol.toLowerCase()) || null;
  }, [dataState.cryptoPrices]);

  // Get all market updates
  const getAllMarketUpdates = useCallback((): RTDSMarketUpdate[] => {
    return Array.from(dataState.markets.values());
  }, [dataState.markets]);

  // Get all crypto prices
  const getAllCryptoPrices = useCallback((): RTDSCryptoPriceUpdate[] => {
    return Array.from(dataState.cryptoPrices.values());
  }, [dataState.cryptoPrices]);

  // Get market enhanced with RTDS data
  const getMarketWithRTDSData = useCallback((market: PolymarketMarket): PolymarketMarket => {
    const rtdsUpdate = getMarketUpdate(market.id);
    
    if (!rtdsUpdate) {
      return market;
    }

    // Merge RTDS data with existing market data
    const enhancedMarket = { ...market };

    // Update basic fields
    if (rtdsUpdate.question) enhancedMarket.question = rtdsUpdate.question;
    if (rtdsUpdate.description) enhancedMarket.description = rtdsUpdate.description;
    if (rtdsUpdate.outcomes) enhancedMarket.outcomes = rtdsUpdate.outcomes;
    if (rtdsUpdate.outcome_prices) {
      enhancedMarket.outcomePrices = rtdsUpdate.outcome_prices.map(p => p.toFixed(3)).join(',');
    }
    if (rtdsUpdate.end_time) enhancedMarket.endTime = rtdsUpdate.end_time;
    if (rtdsUpdate.active !== undefined) enhancedMarket.active = rtdsUpdate.active;
    if (rtdsUpdate.resolved !== undefined) enhancedMarket.resolved = rtdsUpdate.resolved;
    if (rtdsUpdate.volume) enhancedMarket.volume = rtdsUpdate.volume;
    if (rtdsUpdate.liquidity) enhancedMarket.liquidity = rtdsUpdate.liquidity;
    if (rtdsUpdate.tags) enhancedMarket.tags = rtdsUpdate.tags;
    if (rtdsUpdate.category) enhancedMarket.category = rtdsUpdate.category;

    return enhancedMarket;
  }, [getMarketUpdate]);

  // Get multiple markets enhanced with RTDS data
  const getMarketsWithRTDSData = useCallback((markets: PolymarketMarket[]): PolymarketMarket[] => {
    return markets.map(market => getMarketWithRTDSData(market));
  }, [getMarketWithRTDSData]);

  // Initialize connection and callbacks
  useEffect(() => {
    // Register callbacks
    marketUpdateCallbackRef.current = handleMarketUpdate;
    cryptoPriceCallbackRef.current = handleCryptoPriceUpdate;
    stateChangeCallbackRef.current = handleStateChange;

    const unsubscribeMarketUpdate = rtdsWebSocketClient.onMarketUpdate(handleMarketUpdate);
    const unsubscribeCryptoPriceUpdate = rtdsWebSocketClient.onCryptoPriceUpdate(handleCryptoPriceUpdate);
    const unsubscribeStateChange = rtdsWebSocketClient.onStateChange(handleStateChange);

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup
    return () => {
      unsubscribeMarketUpdate();
      unsubscribeCryptoPriceUpdate();
      unsubscribeStateChange();
    };
  }, [autoConnect, connect, handleMarketUpdate, handleCryptoPriceUpdate, handleStateChange]);

  // Auto-subscribe when connected
  useEffect(() => {
    if (connectionState.connected && autoSubscribe && channels.length > 0) {
      subscribe(channels, filters);
    }
  }, [connectionState.connected, autoSubscribe, channels, filters, subscribe]);

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
    // Connection state
    connected: connectionState.connected,
    connecting: connectionState.connecting,
    error: connectionState.error,
    reconnectAttempts: connectionState.reconnectAttempts,
    subscriptions: connectionState.subscriptions,
    
    // Data state
    marketUpdates: dataState.markets,
    cryptoPrices: dataState.cryptoPrices,
    lastMarketUpdate: dataState.lastMarketUpdate,
    lastCryptoUpdate: dataState.lastCryptoUpdate,
    
    // Actions
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    
    // Data getters
    getMarketUpdate,
    getCryptoPrice,
    getAllMarketUpdates,
    getAllCryptoPrices,
    
    // Synchronization helpers
    getMarketWithRTDSData,
    getMarketsWithRTDSData,
  };
}

// Hook for combined CLOB + RTDS data synchronization
export function useSynchronizedMarketData(markets: PolymarketMarket[]) {
  const rtds = useRTDSWebSocket({
    autoConnect: false,
    autoSubscribe: true,
    channels: ['markets'],
    filters: { active_only: true },
  });

  // Get markets with both CLOB and RTDS data applied
  const getFullySynchronizedMarket = useCallback((market: PolymarketMarket): PolymarketMarket => {
    // First apply RTDS updates
    const withRTDS = rtds.getMarketWithRTDSData(market);
    
    // Here you could also apply CLOB price updates if needed
    // This would integrate with the existing useCLOBWebSocket hook
    
    return withRTDS;
  }, [rtds.getMarketWithRTDSData]);

  const getFullySynchronizedMarkets = useCallback((markets: PolymarketMarket[]): PolymarketMarket[] => {
    return markets.map(market => getFullySynchronizedMarket(market));
  }, [getFullySynchronizedMarket]);

  return {
    ...rtds,
    getFullySynchronizedMarket,
    getFullySynchronizedMarkets,
    synchronizedMarkets: getFullySynchronizedMarkets(markets),
  };
}