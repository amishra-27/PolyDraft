'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { clobWebSocketClient } from '@/lib/api/clob-websocket';
import { CLOBConnectionState, CLOBTokenPrice } from '@/lib/api/websocket';
import { Wifi, WifiOff, RefreshCw, TrendingUp } from 'lucide-react';

export function CLOBDemo() {
  const [connectionState, setConnectionState] = useState<CLOBConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });
  
  const [priceUpdates, setPriceUpdates] = useState<CLOBTokenPrice[]>([]);
  const [subscribedTokens, setSubscribedTokens] = useState<string[]>([]);

  useEffect(() => {
    // Register callbacks
    const unsubscribeStateChange = clobWebSocketClient.onStateChange(setConnectionState);
    const unsubscribePriceUpdate = clobWebSocketClient.onPriceUpdate((prices) => {
      setPriceUpdates(prev => [...prices.slice(-5), ...prev].slice(0, 20)); // Keep last 20 updates
    });

    // Update subscribed tokens
    setSubscribedTokens(clobWebSocketClient.getSubscriptions());

    return () => {
      unsubscribeStateChange();
      unsubscribePriceUpdate();
    };
  }, []);

  const handleConnect = async () => {
    try {
      await clobWebSocketClient.connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    clobWebSocketClient.disconnect();
  };

  const handleSubscribe = () => {
    // Subscribe to some sample tokens
    const sampleTokens = ['17423', '17424', '17425'];
    clobWebSocketClient.subscribe(sampleTokens);
    setSubscribedTokens(clobWebSocketClient.getSubscriptions());
  };

  const handleUnsubscribe = () => {
    clobWebSocketClient.unsubscribe();
    setSubscribedTokens([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">CLOB WebSocket Demo</h1>
        <p className="text-text-muted">Real-time Polymarket token price updates</p>
      </div>

      {/* Connection Status */}
      <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Connection Status</h2>
          <div className="flex items-center gap-2">
            {connectionState.connected ? (
              <>
                <Wifi className="text-success" size={20} />
                <span className="text-success font-medium">Connected</span>
              </>
            ) : connectionState.connecting ? (
              <>
                <RefreshCw className="text-warning animate-spin" size={20} />
                <span className="text-warning font-medium">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="text-error" size={20} />
                <span className="text-error font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Last Connected:</span>
            <span className="ml-2 text-white">
              {connectionState.lastConnected ? formatTime(connectionState.lastConnected) : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-text-muted">Reconnect Attempts:</span>
            <span className="ml-2 text-white">{connectionState.reconnectAttempts}</span>
          </div>
          {connectionState.error && (
            <div className="col-span-2">
              <span className="text-text-muted">Error:</span>
              <span className="ml-2 text-error">{connectionState.error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {!connectionState.connected ? (
            <Button onClick={handleConnect} disabled={connectionState.connecting}>
              {connectionState.connecting ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="secondary">
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Management */}
      <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Subscription Management</h2>
        
        <div className="mb-4">
          <span className="text-text-muted">Subscribed Tokens:</span>
          <span className="ml-2 text-white">
            {subscribedTokens.length > 0 ? subscribedTokens.join(', ') : 'None'}
          </span>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSubscribe} 
            disabled={!connectionState.connected || subscribedTokens.length > 0}
          >
            Subscribe to Sample Tokens
          </Button>
          <Button 
            onClick={handleUnsubscribe} 
            variant="secondary"
            disabled={!connectionState.connected || subscribedTokens.length === 0}
          >
            Unsubscribe All
          </Button>
        </div>
      </div>

      {/* Price Updates */}
      <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} />
            Live Price Updates
          </h2>
          <span className="text-text-muted text-sm">
            {priceUpdates.length} recent updates
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {priceUpdates.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              {connectionState.connected 
                ? 'Waiting for price updates...' 
                : 'Connect to WebSocket to see price updates'
              }
            </div>
          ) : (
            priceUpdates.map((update, index) => (
              <div 
                key={`${update.token_id}-${update.timestamp}-${index}`}
                className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="font-mono text-sm text-white">Token {update.token_id}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-primary">
                    ${(update.price * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatTime(update.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">How to Use</h2>
        <ol className="space-y-2 text-text-muted text-sm">
          <li>1. Click "Connect" to establish WebSocket connection</li>
          <li>2. Click "Subscribe to Sample Tokens" to receive price updates</li>
          <li>3. Watch live price updates appear in real-time</li>
          <li>4. Use "Disconnect" to close connection</li>
        </ol>
        <p className="mt-4 text-xs text-text-dim">
          Note: This demo connects to the real Polymarket CLOB WebSocket. 
          Price updates will only appear when there is active trading for the subscribed tokens.
        </p>
      </div>
    </div>
  );
}