'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, UserInsert, UserUpdate } from '@/lib/supabase/types';

export function useUser(walletAddress: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setUser(null);
      setLoading(false);
      return;
    }

    fetchUser();
  }, [walletAddress]);

  const fetchUser = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setUser(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refetch: fetchUser };
}

export async function createUser(userData: UserInsert): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(
  walletAddress: string,
  updates: UserUpdate
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateUser(walletAddress: string): Promise<User> {
  // Try to fetch existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existingUser) {
    return existingUser;
  }

  // Create new user if doesn't exist
  return createUser({ wallet_address: walletAddress });
}

export async function getOrCreateFarcasterUser(fid: number): Promise<User> {
  // Try to fetch existing user by FID
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('fid', fid)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existingUser) {
    return existingUser;
  }

  // Create new user if doesn't exist
  return createUser({ 
    fid,
    auth_method: 'farcaster',
    username: `user_${fid}`, // Default username, can be updated later
    total_leagues: 0,
    total_points: 0,
    wins: 0
  });
}

export async function updateUserProfile(
  fid: number,
  updates: {
    username?: string;
    display_name?: string;
    wallet_address?: string;
  }
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('fid', fid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementUserStats(
  walletAddress: string,
  stats: {
    wins?: number;
    totalLeagues?: number;
    totalPoints?: number;
  }
): Promise<User> {
  // Get current user
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (fetchError) throw fetchError;

  const updates: UserUpdate = {};
  if (stats.wins !== undefined && currentUser.wins !== null) {
    updates.wins = currentUser.wins + stats.wins;
  }
  if (stats.totalLeagues !== undefined && currentUser.total_leagues !== null) {
    updates.total_leagues = currentUser.total_leagues + stats.totalLeagues;
  }
  if (stats.totalPoints !== undefined && currentUser.total_points !== null) {
    updates.total_points = currentUser.total_points + stats.totalPoints;
  }

  return updateUser(walletAddress, updates);
}
