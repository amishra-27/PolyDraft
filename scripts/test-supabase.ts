/**
 * Comprehensive Supabase Integration Test Suite
 * Run with: npx tsx scripts/test-supabase.ts
 */

import { supabase } from '../lib/supabase/client';
import type { User, League, LeagueMember, Pick, Score } from '../lib/supabase/types';

// Test wallet addresses
const TEST_WALLET_1 = '0xTEST1111111111111111111111111111111111';
const TEST_WALLET_2 = '0xTEST2222222222222222222222222222222222';
const TEST_WALLET_3 = '0xTEST3333333333333333333333333333333333';

// Track created resources for cleanup
const createdResources = {
  users: [] as string[],
  leagues: [] as string[],
  members: [] as string[],
  picks: [] as string[],
  scores: [] as string[],
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [] as { name: string; status: 'PASS' | 'FAIL'; error?: string }[],
};

function logTest(name: string, status: 'PASS' | 'FAIL', error?: string) {
  results.tests.push({ name, status, error });
  if (status === 'PASS') {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}${error ? `: ${error}` : ''}`);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  // Delete in reverse order of dependencies
  for (const pickId of createdResources.picks) {
    await supabase.from('picks').delete().eq('id', pickId);
  }
  for (const scoreId of createdResources.scores) {
    await supabase.from('scores').delete().eq('id', scoreId);
  }
  for (const memberId of createdResources.members) {
    await supabase.from('league_members').delete().eq('id', memberId);
  }
  for (const leagueId of createdResources.leagues) {
    await supabase.from('leagues').delete().eq('id', leagueId);
  }
  for (const userId of createdResources.users) {
    await supabase.from('users').delete().eq('id', userId);
  }

  console.log('✅ Cleanup complete');
}

async function testDatabaseConnection() {
  console.log('\n📡 Testing Database Connection...');

  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    logTest('Database connection', 'PASS');
  } catch (error) {
    logTest('Database connection', 'FAIL', (error as Error).message);
  }
}

async function testUserOperations() {
  console.log('\n👤 Testing User Operations...');

  // Create user
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: TEST_WALLET_1,
        username: 'test_user_1',
      })
      .select()
      .single();

    if (error) throw error;
    createdResources.users.push(data.id);
    logTest('Create user', 'PASS');
  } catch (error) {
    logTest('Create user', 'FAIL', (error as Error).message);
    return;
  }

  // Read user
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', TEST_WALLET_1)
      .single();

    if (error) throw error;
    if (!data || data.username !== 'test_user_1') {
      throw new Error('User data mismatch');
    }
    logTest('Read user', 'PASS');
  } catch (error) {
    logTest('Read user', 'FAIL', (error as Error).message);
  }

  // Update user
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ wins: 5, total_points: 100 })
      .eq('wallet_address', TEST_WALLET_1)
      .select()
      .single();

    if (error) throw error;
    if (data.wins !== 5 || data.total_points !== 100) {
      throw new Error('User update failed');
    }
    logTest('Update user', 'PASS');
  } catch (error) {
    logTest('Update user', 'FAIL', (error as Error).message);
  }

  // Create additional users
  try {
    const { data: user2, error: error2 } = await supabase
      .from('users')
      .insert({ wallet_address: TEST_WALLET_2 })
      .select()
      .single();

    const { data: user3, error: error3 } = await supabase
      .from('users')
      .insert({ wallet_address: TEST_WALLET_3 })
      .select()
      .single();

    if (error2 || error3) throw new Error('Failed to create additional users');
    createdResources.users.push(user2.id, user3.id);
    logTest('Create multiple users', 'PASS');
  } catch (error) {
    logTest('Create multiple users', 'FAIL', (error as Error).message);
  }
}

async function testLeagueOperations() {
  console.log('\n🏆 Testing League Operations...');

  // Create league
  let leagueId: string;
  try {
    const { data, error } = await supabase
      .from('leagues')
      .insert({
        name: 'Test League 1',
        creator_address: TEST_WALLET_1,
        end_time: new Date(Date.now() + 86400000).toISOString(),
        mode: 'social',
        status: 'open',
        max_players: 6,
      })
      .select()
      .single();

    if (error) throw error;
    leagueId = data.id;
    createdResources.leagues.push(data.id);
    logTest('Create league', 'PASS');
  } catch (error) {
    logTest('Create league', 'FAIL', (error as Error).message);
    return;
  }

  // Read league
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();

    if (error) throw error;
    if (!data || data.name !== 'Test League 1') {
      throw new Error('League data mismatch');
    }
    logTest('Read league', 'PASS');
  } catch (error) {
    logTest('Read league', 'FAIL', (error as Error).message);
  }

  // Update league status
  try {
    const { data, error } = await supabase
      .from('leagues')
      .update({ status: 'drafting', draft_started_at: new Date().toISOString() })
      .eq('id', leagueId)
      .select()
      .single();

    if (error) throw error;
    if (data.status !== 'drafting') {
      throw new Error('League status update failed');
    }
    logTest('Update league', 'PASS');
  } catch (error) {
    logTest('Update league', 'FAIL', (error as Error).message);
  }

  // Filter leagues by status
  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('status', 'drafting');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No drafting leagues found');
    }
    logTest('Filter leagues by status', 'PASS');
  } catch (error) {
    logTest('Filter leagues by status', 'FAIL', (error as Error).message);
  }
}

async function testLeagueMemberOperations() {
  console.log('\n👥 Testing League Member Operations...');

  const leagueId = createdResources.leagues[0];
  if (!leagueId) {
    logTest('League member tests', 'FAIL', 'No league available');
    return;
  }

  // Add members
  try {
    const members = [
      { league_id: leagueId, wallet_address: TEST_WALLET_1, draft_order: 0 },
      { league_id: leagueId, wallet_address: TEST_WALLET_2, draft_order: 1 },
      { league_id: leagueId, wallet_address: TEST_WALLET_3, draft_order: 2 },
    ];

    const { data, error } = await supabase
      .from('league_members')
      .insert(members)
      .select();

    if (error) throw error;
    createdResources.members.push(...data.map(m => m.id));
    logTest('Add league members', 'PASS');
  } catch (error) {
    logTest('Add league members', 'FAIL', (error as Error).message);
    return;
  }

  // Read members
  try {
    const { data, error } = await supabase
      .from('league_members')
      .select('*')
      .eq('league_id', leagueId)
      .order('draft_order');

    if (error) throw error;
    if (!data || data.length !== 3) {
      throw new Error(`Expected 3 members, got ${data?.length || 0}`);
    }
    logTest('Read league members', 'PASS');
  } catch (error) {
    logTest('Read league members', 'FAIL', (error as Error).message);
  }

  // Test unique constraint (same wallet can't join twice)
  try {
    const { error } = await supabase
      .from('league_members')
      .insert({ league_id: leagueId, wallet_address: TEST_WALLET_1 });

    if (!error) {
      throw new Error('Duplicate member should have been rejected');
    }
    logTest('Unique member constraint', 'PASS');
  } catch (error) {
    if ((error as Error).message.includes('duplicate')) {
      logTest('Unique member constraint', 'PASS');
    } else {
      logTest('Unique member constraint', 'FAIL', (error as Error).message);
    }
  }
}

async function testPickOperations() {
  console.log('\n🎯 Testing Pick Operations...');

  const leagueId = createdResources.leagues[0];
  if (!leagueId) {
    logTest('Pick tests', 'FAIL', 'No league available');
    return;
  }

  // Make picks (snake draft order)
  try {
    const picks = [
      {
        league_id: leagueId,
        wallet_address: TEST_WALLET_1,
        market_id: 'market_001',
        outcome_side: 'YES',
        round: 1,
        pick_number: 0,
      },
      {
        league_id: leagueId,
        wallet_address: TEST_WALLET_2,
        market_id: 'market_002',
        outcome_side: 'NO',
        round: 1,
        pick_number: 1,
      },
      {
        league_id: leagueId,
        wallet_address: TEST_WALLET_3,
        market_id: 'market_003',
        outcome_side: 'YES',
        round: 1,
        pick_number: 2,
      },
    ];

    const { data, error } = await supabase
      .from('picks')
      .insert(picks)
      .select();

    if (error) throw error;
    createdResources.picks.push(...data.map(p => p.id));
    logTest('Make picks', 'PASS');
  } catch (error) {
    logTest('Make picks', 'FAIL', (error as Error).message);
    return;
  }

  // Test unique market+side constraint
  try {
    const { error } = await supabase
      .from('picks')
      .insert({
        league_id: leagueId,
        wallet_address: TEST_WALLET_2,
        market_id: 'market_001',
        outcome_side: 'YES',
        round: 2,
        pick_number: 3,
      });

    if (!error) {
      throw new Error('Duplicate market+side should have been rejected');
    }
    logTest('Unique market+side constraint', 'PASS');
  } catch (error) {
    if ((error as Error).message.includes('duplicate') || (error as Error).message.includes('unique')) {
      logTest('Unique market+side constraint', 'PASS');
    } else {
      logTest('Unique market+side constraint', 'FAIL', (error as Error).message);
    }
  }

  // Update pick (swap side)
  try {
    const pickId = createdResources.picks[0];
    const { data, error } = await supabase
      .from('picks')
      .update({ outcome_side: 'NO' })
      .eq('id', pickId)
      .select()
      .single();

    if (error) throw error;
    if (data.outcome_side !== 'NO') {
      throw new Error('Pick side swap failed');
    }
    logTest('Update pick (swap side)', 'PASS');
  } catch (error) {
    logTest('Update pick (swap side)', 'FAIL', (error as Error).message);
  }

  // Query picks by user
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('league_id', leagueId)
      .eq('wallet_address', TEST_WALLET_1);

    if (error) throw error;
    if (!data || data.length !== 1) {
      throw new Error('Expected 1 pick for user 1');
    }
    logTest('Query picks by user', 'PASS');
  } catch (error) {
    logTest('Query picks by user', 'FAIL', (error as Error).message);
  }
}

async function testScoreOperations() {
  console.log('\n📊 Testing Score Operations...');

  const leagueId = createdResources.leagues[0];
  if (!leagueId) {
    logTest('Score tests', 'FAIL', 'No league available');
    return;
  }

  // Initialize scores
  try {
    const scores = [
      { league_id: leagueId, wallet_address: TEST_WALLET_1, points: 2 },
      { league_id: leagueId, wallet_address: TEST_WALLET_2, points: 1 },
      { league_id: leagueId, wallet_address: TEST_WALLET_3, points: 3 },
    ];

    const { data, error } = await supabase
      .from('scores')
      .insert(scores)
      .select();

    if (error) throw error;
    createdResources.scores.push(...data.map(s => s.id));
    logTest('Initialize scores', 'PASS');
  } catch (error) {
    logTest('Initialize scores', 'FAIL', (error as Error).message);
    return;
  }

  // Get leaderboard (sorted by points)
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('league_id', leagueId)
      .order('points', { ascending: false });

    if (error) throw error;
    if (!data || data.length !== 3) {
      throw new Error('Expected 3 scores');
    }
    if (data[0].wallet_address !== TEST_WALLET_3 || data[0].points !== 3) {
      throw new Error('Leaderboard order incorrect');
    }
    logTest('Get leaderboard', 'PASS');
  } catch (error) {
    logTest('Get leaderboard', 'FAIL', (error as Error).message);
  }

  // Update score
  try {
    const { data, error } = await supabase
      .from('scores')
      .update({ points: 5 })
      .eq('league_id', leagueId)
      .eq('wallet_address', TEST_WALLET_1)
      .select()
      .single();

    if (error) throw error;
    if (data.points !== 5) {
      throw new Error('Score update failed');
    }
    logTest('Update score', 'PASS');
  } catch (error) {
    logTest('Update score', 'FAIL', (error as Error).message);
  }

  // Set winner
  try {
    const { data, error } = await supabase
      .from('scores')
      .update({ is_winner: true, rank: 1 })
      .eq('league_id', leagueId)
      .eq('wallet_address', TEST_WALLET_1)
      .select()
      .single();

    if (error) throw error;
    if (!data.is_winner) {
      throw new Error('Winner flag not set');
    }
    logTest('Set winner', 'PASS');
  } catch (error) {
    logTest('Set winner', 'FAIL', (error as Error).message);
  }
}

async function testRealtimeCapabilities() {
  console.log('\n⚡ Testing Realtime Capabilities...');

  const leagueId = createdResources.leagues[0];
  if (!leagueId) {
    logTest('Realtime tests', 'FAIL', 'No league available');
    return;
  }

  // Test channel subscription
  try {
    const channel = supabase.channel(`test-channel-${Date.now()}`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Subscription timeout'));
      }, 5000);

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'picks',
            filter: `league_id=eq.${leagueId}`,
          },
          () => {
            // Callback would be triggered on insert
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            clearTimeout(timeout);
            reject(new Error('Channel error'));
          }
        });
    });

    await supabase.removeChannel(channel);
    logTest('Realtime subscription', 'PASS');
  } catch (error) {
    logTest('Realtime subscription', 'FAIL', (error as Error).message);
  }
}

async function testDataRelationships() {
  console.log('\n🔗 Testing Data Relationships...');

  const leagueId = createdResources.leagues[0];
  if (!leagueId) {
    logTest('Relationship tests', 'FAIL', 'No league available');
    return;
  }

  // Test cascade delete (deleting league should delete members)
  try {
    // Create a temporary league
    const { data: tempLeague, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: 'Temp League',
        creator_address: TEST_WALLET_1,
        end_time: new Date(Date.now() + 86400000).toISOString(),
      })
      .select()
      .single();

    if (leagueError) throw leagueError;

    // Add a member
    const { data: tempMember, error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: tempLeague.id,
        wallet_address: TEST_WALLET_1,
      })
      .select()
      .single();

    if (memberError) throw memberError;

    // Delete league
    const { error: deleteError } = await supabase
      .from('leagues')
      .delete()
      .eq('id', tempLeague.id);

    if (deleteError) throw deleteError;

    // Wait a bit for cascade delete to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check member was cascade deleted (check by league_id to be safe)
    const { data: checkMembers, error: checkError } = await supabase
      .from('league_members')
      .select('*')
      .eq('league_id', tempLeague.id);

    if (checkError) throw checkError;
    if (checkMembers && checkMembers.length > 0) {
      throw new Error('Members were not cascade deleted');
    }

    logTest('Cascade delete', 'PASS');
  } catch (error) {
    logTest('Cascade delete', 'FAIL', (error as Error).message);
  }
}

async function printResults() {
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
  }

  console.log('='.repeat(50) + '\n');
}

async function runAllTests() {
  console.log('🚀 Starting Supabase Integration Tests...\n');

  try {
    await testDatabaseConnection();
    await testUserOperations();
    await testLeagueOperations();
    await testLeagueMemberOperations();
    await testPickOperations();
    await testScoreOperations();
    await testRealtimeCapabilities();
    await testDataRelationships();
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await cleanup();
    await printResults();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run tests
runAllTests();
