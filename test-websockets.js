#!/usr/bin/env node

/**
 * Test script for Polymarket WebSocket connections
 * Run with: node test-websockets.js
 */

const WebSocket = require('ws');

// Test CLOB Market WebSocket
function testCLOBMarket() {
  console.log('\n=== Testing CLOB Market WebSocket ===\n');

  const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

  ws.on('open', () => {
    console.log('✓ Connected to CLOB Market WebSocket');

    // Subscribe to a known token (example token ID)
    const subscription = {
      assets_ids: [
        '71321045679252212594626385532706912750332728571942532289631379312455583992563'
      ],
      type: 'MARKET'
    };

    console.log('→ Sending subscription:', JSON.stringify(subscription, null, 2));
    ws.send(JSON.stringify(subscription));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('✓ Received message:');
      console.log('  Event Type:', message.event_type);
      console.log('  Asset ID:', message.asset_id);
      if (message.price) console.log('  Price:', message.price);
      if (message.best_bid) console.log('  Best Bid:', message.best_bid);
      if (message.best_ask) console.log('  Best Ask:', message.best_ask);
      console.log('');
    } catch (error) {
      console.log('✗ Failed to parse message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.log('✗ WebSocket error:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`✓ WebSocket closed: ${code} ${reason}`);
  });

  // Close after 10 seconds
  setTimeout(() => {
    console.log('\n→ Closing CLOB connection...');
    ws.close();
    testRTDS();
  }, 10000);
}

// Test RTDS WebSocket
function testRTDS() {
  console.log('\n=== Testing RTDS WebSocket ===\n');

  const ws = new WebSocket('wss://ws-live-data.polymarket.com');

  let pingInterval;

  ws.on('open', () => {
    console.log('✓ Connected to RTDS WebSocket');

    // Subscribe to crypto prices
    const subscription = {
      action: 'subscribe',
      subscriptions: [
        {
          topic: 'crypto_prices',
          type: 'subscribe'
        },
        {
          topic: 'activity',
          type: 'subscribe'
        }
      ]
    };

    console.log('→ Sending subscription:', JSON.stringify(subscription, null, 2));
    ws.send(JSON.stringify(subscription));

    // Start ping interval (every 5 seconds as per docs)
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('PING');
        console.log('→ Sent PING');
      }
    }, 5000);
  });

  ws.on('message', (data) => {
    const message = data.toString();

    if (message === 'PONG') {
      console.log('✓ Received PONG');
      return;
    }

    try {
      const parsed = JSON.parse(message);
      console.log('✓ Received message:');
      console.log('  Topic:', parsed.topic);
      console.log('  Type:', parsed.type);
      if (parsed.payload) {
        console.log('  Payload:', JSON.stringify(parsed.payload, null, 2));
      }
      console.log('');
    } catch (error) {
      console.log('✗ Failed to parse message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.log('✗ WebSocket error:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`✓ WebSocket closed: ${code} ${reason}`);
    if (pingInterval) clearInterval(pingInterval);
    console.log('\n=== Tests Complete ===\n');
    process.exit(0);
  });

  // Close after 10 seconds
  setTimeout(() => {
    console.log('\n→ Closing RTDS connection...');
    ws.close();
  }, 10000);
}

// Start tests
console.log('\n╔════════════════════════════════════════════╗');
console.log('║  Polymarket WebSocket Connection Tests    ║');
console.log('╚════════════════════════════════════════════╝');

testCLOBMarket();
