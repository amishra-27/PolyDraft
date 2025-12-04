import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateCurrentTurn, sortMembersByDraftOrder, isMarketSideTaken } from '@/lib/supabase/draft-utils';

// POST /api/draft/pick - Make a draft pick
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { league_id, wallet_address, market_id, outcome_side } = body;
    
    if (!league_id || !wallet_address || !market_id || !outcome_side) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['league_id', 'wallet_address', 'market_id', 'outcome_side']
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!wallet_address.startsWith('0x') || wallet_address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate outcome side
    if (!['YES', 'NO'].includes(outcome_side)) {
      return NextResponse.json(
        { error: 'Outcome side must be either "YES" or "NO"' },
        { status: 400 }
      );
    }

    const normalizedAddress = wallet_address.toLowerCase();

    // Check if league exists and is in drafting status
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    if (league.status !== 'drafting') {
      return NextResponse.json(
        { error: 'Draft is not active for this league' },
        { status: 400 }
      );
    }

    // Get league members with draft orders
    const { data: members, error: membersError } = await supabaseAdmin
      .from('league_members')
      .select('*')
      .eq('league_id', league_id);

    if (membersError) {
      console.error('Error fetching league members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch league members' },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: 'No members found in league' },
        { status: 400 }
      );
    }

    // Check if user is a member of the league
    const member = members.find(m => m.wallet_address === normalizedAddress);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this league' },
        { status: 403 }
      );
    }

    // Get existing picks to determine current state
    const { data: existingPicks, error: picksError } = await supabaseAdmin
      .from('picks')
      .select('*')
      .eq('league_id', league_id)
      .order('pick_number', { ascending: true });

    if (picksError) {
      console.error('Error fetching existing picks:', picksError);
      return NextResponse.json(
        { error: 'Failed to fetch existing picks' },
        { status: 500 }
      );
    }

    // Calculate current turn
    const sortedMembers = sortMembersByDraftOrder(members);
    const currentPickNumber = existingPicks?.length || 0;
    const currentTurn = calculateCurrentTurn(currentPickNumber, sortedMembers);

    if (!currentTurn) {
      return NextResponse.json(
        { error: 'Unable to determine current turn' },
        { status: 500 }
      );
    }

    // Check if it's the user's turn
    if (currentTurn.wallet_address !== normalizedAddress) {
      return NextResponse.json(
        { 
          error: 'Not your turn to pick',
          current_player: {
            wallet_address: currentTurn.wallet_address,
            draft_order: currentTurn.draft_order
          },
          your_draft_order: member.draft_order
        },
        { status: 400 }
      );
    }

    // Check if market+outcome combination is already taken
    if (isMarketSideTaken(existingPicks || [], market_id, outcome_side)) {
      return NextResponse.json(
        { error: 'This market and outcome combination is already taken' },
        { status: 409 }
      );
    }

    // Calculate round and pick number
    const totalPlayers = sortedMembers.length;
    const round = Math.floor(currentPickNumber / totalPlayers) + 1;
    const pickNumber = currentPickNumber + 1;

    // Check if draft is complete
    const totalRounds = 6; // Default rounds per draft
    const totalPicksNeeded = totalPlayers * totalRounds;
    if (currentPickNumber >= totalPicksNeeded) {
      return NextResponse.json(
        { error: 'Draft is already complete' },
        { status: 400 }
      );
    }

    // Validate market exists by checking Polymarket API
    try {
      const marketResponse = await fetch(`https://gamma-api.polymarket.com/markets/${market_id}`);
      if (!marketResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid market ID' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error validating market:', error);
      return NextResponse.json(
        { error: 'Failed to validate market' },
        { status: 500 }
      );
    }

    // Create the pick
    const { data: pick, error: pickError } = await supabaseAdmin
      .from('picks')
      .insert({
        league_id,
        user_id: null, // Will be set when user system is implemented
        wallet_address: normalizedAddress,
        market_id,
        outcome_side,
        round,
        pick_number: pickNumber,
        resolved: false,
        correct: null
      })
      .select()
      .single();

    if (pickError) {
      console.error('Error creating pick:', pickError);
      
      if (pickError.code === '23505') {
        return NextResponse.json(
          { error: 'This market and outcome combination is already taken' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create pick', details: pickError.message },
        { status: 500 }
      );
    }

    // Calculate next turn
    const nextPickNumber = pickNumber;
    const nextTurn = calculateCurrentTurn(nextPickNumber, sortedMembers);
    const nextRound = Math.floor(nextPickNumber / totalPlayers) + 1;
    const isDraftComplete = nextPickNumber >= totalPicksNeeded;

    // Update league status if draft is complete
    if (isDraftComplete) {
      await supabaseAdmin
        .from('leagues')
        .update({ status: 'active' })
        .eq('id', league_id);
    }

    return NextResponse.json({
      success: true,
      pick: {
        ...pick,
        market: {
          id: market_id,
          outcome_side
        }
      },
      draft_state: {
        current_pick_number: nextPickNumber,
        current_round: nextRound,
        total_rounds: totalRounds,
        next_player_turn: nextTurn?.wallet_address || null,
        is_complete: isDraftComplete
      },
      message: 'Pick made successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/draft/pick:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/draft/pick - Get current draft state and available picks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league_id = searchParams.get('league_id');
    const wallet_address = searchParams.get('wallet_address');

    if (!league_id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Get league members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('league_members')
      .select(`
        *,
        users (
          username
        )
      `)
      .eq('league_id', league_id)
      .order('draft_order', { ascending: true });

    if (membersError) {
      console.error('Error fetching league members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch league members' },
        { status: 500 }
      );
    }

    // Get existing picks
    const { data: picks, error: picksError } = await supabaseAdmin
      .from('picks')
      .select('*')
      .eq('league_id', league_id)
      .order('pick_number', { ascending: true });

    if (picksError) {
      console.error('Error fetching picks:', picksError);
      return NextResponse.json(
        { error: 'Failed to fetch picks' },
        { status: 500 }
      );
    }

    const memberCount = members?.length || 0;
    const pickCount = picks?.length || 0;
    const currentRound = memberCount > 0 ? Math.floor(pickCount / memberCount) + 1 : 0;
    const totalRounds = 6;
    const isDraftComplete = pickCount >= (memberCount * totalRounds);

    // Calculate current turn
    let currentPlayerTurn = null;
    let canPick = false;
    
    if (league.status === 'drafting' && !isDraftComplete && members) {
      const sortedMembers = sortMembersByDraftOrder(members);
      const currentTurn = calculateCurrentTurn(pickCount, sortedMembers);
      currentPlayerTurn = currentTurn?.wallet_address || null;
      
      if (wallet_address) {
        canPick = currentPlayerTurn === wallet_address.toLowerCase();
      }
    }

    // Get taken market combinations
    const takenCombinations = picks?.map(pick => ({
      market_id: pick.market_id,
      outcome_side: pick.outcome_side
    })) || [];

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        status: league.status,
        member_count: memberCount
      },
      draft_state: {
        current_pick_number: pickCount,
        current_round: currentRound,
        total_rounds: totalRounds,
        current_player_turn: currentPlayerTurn,
        can_pick: canPick,
        is_complete: isDraftComplete,
        is_active: league.status === 'drafting'
      },
      picks: picks || [],
      taken_combinations: takenCombinations,
      members: members || []
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/draft/pick:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/draft/pick - Remove/undo a pick (only last pick, only by creator)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { league_id, creator_address, pick_id } = body;
    
    if (!league_id || !creator_address) {
      return NextResponse.json(
        { error: 'League ID and creator address are required' },
        { status: 400 }
      );
    }

    const normalizedAddress = creator_address.toLowerCase();

    // Verify league exists and requester is creator
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', league_id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    if (league.creator_address !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Only league creator can undo picks' },
        { status: 403 }
      );
    }

    // Get the last pick if no specific pick_id provided
    let targetPickId = pick_id;
    if (!targetPickId) {
      const { data: lastPick, error: lastPickError } = await supabaseAdmin
        .from('picks')
        .select('*')
        .eq('league_id', league_id)
        .order('pick_number', { ascending: false })
        .limit(1)
        .single();

      if (lastPickError || !lastPick) {
        return NextResponse.json(
          { error: 'No picks found to undo' },
          { status: 404 }
        );
      }

      targetPickId = lastPick.id;
    }

    // Delete the pick
    const { error: deleteError } = await supabaseAdmin
      .from('picks')
      .delete()
      .eq('id', targetPickId)
      .eq('league_id', league_id);

    if (deleteError) {
      console.error('Error deleting pick:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete pick', details: deleteError.message },
        { status: 500 }
      );
    }

    // Update league status back to drafting if it was active
    if (league.status === 'active') {
      await supabaseAdmin
        .from('leagues')
        .update({ status: 'drafting' })
        .eq('id', league_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Pick removed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/draft/pick:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}