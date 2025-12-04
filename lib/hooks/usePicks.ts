'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Pick, PickInsert, PickUpdate } from '@/lib/supabase/types';

export function usePicks(leagueId: string | null, walletAddress?: string) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setPicks([]);
      setLoading(false);
      return;
    }

    fetchPicks();
  }, [leagueId, walletAddress]);

  const fetchPicks = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('picks')
        .select('*')
        .eq('league_id', leagueId)
        .order('pick_number', { ascending: true });

      if (walletAddress) {
        query = query.eq('wallet_address', walletAddress);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPicks(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { picks, loading, error, refetch: fetchPicks };
}

export async function makePick(pick: PickInsert): Promise<Pick> {
  const { data, error } = await supabase
    .from('picks')
    .insert(pick)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePick(
  pickId: string,
  updates: PickUpdate
): Promise<Pick> {
  const { data, error } = await supabase
    .from('picks')
    .update(updates)
    .eq('id', pickId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function swapPickSide(pickId: string): Promise<Pick> {
  // Get current pick
  const { data: currentPick, error: fetchError } = await supabase
    .from('picks')
    .select('*')
    .eq('id', pickId)
    .single();

  if (fetchError) throw fetchError;

  // Swap the outcome side
  const newSide = currentPick.outcome_side === 'YES' ? 'NO' : 'YES';

  return updatePick(pickId, { outcome_side: newSide });
}

export async function isMarketSideTaken(
  leagueId: string,
  marketId: string,
  outcomeSide: 'YES' | 'NO'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('picks')
    .select('id')
    .eq('league_id', leagueId)
    .eq('market_id', marketId)
    .eq('outcome_side', outcomeSide)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
