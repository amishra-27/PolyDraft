import { createClient } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { User } from '@/lib/supabase/types';

// Get domain from environment or use localhost for development
const domain = process.env.ROOT_URL 
  ? new URL(process.env.ROOT_URL).hostname 
  : 'localhost';

const client = createClient();

// This endpoint verifies JWT token and returns authenticated user data
export async function GET(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
  }

  const token = authorization.split(' ')[1];

  try {
    // Verify JWT token with Farcaster Quick Auth
    const payload = await client.verifyJwt({ token, domain });
    
    // Get or create user in database
    const user = await getOrCreateFarcasterUser(payload.sub);
    
    return NextResponse.json({
      user: {
        id: user.id,
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        wallet_address: user.wallet_address,
        auth_method: user.auth_method,
        created_at: user.created_at,
        total_leagues: user.total_leagues,
        total_points: user.total_points,
        wins: user.wins
      },
      fid: payload.sub,
    });
  } catch (e) {
    console.error('Auth verification error:', e);
    
    const error = e as Error;
    if (error.message?.includes('Invalid token')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (error.message?.includes('expired')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Helper function to get or create user from Farcaster ID
async function getOrCreateFarcasterUser(fid: number): Promise<User> {
  try {
    // Try to find existing user by FID
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('fid', fid)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        fid,
        auth_method: 'farcaster',
        username: `user_${fid}`, // Default username, can be updated later
        total_leagues: 0,
        total_points: 0,
        wins: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newUser;
  } catch (error) {
    console.error('Error in getOrCreateFarcasterUser:', error);
    throw error;
  }
}