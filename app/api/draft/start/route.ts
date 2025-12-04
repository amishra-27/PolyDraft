import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateCurrentTurn, sortMembersByDraftOrder } from '@/lib/supabase/draft-utils';

// POST /api/draft/start - Start draft for a league
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { league_id, creator_address } = body;
    
    if (!league_id || !creator_address) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['league_id', 'creator_address']
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!creator_address.startsWith('0x') || creator_address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const normalizedAddress = creator_address.toLowerCase();

    // Check if league exists and get details
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

    // Verify requester is the league creator
    if (league.creator_address !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Only the league creator can start the draft' },
        { status: 403 }
      );
    }

    // Check if league is in correct status
    if (league.status !== 'open') {
      return NextResponse.json(
        { error: 'Draft can only be started for leagues with status "open"' },
        { status: 400 }
      );
    }

    // Get all league members
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

    if (!members || members.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 members are required to start a draft' },
        { status: 400 }
      );
    }

    // Check if draft orders are already assigned
    const hasDraftOrders = members.some(member => member.draft_order !== null);
    if (hasDraftOrders) {
      return NextResponse.json(
        { error: 'Draft has already been started' },
        { status: 400 }
      );
    }

    // Assign random draft orders
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
    
    // Update all members with their draft order
    const draftOrderUpdates = shuffledMembers.map((member, index) => 
      supabaseAdmin
        .from('league_members')
        .update({ draft_order: index })
        .eq('id', member.id)
    );

    // Execute all draft order updates in parallel
    const draftOrderResults = await Promise.all(draftOrderUpdates);
    
    // Check if any draft order updates failed
    const failedUpdates = draftOrderResults.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Some draft order updates failed:', failedUpdates);
      return NextResponse.json(
        { error: 'Failed to assign draft orders to all members' },
        { status: 500 }
      );
    }

    // Update league status to 'drafting'
    const { data: updatedLeague, error: updateError } = await supabaseAdmin
      .from('leagues')
      .update({
        status: 'drafting',
        draft_started_at: new Date().toISOString()
      })
      .eq('id', league_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating league status:', updateError);
      return NextResponse.json(
        { error: 'Failed to start draft', details: updateError.message },
        { status: 500 }
      );
    }

    // Get updated members with draft orders
    const { data: updatedMembers } = await supabaseAdmin
      .from('league_members')
      .select(`
        *,
        users (
          username
        )
      `)
      .eq('league_id', league_id)
      .order('draft_order', { ascending: true });

    // Calculate current turn
    const sortedMembers = sortMembersByDraftOrder(updatedMembers || []);
    const currentTurn = calculateCurrentTurn(0, sortedMembers);

    return NextResponse.json({
      success: true,
      league: updatedLeague,
      members: sortedMembers,
      draft_state: {
        current_pick_number: 0,
        current_round: 1,
        total_rounds: 6, // Default rounds per draft
        current_player_turn: currentTurn?.wallet_address || null,
        is_complete: false
      },
      message: 'Draft started successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in POST /api/draft/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/draft/start - Get draft start status for a league
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league_id = searchParams.get('league_id');

    if (!league_id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Check if league exists and get draft status
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

    // Get existing picks to determine current state
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
    const totalRounds = 6; // Default rounds per draft
    const isDraftComplete = pickCount >= (memberCount * totalRounds);

    // Calculate current turn if draft is active
    let currentPlayerTurn = null;
    if (league.status === 'drafting' && !isDraftComplete && members) {
      const sortedMembers = sortMembersByDraftOrder(members);
      const currentTurn = calculateCurrentTurn(pickCount, sortedMembers);
      currentPlayerTurn = currentTurn?.wallet_address || null;
    }

    const canStart = league.status === 'open' && 
                   memberCount >= 2 && 
                   !members.some(m => m.draft_order !== null);

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        status: league.status,
        creator_address: league.creator_address,
        member_count: memberCount,
        max_players: league.max_players,
        draft_started_at: league.draft_started_at
      },
      members: members || [],
      draft_state: {
        can_start: canStart,
        current_pick_number: pickCount,
        current_round: currentRound,
        total_rounds: totalRounds,
        current_player_turn: currentPlayerTurn,
        is_complete: isDraftComplete,
        is_started: league.status === 'drafting' || league.status === 'active'
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/draft/start:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}