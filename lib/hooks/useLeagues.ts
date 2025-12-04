'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { League, LeagueInsert, LeagueUpdate } from '@/lib/supabase/types';

export function useLeagues(status?: League['status']) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, [status]);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('leagues')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setLeagues(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { leagues, loading, error, refetch: fetchLeagues };
}

export function useLeague(leagueId: string | null) {
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) {
      setLeague(null);
      setLoading(false);
      return;
    }

    fetchLeague();
  }, [leagueId]);

  const fetchLeague = async () => {
    if (!leagueId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (fetchError) throw fetchError;
      setLeague(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { league, loading, error, refetch: fetchLeague };
}

export async function createLeague(league: LeagueInsert): Promise<League> {
  const { data, error } = await supabase
    .from('leagues')
    .insert(league)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLeague(
  leagueId: string,
  updates: LeagueUpdate
): Promise<League> {
  const { data, error } = await supabase
    .from('leagues')
    .update(updates)
    .eq('id', leagueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function startDraft(leagueId: string): Promise<League> {
  // Assign draft orders to members randomly
  const { data: members, error: membersError } = await supabase
    .from('league_members')
    .select('*')
    .eq('league_id', leagueId);

  if (membersError) throw membersError;

  // Shuffle members and assign draft order
  const shuffled = [...(members || [])].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const { error: updateError } = await supabase
      .from('league_members')
      .update({ draft_order: i })
      .eq('id', shuffled[i].id);

    if (updateError) throw updateError;
  }

  // Update league status to drafting
  return updateLeague(leagueId, {
    status: 'drafting',
    draft_started_at: new Date().toISOString(),
  });
}
