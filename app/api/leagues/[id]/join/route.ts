import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST /api/leagues/[id]/join - Join an existing league
export async function POST(
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

    // Validate required fields
    const { wallet_address } = body;
    
    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
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

    const normalizedAddress = wallet_address.toLowerCase();

    // Check if league exists and is joinable
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select(`
        *,
        league_members (id, wallet_address)
      `)
      .eq('id', id)
      .single();

    if (leagueError || !league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Check if league is open for joining
    if (league.status !== 'open') {
      return NextResponse.json(
        { error: 'League is not open for joining' },
        { status: 400 }
      );
    }

    // Check if league is full
    const currentMembers = league.league_members?.length || 0;
    if (currentMembers >= (league.max_players || 6)) {
      return NextResponse.json(
        { error: 'League is full' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = league.league_members?.find(
      member => member.wallet_address === normalizedAddress
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this league' },
        { status: 409 }
      );
    }

    // Add user to league
    const { data: member, error: memberError } = await supabaseAdmin
      .from('league_members')
      .insert({
        league_id: id,
        user_id: null, // Will be set when user system is implemented
        wallet_address: normalizedAddress,
        draft_order: null // Will be assigned when draft starts
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error joining league:', memberError);
      
      if (memberError.code === '23505') {
        return NextResponse.json(
          { error: 'Already a member of this league' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to join league', details: memberError.message },
        { status: 500 }
      );
    }

    // Create or update user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        wallet_address: normalizedAddress,
        total_leagues: 1,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false
      });

    if (userError) {
      console.error('Error updating user record:', userError);
      // Don't fail the request, but log the error
    }

    // Check if league is now full and update status if needed
    const { data: updatedMembers } = await supabaseAdmin
      .from('league_members')
      .select('id')
      .eq('league_id', id);

    const memberCount = updatedMembers?.length || 0;
    const maxPlayers = league.max_players || 6;

    if (memberCount >= maxPlayers) {
      // League is full, could optionally auto-start draft or change status
      // For now, we'll leave it as 'open' until creator starts draft
      console.log(`League ${id} is now full with ${memberCount} members`);
    }

    return NextResponse.json({
      success: true,
      member: member,
      league: {
        id: league.id,
        name: league.name,
        member_count: memberCount,
        max_players: maxPlayers,
        status: league.status
      },
      message: 'Successfully joined league'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/leagues/[id]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/leagues/[id]/join - Leave a league
export async function DELETE(
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

    const { wallet_address } = body;
    
    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = wallet_address.toLowerCase();

    // Check if league exists
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

    // Cannot leave if draft has started
    if (league.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot leave league after draft has started' },
        { status: 400 }
      );
    }

    // Check if user is a member
    const { data: member, error: memberError } = await supabaseAdmin
      .from('league_members')
      .select('*')
      .eq('league_id', id)
      .eq('wallet_address', normalizedAddress)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Not a member of this league' },
        { status: 404 }
      );
    }

    // Cannot leave if you're the creator and there are other members
    if (league.creator_address === normalizedAddress) {
      const { data: otherMembers } = await supabaseAdmin
        .from('league_members')
        .select('id')
        .eq('league_id', id)
        .neq('wallet_address', normalizedAddress);

      if (otherMembers && otherMembers.length > 0) {
        return NextResponse.json(
          { error: 'Creator cannot leave league with other members. Transfer ownership first.' },
          { status: 400 }
        );
      }
    }

    // Remove member from league
    const { error: deleteError } = await supabaseAdmin
      .from('league_members')
      .delete()
      .eq('league_id', id)
      .eq('wallet_address', normalizedAddress);

    if (deleteError) {
      console.error('Error leaving league:', deleteError);
      return NextResponse.json(
        { error: 'Failed to leave league', details: deleteError.message },
        { status: 500 }
      );
    }

    // If creator left and was the only member, delete the league
    if (league.creator_address === normalizedAddress) {
      await supabaseAdmin
        .from('leagues')
        .delete()
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left league'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/leagues/[id]/join:', error);
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
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}