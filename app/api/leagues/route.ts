import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { League, LeagueInsert } from '@/lib/supabase/types';
import { withAuth, createAuthenticatedResponse, handleOptionsRequest } from '@/lib/auth/middleware';

// GET /api/leagues - List all leagues with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    let query = supabaseAdmin
      .from('leagues')
      .select(`
        *,
        league_members (
          id,
          wallet_address,
          joined_at,
          draft_order
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + (limit ? parseInt(limit) - 1 : 49));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leagues:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leagues', details: error.message },
        { status: 500 }
      );
    }

    // Count members for each league
    const leaguesWithCounts = data?.map(league => ({
      ...league,
      member_count: league.league_members?.length || 0,
      league_members: undefined // Remove members from response for cleaner output
    })) || [];

    return NextResponse.json({
      leagues: leaguesWithCounts,
      count: leaguesWithCounts.length
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/leagues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leagues - Create a new league (requires authentication)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await withAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user } = authResult;
    const body = await request.json();
    
    // Validate required fields
    const { name, end_time, max_players, mode } = body;
    
    if (!name || !end_time) {
      return createAuthenticatedResponse(
        { 
          error: 'Missing required fields',
          required: ['name', 'end_time']
        },
        400
      );
    }

    // Use authenticated user's wallet address or FID
    const creatorAddress = user.wallet_address || `fid:${user.fid}`;

    // Validate end_time is in the future
    const endTime = new Date(end_time);
    if (endTime <= new Date()) {
      return NextResponse.json(
        { error: 'End time must be in the future' },
        { status: 400 }
      );
    }

    // Validate max_players
    const maxPlayers = max_players || 6;
    if (maxPlayers < 2 || maxPlayers > 12) {
      return NextResponse.json(
        { error: 'Max players must be between 2 and 12' },
        { status: 400 }
      );
    }

    // Create league object
    const leagueData: LeagueInsert = {
      name: name.trim(),
      creator_address: creatorAddress.toLowerCase(),
      end_time: endTime.toISOString(),
      max_players: maxPlayers,
      mode: mode || 'social',
      status: 'open',
      on_chain_id: null // Will be set when deployed to blockchain
    };

    // Insert league
    const { data, error } = await supabaseAdmin
      .from('leagues')
      .insert(leagueData)
      .select()
      .single();

    if (error) {
      console.error('Error creating league:', error);
      
      // Handle specific error cases
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'League with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create league', details: error.message },
        { status: 500 }
      );
    }

    // Add creator as first member
    const { error: memberError } = await supabaseAdmin
      .from('league_members')
      .insert({
        league_id: data.id,
        user_id: user.id, // Use authenticated user's ID
        wallet_address: creatorAddress.toLowerCase(),
        draft_order: null
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
      // Don't fail the request, but log the error
    }

    // Create user record if it doesn't exist
    await supabaseAdmin
      .from('users')
      .upsert({
        wallet_address: creator_address.toLowerCase(),
        total_leagues: 1,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address',
        ignoreDuplicates: false
      });

    return NextResponse.json({
      success: true,
      league: data,
      message: 'League created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/leagues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}