'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type {
  LeagueMember,
  LeagueMemberInsert,
} from '@/lib/supabase/types';

export function useLeagueMembers(leagueId: string | null) {
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    fetchMembers();
  }, [leagueId]);

  const fetchMembers = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', leagueId)
        .order('draft_order', { ascending: true, nullsFirst: false })
        .order('joined_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMembers(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, error, refetch: fetchMembers };
}

export async function joinLeague(
  leagueId: string,
  walletAddress: string,
  userId?: string
): Promise<LeagueMember> {
  const member: LeagueMemberInsert = {
    league_id: leagueId,
    wallet_address: walletAddress,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('league_members')
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function leaveLeague(
  leagueId: string,
  walletAddress: string
): Promise<void> {
  const { error } = await supabase
    .from('league_members')
    .delete()
    .eq('league_id', leagueId)
    .eq('wallet_address', walletAddress);

  if (error) throw error;
}
