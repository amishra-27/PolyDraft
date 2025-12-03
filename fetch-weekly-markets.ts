import { polymarketAPI } from './lib/api/polymarket';

async function fetchMarketsResolvingWithinOneWeek() {
  try {
    console.log('Fetching markets resolving within 1 week from today...');
    
    // Use the existing method that gets binary markets ending within 1 week
    const markets = await polymarketAPI.getBinaryMarketsEndingSoon(100); // Get up to 100 markets
    
    console.log(`\nFound ${markets.length} markets resolving within 1 week:`);
    
    // Display each market with details
    markets.forEach((market, index) => {
      const endDate = new Date(market.endTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const volume = parseFloat(market.volume || '0').toLocaleString();
      const prices = JSON.parse(market.outcomePrices || '["0.5", "0.5"]');
      const yesPrice = Math.round(parseFloat(prices[0]) * 100);
      const noPrice = Math.round(parseFloat(prices[1]) * 100);
      
      console.log(`${index + 1}. ${market.question}`);
      console.log(`   Ends: ${endDate}`);
      console.log(`   Volume: $${volume}`);
      console.log(`   Odds: ${yesPrice}% YES / ${noPrice}% NO`);
      console.log('');
    });
    
    console.log(`\n🎯 Total count: ${markets.length} markets resolving within 1 week`);
    
    return markets;
    
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
}

// Run the function
fetchMarketsResolvingWithinOneWeek()
  .then(markets => {
    console.log('\n✅ Successfully fetched markets');
  })
  .catch(error => {
    console.error('\n❌ Failed to fetch markets:', error.message);
    process.exit(1);
  });