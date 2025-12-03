import { polymarketAPI } from './lib/api/polymarket';

async function fetchAndCountMarketsWithinOneWeek() {
  try {
    console.log('🔍 Fetching markets resolving within 1 week from today...');
    
    // Calculate date range: markets ending within 7 days from now
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Format dates as ISO strings for API
    const endDateMin = now.toISOString();
    const endDateMax = oneWeekFromNow.toISOString();

    console.log(`📅 Date range: ${endDateMin} to ${endDateMax}`);

    // Fetch markets ending within 7 days using endDate field
    const markets = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      sortBy: 'endDate',
      order: 'asc',
      endDate_min: endDateMin,
      endDate_max: endDateMax,
      limit: 1000 // Get more markets to be thorough
    });

    console.log(`\n📊 Raw markets fetched: ${markets.length}`);

    // Parse outcomes properly since they come as JSON strings
    const processedMarkets = markets.map(market => {
      let parsedOutcomes = [];
      try {
        if (market.outcomes) {
          if (typeof market.outcomes === 'string') {
            parsedOutcomes = JSON.parse(market.outcomes);
          } else if (Array.isArray(market.outcomes)) {
            parsedOutcomes = market.outcomes;
          }
        }
      } catch (error) {
        console.warn(`Failed to parse outcomes for market ${market.id}:`, market.outcomes);
      }
      
      return {
        ...market,
        parsedOutcomes
      };
    });

    // Filter markets that actually end within our date range
    // (since API might return some that don't exactly match)
    const validMarkets = processedMarkets.filter(market => {
      if (!market.endDate) return false;
      
      const endTime = new Date(market.endDate);
      return endTime >= now && endTime <= oneWeekFromNow;
    });

    console.log(`📈 Markets actually ending within 1 week: ${validMarkets.length}`);

    // Classify markets
    const binaryMarkets = validMarkets.filter(market => {
      if (!market.parsedOutcomes || !Array.isArray(market.parsedOutcomes)) return false;
      if (market.parsedOutcomes.length !== 2) return false;
      
      const outcomes = market.parsedOutcomes.map(o => o.toUpperCase().trim());
      return outcomes.includes('YES') && outcomes.includes('NO');
    });

    const multiChoiceMarkets = validMarkets.filter(market => {
      if (!market.parsedOutcomes || !Array.isArray(market.parsedOutcomes)) return false;
      return market.parsedOutcomes.length > 2;
    });

    const otherMarkets = validMarkets.filter(market => {
      if (!market.parsedOutcomes || !Array.isArray(market.parsedOutcomes)) return true;
      if (market.parsedOutcomes.length === 2) {
        const outcomes = market.parsedOutcomes.map(o => o.toUpperCase().trim());
        return !(outcomes.includes('YES') && outcomes.includes('NO'));
      }
      return false;
    });

    console.log(`\n🎯 Market Classification:`);
    console.log(`   📈 Binary (YES/NO): ${binaryMarkets.length}`);
    console.log(`   🎯 Multi-choice: ${multiChoiceMarkets.length}`);
    console.log(`   ❓ Other: ${otherMarkets.length}`);

    // Display sample markets from each category
    if (binaryMarkets.length > 0) {
      console.log(`\n📈 Sample Binary Markets (${Math.min(3, binaryMarkets.length)} of ${binaryMarkets.length}):`);
      binaryMarkets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.endDate || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const volume = parseFloat(market.volume || '0').toLocaleString();
        const prices = market.outcomePrices ? market.outcomePrices.split(',').map(p => parseFloat(p.trim())) : [0.5, 0.5];
        const yesPrice = prices[0] ? Math.round(prices[0] * 100) : 50;
        const noPrice = prices[1] ? Math.round(prices[1] * 100) : 50;
        
        console.log(`   ${index + 1}. ${market.question}`);
        console.log(`      Ends: ${endDate} | Volume: $${volume} | Odds: ${yesPrice}% YES / ${noPrice}% NO`);
      });
    }

    if (multiChoiceMarkets.length > 0) {
      console.log(`\n🎯 Sample Multi-choice Markets (${Math.min(3, multiChoiceMarkets.length)} of ${multiChoiceMarkets.length}):`);
      multiChoiceMarkets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.endDate || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const volume = parseFloat(market.volume || '0').toLocaleString();
        
        console.log(`   ${index + 1}. ${market.question}`);
        console.log(`      Ends: ${endDate} | Volume: $${volume} | ${market.parsedOutcomes.length} outcomes`);
        console.log(`      Options: ${market.parsedOutcomes.slice(0, 4).join(', ')}${market.parsedOutcomes.length > 4 ? '...' : ''}`);
      });
    }

    if (otherMarkets.length > 0) {
      console.log(`\n❓ Sample Other Markets (${Math.min(3, otherMarkets.length)} of ${otherMarkets.length}):`);
      otherMarkets.slice(0, 3).forEach((market, index) => {
        const endDate = new Date(market.endDate || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        console.log(`   ${index + 1}. ${market.question}`);
        console.log(`      Ends: ${endDate} | Outcomes: ${JSON.stringify(market.parsedOutcomes)}`);
      });
    }

    const totalCount = validMarkets.length;
    console.log(`\n🎯 FINAL COUNT: ${totalCount} markets resolving within 1 week`);
    console.log(`   📈 Binary markets: ${binaryMarkets.length}`);
    console.log(`   🎯 Multi-choice markets: ${multiChoiceMarkets.length}`);
    console.log(`   ❓ Other markets: ${otherMarkets.length}`);
    
    return {
      total: totalCount,
      binary: binaryMarkets.length,
      multiChoice: multiChoiceMarkets.length,
      other: otherMarkets.length,
      markets: validMarkets
    };
    
  } catch (error) {
    console.error('❌ Error fetching markets:', error);
    throw error;
  }
}

// Run the function and provide a clear answer
fetchAndCountMarketsWithinOneWeek()
  .then(result => {
    console.log(`\n🎯 ANSWER: ${result.total} markets are resolving within 1 week from today`);
    if (result.total > 0) {
      console.log(`   Breakdown: ${result.binary} binary, ${result.multiChoice} multi-choice, ${result.other} other`);
    }
  })
  .catch(error => {
    console.error('\n❌ Failed to count markets:', error.message);
    process.exit(1);
  });