// Test script for RTDS WebSocket implementation
// Run with: node test-rtds.js

const WebSocket = require('ws');

// RTDS WebSocket configuration
const RTDS_WS_URL = 'wss://ws-live-data.polymarket.com';

class RTDSTestClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.connected = false;
    this.subscriptions = new Set();
  }

  connect() {
    console.log('🔌 Connecting to RTDS WebSocket...');
    
    this.ws = new WebSocket(RTDS_WS_URL);

    this.ws.on('open', () => {
      console.log('✅ RTDS WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to channels
      this.subscribe(['markets', 'crypto_prices']);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse message:', error);
        console.log('Raw message:', data.toString());
      }
    });

    this.ws.on('close', (code, reason) => {
      console.log(`🔌 RTDS WebSocket disconnected: ${code} - ${reason}`);
      this.connected = false;
      
      // Attempt reconnection
      if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ RTDS WebSocket error:', error);
      this.connected = false;
    });

    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      if (this.connected && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        console.log('📤 Sent ping');
      }
    }, 30000);
  }

  handleMessage(message) {
    const timestamp = new Date().toISOString();
    
    switch (message.type) {
      case 'market_update':
        console.log(`📊 [${timestamp}] Market Update:`, message.data.length, 'markets');
        message.data.forEach((update, index) => {
          console.log(`  ${index + 1}. ${update.market_id}: ${update.question} (${update.update_type})`);
          if (update.outcome_prices) {
            console.log(`     Prices: ${update.outcome_prices.map(p => (p * 100).toFixed(1) + '%').join(' / ')}`);
          }
          if (update.volume) {
            console.log(`     Volume: $${parseInt(update.volume).toLocaleString()}`);
          }
        });
        break;

      case 'crypto_price_update':
        console.log(`💰 [${timestamp}] Crypto Price Update:`, message.data.length, 'symbols');
        message.data.forEach((price, index) => {
          const change = price.change_24h >= 0 ? '+' : '';
          console.log(`  ${index + 1}. ${price.symbol}: $${price.price.toLocaleString()} (${change}${price.change_24h}%)`);
          console.log(`     Volume: $${price.volume_24h.toLocaleString()} | MCap: $${price.market_cap.toLocaleString()}`);
        });
        break;

      case 'heartbeat':
        console.log(`💓 [${timestamp}] Heartbeat received`);
        break;

      case 'error':
        console.log(`❌ [${timestamp}] Error:`, message.message);
        if (message.details) {
          console.log('   Details:', message.details);
        }
        break;

      default:
        console.log(`❓ [${timestamp}] Unknown message type:`, message.type);
        console.log('   Message:', message);
    }
  }

  subscribe(channels, filters = {}) {
    if (!this.connected) {
      console.log('⚠️  Cannot subscribe: not connected');
      return;
    }

    const message = {
      type: 'subscribe',
      channels: channels,
      filters: filters
    };

    this.ws.send(JSON.stringify(message));
    channels.forEach(channel => this.subscriptions.add(channel));
    
    console.log('📤 Subscribed to channels:', channels.join(', '));
    if (Object.keys(filters).length > 0) {
      console.log('   Filters:', filters);
    }
  }

  unsubscribe(channels) {
    if (!this.connected) {
      console.log('⚠️  Cannot unsubscribe: not connected');
      return;
    }

    const message = {
      type: 'unsubscribe',
      channels: channels
    };

    this.ws.send(JSON.stringify(message));
    channels.forEach(channel => this.subscriptions.delete(channel));
    
    console.log('📤 Unsubscribed from channels:', channels.join(', '));
  }

  scheduleReconnect() {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('🔌 Disconnecting...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Test complete');
      this.ws = null;
    }
    
    this.connected = false;
    this.subscriptions.clear();
  }

  getStatus() {
    return {
      connected: this.connected,
      subscriptions: Array.from(this.subscriptions),
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws ? this.ws.readyState : 'N/A'
    };
  }
}

// Test functions
async function testRTDSConnection() {
  console.log('🚀 Starting RTDS WebSocket Test\n');
  
  const client = new RTDSTestClient();
  
  // Connect to RTDS WebSocket
  client.connect();
  
  // Wait for connection and some data
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test subscription with filters
  console.log('\n📋 Testing filtered subscription...');
  client.subscribe(['markets'], {
    categories: ['crypto'],
    active_only: true
  });
  
  // Wait for filtered data
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Test crypto-only subscription
  console.log('\n💰 Testing crypto-only subscription...');
  client.unsubscribe(['markets']);
  client.subscribe(['crypto_prices'], {
    symbols: ['BTC', 'ETH', 'SOL']
  });
  
  // Wait for crypto data
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Show final status
  console.log('\n📊 Final Status:');
  const status = client.getStatus();
  console.log('  Connected:', status.connected);
  console.log('  Subscriptions:', status.subscriptions.join(', '));
  console.log('  Reconnect Attempts:', status.reconnectAttempts);
  console.log('  Ready State:', status.readyState);
  
  // Disconnect
  console.log('\n🔌 Disconnecting...');
  client.disconnect();
  
  console.log('\n✅ RTDS WebSocket Test Complete!');
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  testRTDSConnection().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { RTDSTestClient, testRTDSConnection };