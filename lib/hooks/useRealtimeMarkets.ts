/**
 * React Hook for Real-Time Market Data
 * Combines CLOB and RTDS WebSocket clients for live market updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clobMarketWS } from '@/lib/api/clob-market-websocket';
import { rtdsWS } from '@/lib/api/rtds-websocket';
import { PolymarketMarket } from '@/lib/api/types';
import type { TokenPriceMap, ConnectionState } from '@/lib/api/realtime-types';

interface UseRealtimeMarketsOptions {
  markets: PolymarketMarket[];
  enableCLOB?: boolean;
  enableRTDS?: boolean;
  autoConnect?: boolean;
}

interface UseRealtimeMarketsReturn {
  // Connection states
  clobConnected: boolean;
  clobConnecting: boolean;
  clobError: string | null;
  rtdsConnected: boolean;
  rtdsConnecting: boolean;
  rtdsError: string | null;

  // Data
  livePrices: TokenPriceMap;
  marketsWithLivePrices: PolymarketMarket[];

  // Controls
  connect: () => Promise<void>;
  disconnect: () => void;

  // Utilities
  getMarketPrice: (marketId: string) => number | null;
}

/**
 * Hook for real-time market data with WebSocket connections
 */
export function useRealtimeMarkets({
  markets,
  enableCLOB = true,
  enableRTDS = false, // Disabled by default as it's less critical
  autoConnect = true,
}: UseRealtimeMarketsOptions): UseRealtimeMarketsReturn {
  // Connection states
  const [clobState, setClobState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  const [rtdsState, setRtdsState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  const [livePrices, setLivePrices] = useState<TokenPriceMap>(new Map());

  // Ref to track if we're mounted
  const mountedRef = useRef(true);

  // Extract token IDs from markets
  const extractTokenIds = useCallback((markets: PolymarketMarket[]): string[] => {
    const tokenIds: string[] = [];

    markets.forEach((market) => {
      if (market.clobTokenIds) {
        const tokens = market.clobTokenIds.split(',').map((id) => id.trim()).filter(Boolean);
        tokenIds.push(...tokens);
      }
    });

    return tokenIds;
  }, []);

  // Create market ID to token ID mapping
  const createMarketTokenMap = useCallback((markets: PolymarketMarket[]): Map<string, string[]> => {
    const map = new Map<string, string[]>();

    markets.forEach((market) => {
      if (market.clobTokenIds) {
        const tokens = market.clobTokenIds.split(',').map((id) => id.trim()).filter(Boolean);
        map.set(market.id, tokens);
      }
    });

    return map;
  }, []);

  const marketTokenMap = useRef(createMarketTokenMap(markets));

  // Update market token map when markets change
  useEffect(() => {
    marketTokenMap.current = createMarketTokenMap(markets);
  }, [markets, createMarketTokenMap]);

  // Connect to WebSockets
  const connect = useCallback(async () => {
    const tokenIds = extractTokenIds(markets);

    if (enableCLOB && tokenIds.length > 0) {
      try {
        await clobMarketWS.connect(tokenIds);
      } catch (error) {
        console.error('Failed to connect to CLOB WebSocket:', error);
      }
    }

    if (enableRTDS) {
      try {
        await rtdsWS.connect(['crypto_prices', 'activity']);
      } catch (error) {
        console.error('Failed to connect to RTDS WebSocket:', error);
      }
    }
  }, [markets, enableCLOB, enableRTDS, extractTokenIds]);

  // Disconnect from WebSockets
  const disconnect = useCallback(() => {
    if (enableCLOB) {
      clobMarketWS.disconnect();
    }
    if (enableRTDS) {
      rtdsWS.disconnect();
    }
  }, [enableCLOB, enableRTDS]);

  // Get market price by market ID
  const getMarketPrice = useCallback((marketId: string): number | null => {
    const tokenIds = marketTokenMap.current.get(marketId);
    if (!tokenIds || tokenIds.length === 0) return null;

    // For binary markets, use the first token (YES token)
    const yesTokenId = tokenIds[0];
    const tokenPrice = livePrices.get(yesTokenId);

    return tokenPrice?.price ? parseFloat(tokenPrice.price) : null;
  }, [livePrices]);

  // Get markets with live prices applied
  const marketsWithLivePrices = useCallback((): PolymarketMarket[] => {
    return markets.map((market) => {
      const livePrice = getMarketPrice(market.id);

      if (livePrice !== null && market.outcomes?.length === 2) {
        // Update binary market prices
        return {
          ...market,
          outcomePrices: `${livePrice.toFixed(3)},${(1 - livePrice).toFixed(3)}`,
          lastTradePrice: livePrice,
        };
      }

      return market;
    });
  }, [markets, getMarketPrice])();

  // Setup CLOB WebSocket callbacks
  useEffect(() => {
    if (!enableCLOB) return;

    const unsubscribeState = clobMarketWS.onStateChange((state) => {
      if (mountedRef.current) {
        setClobState(state);
      }
    });

    const unsubscribePrices = clobMarketWS.onPriceUpdate((prices) => {
      if (mountedRef.current) {
        setLivePrices(new Map(prices));
      }
    });

    return () => {
      unsubscribeState();
      unsubscribePrices();
    };
  }, [enableCLOB]);

  // Setup RTDS WebSocket callbacks
  useEffect(() => {
    if (!enableRTDS) return;

    const unsubscribeState = rtdsWS.onStateChange((state) => {
      if (mountedRef.current) {
        setRtdsState(state);
      }
    });

    return () => {
      unsubscribeState();
    };
  }, [enableRTDS]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && markets.length > 0) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, markets.length, connect, disconnect]);

  // Reconnect when markets change
  useEffect(() => {
    if (clobState.connected && markets.length > 0) {
      const tokenIds = extractTokenIds(markets);
      if (tokenIds.length > 0) {
        // Reconnect with new token IDs
        disconnect();
        setTimeout(() => connect(), 100);
      }
    }
  }, [markets, extractTokenIds, clobState.connected, connect, disconnect]);

  return {
    // Connection states
    clobConnected: clobState.connected,
    clobConnecting: clobState.connecting,
    clobError: clobState.error,
    rtdsConnected: rtdsState.connected,
    rtdsConnecting: rtdsState.connecting,
    rtdsError: rtdsState.error,

    // Data
    livePrices,
    marketsWithLivePrices,

    // Controls
    connect,
    disconnect,

    // Utilities
    getMarketPrice,
  };
}

/**
 * Simplified hook that just returns markets with live prices
 */
export function useMarketsWithLivePrices(markets: PolymarketMarket[]): {
  markets: PolymarketMarket[];
  connected: boolean;
  connecting: boolean;
  error: string | null;
} {
  const {
    marketsWithLivePrices,
    clobConnected,
    clobConnecting,
    clobError,
  } = useRealtimeMarkets({
    markets,
    enableCLOB: true,
    enableRTDS: false,
    autoConnect: true,
  });

  return {
    markets: marketsWithLivePrices,
    connected: clobConnected,
    connecting: clobConnecting,
    error: clobError,
  };
}
