import { polymarketAPI } from './lib/api/polymarket';

async function fetchAllMarketsWithinOneWeek() {
  try {
    console.log('Fetching ALL markets resolving within 1 week from today...');
    
    // Calculate date range: markets ending within 7 days from now
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format dates as ISO strings for API
    const endDateMin = now.toISOString();
    const endDateMax = oneWeekFromNow.toISOString();

    console.log(`Fetching markets ending between ${endDateMin} and ${endDateMax}`);

    // Fetch ALL markets ending within 7 days (no filtering)
    const allMarkets = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      sortBy: 'endDate',
      order: 'asc',
      endDate_min: endDateMin,
      endDate_max: endDateMax,
      limit: 500 // Get more markets
    });

    console.log(`\n📊 Total markets found: ${allMarkets.length}`);
    
    if (allMarkets.length === 0) {
      console.log('No markets found ending within 1 week. Let me try a broader range...');
      
      // Try with a broader range to see if there are any markets at all
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const endDateMax2Weeks = twoWeeksFromNow.toISOString();
      
      const marketsTwoWeeks = await polymarketAPI.getMarkets({
        active: true,
        closed: false,
        sortBy: 'endDate',
        order: 'asc',
        endDate_min: endDateMin,
        endDate_max: endDateMax2Weeks,
        limit: 50
      });
      
      console.log(`📊 Markets ending within 2 weeks: ${marketsTwoWeeks.length}`);
      
      if (marketsTwoWeeks.length > 0) {
        console.log('\nFirst few markets ending within 2 weeks:');
        marketsTwoWeeks.slice(0, 5).forEach((market, index) => {
          const endDate = new Date(market.endTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          console.log(`${index + 1}. ${market.question}`);
          console.log(`   Ends: ${endDate}`);
          console.log(`   Outcomes: ${market.outcomes?.join(', ')}`);
          console.log('');
        });
      }
      
      return allMarkets;
    }

    // Group markets by type
    const binaryMarkets = allMarkets.filter(market => 
      market.outcomes && 
      Array.isArray(market.outcomes) && 
      market.outcomes.length === 2 &&
      market.outcomes.some(o => o.toUpperCase() === 'YES') &&
      market.outcomes.some(o => o.toUpperCase() === 'NO')
    );
    
    const multiChoiceMarkets = allMarkets.filter(market => 
      market.outcomes && 
      Array.isArray(market.outcomes) && 
      market.outcomes.length > 2
    );

    console.log(`📈 Binary markets: ${binaryMarkets.length}`);
    console.log(`🎯 Multi-choice markets: ${multiChoiceMarkets.length}`);

    // Display first few markets of each type
    if (binaryMarkets.length > 0) {
      console.log('\n📈 First few binary markets:');
      binaryMarkets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.endTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`${index + 1}. ${market.question}`);
        console.log(`   Ends: ${endDate}`);
        console.log(`   Outcomes: ${market.outcomes?.join(' / ')}`);
        console.log('');
      });
    }

    if (multiChoiceMarkets.length > 0) {
      console.log('\n🎯 First few multi-choice markets:');
      multiChoiceMarkets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.endTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`${index + 1}. ${market.question}`);
        console.log(`   Ends: ${endDate}`);
        console.log(`   Outcomes: ${market.outcomes?.slice(0, 3).join(', ')}${market.outcomes.length > 3 ? '...' : ''}`);
        console.log('');
      });
    }

    console.log(`\n🎯 FINAL COUNT: ${allMarkets.length} total markets resolving within 1 week`);
    console.log(`   - ${binaryMarkets.length} binary markets`);
    console.log(`   - ${multiChoiceMarkets.length} multi-choice markets`);
    
    return allMarkets;
    
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
}

// Run the function
fetchAllMarketsWithinOneWeek()
  .then(() => {
    console.log('\n✅ Successfully completed market analysis');
  })
  .catch(error => {
    console.error('\n❌ Failed to fetch markets:', error.message);
    process.exit(1);
  });