import { polymarketAPI } from './lib/api/polymarket';

async function investigateMarketData() {
  try {
    console.log('Investigating market data structure...');
    
    // Calculate date range: markets ending within 7 days from now
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format dates as ISO strings for API
    const endDateMin = now.toISOString();
    const endDateMax = oneWeekFromNow.toISOString();

    console.log(`Fetching markets ending between ${endDateMin} and ${endDateMax}`);

    // Fetch just 10 markets to investigate
    const markets = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      sortBy: 'endDate',
      order: 'asc',
      endDate_min: endDateMin,
      endDate_max: endDateMax,
      limit: 10
    });

    console.log(`\n📊 Sample market data (first 5 markets):`);
    
    markets.slice(0, 5).forEach((market, index) => {
      console.log(`\n${index + 1}. Market ID: ${market.id}`);
      console.log(`   Question: ${market.question}`);
      console.log(`   End Time: ${market.endTime}`);
      console.log(`   Outcomes: ${JSON.stringify(market.outcomes)}`);
      console.log(`   Outcome Prices: ${market.outcomePrices}`);
      console.log(`   Market Type: ${market.marketType}`);
      console.log(`   Active: ${market.active}`);
      console.log(`   Closed: ${market.closed}`);
      console.log(`   Resolved: ${market.resolved}`);
      console.log(`   Volume: ${market.volume}`);
      
      // Count outcomes
      const outcomeCount = market.outcomes ? (Array.isArray(market.outcomes) ? market.outcomes.length : 0) : 0;
      console.log(`   Outcome Count: ${outcomeCount}`);
      
      if (outcomeCount === 2 && market.outcomes) {
        const outcomes = market.outcomes.map(o => o.toUpperCase().trim());
        const hasYesNoOutcomes = outcomes.includes('YES') && outcomes.includes('NO');
        console.log(`   Has YES/NO outcomes: ${hasYesNoOutcomes}`);
      }
    });

    // Let's also check what the total count would be without date filtering
    console.log('\n🔍 Checking total active markets...');
    const allActiveMarkets = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      limit: 100
    });
    
    console.log(`Total active markets: ${allActiveMarkets.length}`);
    
    // Check a few active markets to see their structure
    console.log('\n📊 Sample active market data:');
    allActiveMarkets.slice(0, 3).forEach((market, index) => {
      console.log(`\n${index + 1}. ${market.question}`);
      console.log(`   End Time: ${market.endTime}`);
      console.log(`   Outcomes: ${JSON.stringify(market.outcomes)}`);
      console.log(`   Outcome Count: ${market.outcomes ? market.outcomes.length : 0}`);
    });
    
  } catch (error) {
    console.error('Error investigating market data:', error);
    throw error;
  }
}

// Run the investigation
investigateMarketData()
  .then(() => {
    console.log('\n✅ Investigation completed');
  })
  .catch(error => {
    console.error('\n❌ Investigation failed:', error.message);
    process.exit(1);
  });