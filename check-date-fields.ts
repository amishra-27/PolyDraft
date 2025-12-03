import { polymarketAPI } from './lib/api/polymarket';

async function checkMarketDateFields() {
  try {
    console.log('🔍 Checking available date fields in market data...');
    
    // Get some active markets to examine
    const markets = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      limit: 5
    });

    console.log(`\n📊 Examining ${markets.length} markets:`);
    
    markets.forEach((market, index) => {
      console.log(`\n${index + 1}. Market: ${market.question}`);
      console.log(`   ID: ${market.id}`);
      console.log(`   Available date fields:`);
      console.log(`     - endTime: ${market.endTime}`);
      console.log(`     - endDate: ${market.endDate}`);
      console.log(`     - closedTime: ${market.closedTime}`);
      console.log(`     - startTime: ${market.startTime}`);
      console.log(`     - resolved: ${market.resolved}`);
      console.log(`     - active: ${market.active}`);
      console.log(`     - closed: ${market.closed}`);
      
      // Show all available fields to understand the structure
      console.log(`   All fields: ${Object.keys(market).join(', ')}`);
    });

    // Let's also try to get markets that are ending soon using the API's sortBy
    console.log('\n🔍 Trying to get markets ending soon using API sort...');
    
    const marketsEndingSoon = await polymarketAPI.getMarkets({
      active: true,
      closed: false,
      sortBy: 'endDate',
      order: 'asc',
      limit: 10
    });

    console.log(`\n📊 Markets sorted by endDate (first 3):`);
    marketsEndingSoon.slice(0, 3).forEach((market, index) => {
      console.log(`\n${index + 1}. ${market.question}`);
      console.log(`   endDate: ${market.endDate}`);
      console.log(`   endTime: ${market.endTime}`);
      console.log(`   closedTime: ${market.closedTime}`);
      console.log(`   All date fields: ${Object.keys(market).filter(key => key.toLowerCase().includes('time') || key.toLowerCase().includes('date')).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error checking market date fields:', error);
    throw error;
  }
}

// Run the check
checkMarketDateFields()
  .then(() => {
    console.log('\n✅ Date field investigation completed');
  })
  .catch(error => {
    console.error('\n❌ Investigation failed:', error.message);
    process.exit(1);
  });