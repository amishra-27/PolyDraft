#!/usr/bin/env node

const WebSocket = require('ws');

console.log('\n=== Testing CLOB Raw Messages ===\n');

const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

ws.on('open', () => {
  console.log('✓ Connected');

  const sub = {
    assets_ids: ['71321045679252212594626385532706912750332728571942532289631379312455583992563'],
    type: 'MARKET'
  };

  console.log('→ Subscribing...');
  ws.send(JSON.stringify(sub));
});

ws.on('message', (data) => {
  console.log('\n📨 RAW MESSAGE:');
  console.log(data.toString());
  console.log('\n📦 PARSED:');
  try {
    const parsed = JSON.parse(data.toString());
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Could not parse as JSON');
  }
});

ws.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

// Close after 15 seconds
setTimeout(() => {
  console.log('\n→ Closing...');
  ws.close();
  process.exit(0);
}, 15000);
