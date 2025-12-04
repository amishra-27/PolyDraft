import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { League, LeagueMember, Pick } from '@/lib/supabase/types';

// GET /api/leagues/[id] - Get league details with members and picks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Fetch league details
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Fetch league members with draft order
    const { data: members, error: membersError } = await supabaseAdmin
      .from('league_members')
      .select(`
        *,
        users (
          username,
          wins,
          total_points
        )
      `)
      .eq('league_id', id)
      .order('draft_order', { ascending: true, nullsFirst: false });

    if (membersError) {
      console.error('Error fetching league members:', membersError);
    }

    // Fetch picks for this league
    const { data: picks, error: picksError } = await supabaseAdmin
      .from('picks')
      .select(`
        *,
        users (
          username
        )
      `)
      .eq('league_id', id)
      .order('pick_number', { ascending: true });

    if (picksError) {
      console.error('Error fetching league picks:', picksError);
    }

    // Fetch scores for this league
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('league_id', id)
      .order('points', { ascending: false });

    if (scoresError) {
      console.error('Error fetching league scores:', scoresError);
    }

    // Calculate draft state
    const memberCount = members?.length || 0;
    const pickCount = picks?.length || 0;
    const currentRound = memberCount > 0 ? Math.floor(pickCount / memberCount) + 1 : 0;
    const totalRounds = 6; // Default rounds per draft
    const isDraftComplete = pickCount >= (memberCount * totalRounds);

    // Determine current turn (if draft is active)
    let currentPlayerTurn = null;
    if (league.status === 'drafting' && !isDraftComplete && members) {
      const round = Math.floor(pickCount / memberCount);
      const positionInRound = pickCount % memberCount;
      const isForwardRound = round % 2 === 0;
      const playerIndex = isForwardRound
        ? positionInRound
        : memberCount - 1 - positionInRound;

      const sortedMembers = members
        .filter(m => m.draft_order !== null)
        .sort((a, b) => (a.draft_order || 0) - (b.draft_order || 0));

      currentPlayerTurn = sortedMembers[playerIndex]?.wallet_address || null;
    }

    return NextResponse.json({
      league: {
        ...league,
        member_count: memberCount,
        current_round: currentRound,
        total_rounds: totalRounds,
        is_draft_complete: isDraftComplete,
        current_player_turn: currentPlayerTurn
      },
      members: members || [],
      picks: picks || [],
      scores: scores || [],
      draft_state: {
        current_pick_number: pickCount,
        current_round: currentRound,
        total_rounds: totalRounds,
        is_complete: isDraftComplete,
        current_player_turn: currentPlayerTurn
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/leagues/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/leagues/[id] - Update league details (limited fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Validate league exists
    const { data: existingLeague, error: fetchError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingLeague) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Only allow certain fields to be updated
    const allowedUpdates = {
      name: body.name?.trim(),
      max_players: body.max_players,
      end_time: body.end_time ? new Date(body.end_time).toISOString() : undefined,
      status: body.status
    };

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validate end_time if provided
    if (updates.end_time && new Date(updates.end_time) <= new Date()) {
      return NextResponse.json(
        { error: 'End time must be in the future' },
        { status: 400 }
      );
    }

    // Validate max_players if provided
    if (updates.max_players && (updates.max_players < 2 || updates.max_players > 12)) {
      return NextResponse.json(
        { error: 'Max players must be between 2 and 12' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses = ['open', 'drafting', 'active', 'ended'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Update league
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating league:', error);
      return NextResponse.json(
        { error: 'Failed to update league', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      league: data,
      message: 'League updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/leagues/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/leagues/[id] - Delete a league (only if no members or creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Check if league exists and get member count
    const { data: league, error: fetchError } = await supabaseAdmin
      .from('leagues')
      .select(`
        *,
        league_members (id)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Only allow deletion if league has no members or is in 'open' status
    const memberCount = league.league_members?.length || 0;
    if (memberCount > 0 && league.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot delete league with members. Change status to open first.' },
        { status: 400 }
      );
    }

    // Delete league (cascade will handle related records)
    const { error } = await supabaseAdmin
      .from('leagues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting league:', error);
      return NextResponse.json(
        { error: 'Failed to delete league', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'League deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/leagues/[id]:', error);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}