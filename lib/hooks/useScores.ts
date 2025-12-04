'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Score, ScoreInsert, ScoreUpdate } from '@/lib/supabase/types';

export function useScores(leagueId: string | null) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setScores([]);
      setLoading(false);
      return;
    }

    fetchScores();
  }, [leagueId]);

  const fetchScores = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('scores')
        .select('*')
        .eq('league_id', leagueId)
        .order('points', { ascending: false })
        .order('updated_at', { ascending: true }); // Tie-breaker

      if (fetchError) throw fetchError;

      // Assign ranks
      const rankedScores = data?.map((score, index) => ({
        ...score,
        rank: index + 1,
      }));

      setScores(rankedScores || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { scores, loading, error, refetch: fetchScores };
}

export async function initializeScore(
  leagueId: string,
  walletAddress: string,
  userId?: string
): Promise<Score> {
  const score: ScoreInsert = {
    league_id: leagueId,
    wallet_address: walletAddress,
    user_id: userId,
    points: 0,
  };

  const { data, error } = await supabase
    .from('scores')
    .insert(score)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScore(
  leagueId: string,
  walletAddress: string,
  updates: ScoreUpdate
): Promise<Score> {
  const { data, error } = await supabase
    .from('scores')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('league_id', leagueId)
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementScore(
  leagueId: string,
  walletAddress: string,
  pointsToAdd: number = 1
): Promise<Score> {
  // Get current score
  const { data: currentScore, error: fetchError } = await supabase
    .from('scores')
    .select('points')
    .eq('league_id', leagueId)
    .eq('wallet_address', walletAddress)
    .single();

  if (fetchError) throw fetchError;

  const newPoints = (currentScore?.points || 0) + pointsToAdd;

  return updateScore(leagueId, walletAddress, { points: newPoints });
}

export async function setWinner(
  leagueId: string,
  winnerAddress: string
): Promise<Score> {
  // First, ensure no one else is marked as winner
  await supabase
    .from('scores')
    .update({ is_winner: false })
    .eq('league_id', leagueId);

  // Mark the winner
  return updateScore(leagueId, winnerAddress, { is_winner: true });
}
