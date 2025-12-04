import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@farcaster/quick-auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// Get domain from environment or use localhost for development
const domain = process.env.ROOT_URL 
  ? new URL(process.env.ROOT_URL).hostname 
  : 'localhost';

const client = createClient();

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    fid: number;
    username: string;
    display_name: string | null;
    wallet_address: string | null;
    auth_method: string;
  };
}

// Middleware function to verify authentication
export async function withAuth(request: NextRequest): Promise<{ user: any } | NextResponse> {
  const authorization = request.headers.get('Authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' }, 
      { status: 401 }
    );
  }

  const token = authorization.split(' ')[1];

  try {
    // Verify JWT token with Farcaster Quick Auth
    const payload = await client.verifyJwt({ token, domain });
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, fid, username, display_name, wallet_address, auth_method')
      .eq('fid', payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 401 }
      );
    }

    return { user };
  } catch (e) {
    console.error('Auth verification error:', e);
    
    const error = e as Error;
    if (error.message?.includes('Invalid token') || error.message?.includes('expired')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}

// Helper function to add CORS headers to authenticated responses
export function createAuthenticatedResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Helper function to handle OPTIONS requests for CORS
export function handleOptionsRequest(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}