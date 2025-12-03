import { polymarketAPI, parseOutcomePrices } from './lib/api/polymarket';

async function testMarketFetching() {
  try {
    console.log('Testing getBinaryMarketsEndingSoon...');
    
    const markets = await polymarketAPI.getBinaryMarketsEndingSoon(10);
    
    console.log(`Found ${markets.length} markets:`);
    markets.forEach((market, index) => {
      const prices = parseOutcomePrices(market.outcomePrices);
      console.log(`\n${index + 1}. ${market.question}`);
      console.log(`   Category: ${market.category}`);
      console.log(`   Volume: $${parseFloat(market.volume || '0').toLocaleString()}`);
      console.log(`   End Date: ${new Date(market.endTime).toLocaleDateString()}`);
      console.log(`   Outcomes: ${market.outcomes.join(', ')}`);
      console.log(`   Prices: YES ${Math.round(prices[0] * 100)}%, NO ${Math.round(prices[1] * 100)}%`);
      console.log(`   Active: ${market.active}, Closed: ${market.closed}, Resolved: ${market.resolved}`);
    });
    
  } catch (error) {
    console.error('Error testing market fetching:', error);
  }
}

testMarketFetching();