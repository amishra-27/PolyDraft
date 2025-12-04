'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Pick, LeagueMember, League } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DraftState {
  picks: Pick[];
  members: LeagueMember[];
  league: League | null;
  currentPickNumber: number;
  currentPlayerTurn: string | null; // wallet_address
  isConnected: boolean;
}

export function useDraftSync(leagueId: string | null) {
  const [state, setState] = useState<DraftState>({
    picks: [],
    members: [],
    league: null,
    currentPickNumber: 0,
    currentPlayerTurn: null,
    isConnected: false,
  });

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!leagueId) return;

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        // Fetch initial data
        const [leagueRes, membersRes, picksRes] = await Promise.all([
          supabase.from('leagues').select('*').eq('id', leagueId).single(),
          supabase
            .from('league_members')
            .select('*')
            .eq('league_id', leagueId)
            .order('draft_order', { ascending: true }),
          supabase
            .from('picks')
            .select('*')
            .eq('league_id', leagueId)
            .order('pick_number', { ascending: true }),
        ]);

        if (leagueRes.error) throw leagueRes.error;
        if (membersRes.error) throw membersRes.error;
        if (picksRes.error) throw picksRes.error;

        const league = leagueRes.data;
        const members = membersRes.data;
        const picks = picksRes.data;

        // Calculate current turn
        const currentPickNumber = picks.length;
        const currentPlayerTurn = calculateCurrentTurn(
          currentPickNumber,
          members
        );

        setState({
          league,
          members,
          picks,
          currentPickNumber,
          currentPlayerTurn,
          isConnected: true,
        });

        // Set up realtime subscription
        channel = supabase
          .channel(`draft-room:${leagueId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'picks',
              filter: `league_id=eq.${leagueId}`,
            },
            (payload) => {
              const newPick = payload.new as Pick;
              setState((prev) => {
                const updatedPicks = [...prev.picks, newPick];
                const newPickNumber = updatedPicks.length;
                const newPlayerTurn = calculateCurrentTurn(
                  newPickNumber,
                  prev.members
                );

                return {
                  ...prev,
                  picks: updatedPicks,
                  currentPickNumber: newPickNumber,
                  currentPlayerTurn: newPlayerTurn,
                };
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'picks',
              filter: `league_id=eq.${leagueId}`,
            },
            (payload) => {
              const updatedPick = payload.new as Pick;
              setState((prev) => ({
                ...prev,
                picks: prev.picks.map((p) =>
                  p.id === updatedPick.id ? updatedPick : p
                ),
              }));
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'league_members',
              filter: `league_id=eq.${leagueId}`,
            },
            async () => {
              // Refetch members when they change
              const { data, error: membersError } = await supabase
                .from('league_members')
                .select('*')
                .eq('league_id', leagueId)
                .order('draft_order', { ascending: true });

              if (!membersError && data) {
                setState((prev) => {
                  const newPlayerTurn = calculateCurrentTurn(
                    prev.currentPickNumber,
                    data
                  );
                  return {
                    ...prev,
                    members: data,
                    currentPlayerTurn: newPlayerTurn,
                  };
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'leagues',
              filter: `id=eq.${leagueId}`,
            },
            (payload) => {
              const updatedLeague = payload.new as League;
              setState((prev) => ({
                ...prev,
                league: updatedLeague,
              }));
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setState((prev) => ({ ...prev, isConnected: true }));
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setState((prev) => ({ ...prev, isConnected: false }));
            }
          });
      } catch (err) {
        setError(err as Error);
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [leagueId]);

  return { ...state, error };
}

/**
 * Calculate whose turn it is based on snake draft order
 * Snake draft: Round 1 goes 1->2->3, Round 2 goes 3->2->1, etc.
 */
function calculateCurrentTurn(
  pickNumber: number,
  members: LeagueMember[]
): string | null {
  if (members.length === 0) return null;

  const totalPlayers = members.length;
  const round = Math.floor(pickNumber / totalPlayers);
  const positionInRound = pickNumber % totalPlayers;

  // Snake draft: even rounds go forward, odd rounds go backward
  const isForwardRound = round % 2 === 0;
  const playerIndex = isForwardRound
    ? positionInRound
    : totalPlayers - 1 - positionInRound;

  const player = members[playerIndex];
  return player?.wallet_address || null;
}
