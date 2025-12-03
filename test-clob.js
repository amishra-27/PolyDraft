// Test script for CLOB WebSocket implementation
// Run with: node test-clob.js

const { clobWebSocketClient } = require('./lib/api/clob-websocket.ts');

async function testCLOBWebSocket() {
  console.log('Testing CLOB WebSocket connection...');
  
  try {
    // Connect to WebSocket
    console.log('Connecting to CLOB WebSocket...');
    await clobWebSocketClient.connect();
    console.log('✅ Connected successfully');
    
    // Subscribe to some sample token IDs (these would come from market.clobTokenIds)
    const sampleTokenIds = ['17423', '17424']; // Example token IDs
    console.log('Subscribing to tokens:', sampleTokenIds);
    clobWebSocketClient.subscribe(sampleTokenIds);
    
    // Listen for price updates
    clobWebSocketClient.onPriceUpdate((prices) => {
      console.log('📈 Price update received:', prices);
    });
    
    // Listen for connection state changes
    clobWebSocketClient.onStateChange((state) => {
      console.log('🔄 Connection state changed:', state);
    });
    
    // Keep connection alive for testing
    console.log('Listening for price updates... (Press Ctrl+C to stop)');
    
    // Disconnect after 30 seconds for testing
    setTimeout(() => {
      console.log('Disconnecting...');
      clobWebSocketClient.disconnect();
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  clobWebSocketClient.disconnect();
  process.exit(0);
});

testCLOBWebSocket();