import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST /api/scoring/calculate - Calculate scores for a league
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { league_id, force_recalculate } = body;
    
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

    // Only calculate scores for active or ended leagues
    if (!league.status || !['active', 'ended'].includes(league.status)) {
      return NextResponse.json(
        { error: 'Scores can only be calculated for active or ended leagues' },
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

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: 'No members found in league' },
        { status: 400 }
      );
    }

    // Get all picks for the league
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

    if (!picks || picks.length === 0) {
      return NextResponse.json(
        { error: 'No picks found for this league' },
        { status: 400 }
      );
    }

    // Get existing scores to check if recalculation is needed
    const { data: existingScores, error: scoresError } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('league_id', league_id);

    if (scoresError) {
      console.error('Error fetching existing scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch existing scores' },
        { status: 500 }
      );
    }

    // Check if scores are already calculated and force_recalculate is false
    if (!force_recalculate && existingScores && existingScores.length > 0) {
      return NextResponse.json({
        success: true,
        scores: existingScores.sort((a, b) => (b.points || 0) - (a.points || 0)),
        message: 'Scores already calculated. Use force_recalculate=true to recalculate.'
      });
    }

    // Calculate scores for each member
    const scoreResults = await Promise.all(
      members.map(async (member) => {
        const memberPicks = picks.filter(pick => pick.wallet_address === member.wallet_address);
        let totalPoints = 0;
        let correctPicks = 0;
        let resolvedPicks = 0;

        // Calculate points for each pick
        for (const pick of memberPicks) {
          if (pick.resolved && pick.correct !== null) {
            resolvedPicks++;
            if (pick.correct) {
              correctPicks++;
              // Base points for correct pick
              totalPoints += 10;
              
              // Bonus points based on market resolution confidence
              try {
                const marketResponse = await fetch(`https://gamma-api.polymarket.com/markets/${pick.market_id}`);
                if (marketResponse.ok) {
                  const market = await marketResponse.json();
                  
                  // Bonus points for high-volume markets
                  const volume = parseFloat(market.volume24hr || '0');
                  if (volume > 100000) totalPoints += 5; // High volume bonus
                  else if (volume > 50000) totalPoints += 3; // Medium volume bonus
                  else if (volume > 10000) totalPoints += 1; // Low volume bonus
                  
                  // Bonus points for early picks (snake draft advantage)
                  const totalPlayers = members.length;
                  const round = Math.floor((pick.pick_number - 1) / totalPlayers) + 1;
                  if (round <= 2) totalPoints += 2; // Early round bonus
                }
              } catch (error) {
                console.error(`Error fetching market ${pick.market_id}:`, error);
                // Continue with base points if market fetch fails
              }
            }
          }
        }

        // Accuracy bonus
        if (resolvedPicks > 0) {
          const accuracy = correctPicks / resolvedPicks;
          if (accuracy >= 0.8) totalPoints += 10; // High accuracy bonus
          else if (accuracy >= 0.6) totalPoints += 5; // Medium accuracy bonus
          else if (accuracy >= 0.4) totalPoints += 2; // Low accuracy bonus
        }

        return {
          league_id,
          user_id: member.user_id,
          wallet_address: member.wallet_address,
          points: totalPoints,
          rank: 0, // Will be calculated after all scores are computed
          is_winner: false, // Will be determined after ranking
          updated_at: new Date().toISOString(),
          stats: {
            total_picks: memberPicks.length,
            correct_picks: correctPicks,
            resolved_picks: resolvedPicks,
            accuracy: resolvedPicks > 0 ? (correctPicks / resolvedPicks) : 0
          }
        };
      })
    );

    // Sort scores by points to determine ranks
    const sortedScores = scoreResults.sort((a, b) => b.points - a.points);
    
    // Assign ranks and determine winners
    sortedScores.forEach((score, index) => {
      score.rank = index + 1;
      score.is_winner = index === 0; // First place is winner
    });

    // Delete existing scores if force recalculate
    if (force_recalculate && existingScores && existingScores.length > 0) {
      await supabaseAdmin
        .from('scores')
        .delete()
        .eq('league_id', league_id);
    }

    // Insert new scores
    const { data: insertedScores, error: insertError } = await supabaseAdmin
      .from('scores')
      .insert(
        sortedScores.map(({ stats, ...score }) => score) // Remove stats from insert
      )
      .select();

    if (insertError) {
      console.error('Error inserting scores:', insertError);
      return NextResponse.json(
        { error: 'Failed to save scores', details: insertError.message },
        { status: 500 }
      );
    }

    // Update user statistics
    await Promise.all(
      sortedScores.map(async (score) => {
        // Get current user stats
        const { data: currentUser } = await supabaseAdmin
          .from('users')
          .select('wins, total_points')
          .eq('wallet_address', score.wallet_address)
          .single();

        const currentWins = currentUser?.wins || 0;
        const currentPoints = currentUser?.total_points || 0;

        if (score.is_winner) {
          // Increment wins for winner
          await supabaseAdmin
            .from('users')
            .update({ 
              wins: currentWins + 1,
              total_points: currentPoints + score.points
            })
            .eq('wallet_address', score.wallet_address);
        } else {
          // Just increment total points for others
          await supabaseAdmin
            .from('users')
            .update({ 
              total_points: currentPoints + score.points
            })
            .eq('wallet_address', score.wallet_address);
        }
      })
    );

    // Combine scores with detailed stats
    const scoresWithStats = insertedScores?.map(score => {
      const detailedScore = sortedScores.find(s => s.wallet_address === score.wallet_address);
      return {
        ...score,
        stats: detailedScore?.stats
      };
    }) || [];

    return NextResponse.json({
      success: true,
      scores: scoresWithStats.sort((a, b) => (a.rank || 0) - (b.rank || 0)),
      summary: {
        total_players: members.length,
        total_picks: picks.length,
        resolved_picks: picks.filter(p => p.resolved).length,
        correct_picks: picks.filter(p => p.resolved && p.correct).length,
        winner: sortedScores[0]?.wallet_address || null,
        calculation_time: new Date().toISOString()
      },
      message: 'Scores calculated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in POST /api/scoring/calculate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/scoring/calculate - Get current scores for a league
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

    // Get current scores
    const { data: scores, error: scoresError } = await supabaseAdmin
      .from('scores')
      .select(`
        *,
        users (
          username,
          wins,
          total_points
        )
      `)
      .eq('league_id', league_id)
      .order('rank', { ascending: true });

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    // Get picks for additional stats
    const { data: picks, error: picksError } = await supabaseAdmin
      .from('picks')
      .select('*')
      .eq('league_id', league_id);

    if (picksError) {
      console.error('Error fetching picks:', picksError);
      return NextResponse.json(
        { error: 'Failed to fetch picks for stats' },
        { status: 500 }
      );
    }

    // Calculate additional stats for each score
    const scoresWithStats = scores?.map(score => {
      const memberPicks = picks?.filter(pick => pick.wallet_address === score.wallet_address) || [];
      const correctPicks = memberPicks.filter(pick => pick.resolved && pick.correct).length;
      const resolvedPicks = memberPicks.filter(pick => pick.resolved).length;
      
      return {
        ...score,
        stats: {
          total_picks: memberPicks.length,
          correct_picks: correctPicks,
          resolved_picks: resolvedPicks,
          accuracy: resolvedPicks > 0 ? correctPicks / resolvedPicks : 0
        }
      };
    }) || [];

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        status: league.status
      },
      scores: scoresWithStats,
      summary: {
        total_players: scores?.length || 0,
        total_picks: picks?.length || 0,
        resolved_picks: picks?.filter(p => p.resolved).length || 0,
        correct_picks: picks?.filter(p => p.resolved && p.correct).length || 0,
        has_scores: scores && scores.length > 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/scoring/calculate:', error);
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