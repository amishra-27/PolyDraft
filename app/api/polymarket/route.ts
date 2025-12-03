import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build Polymarket API URL
  const apiUrl = new URL('https://gamma-api.polymarket.com/markets');

  // Forward query parameters with defaults for top trending active markets
  const limit = searchParams.get('limit') || '10';
  const active = searchParams.get('active') || 'true';
  const sortBy = searchParams.get('sortBy') || 'volume';
  const order = searchParams.get('order') || 'desc';
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const offset = searchParams.get('offset');

  if (limit) apiUrl.searchParams.set('limit', limit);
  if (active) apiUrl.searchParams.set('active', active);
  if (sortBy) apiUrl.searchParams.set('sortBy', sortBy);
  if (order) apiUrl.searchParams.set('order', order);
  if (category) apiUrl.searchParams.set('category', category);
  if (search) apiUrl.searchParams.set('search', search);
  if (offset) apiUrl.searchParams.set('offset', offset);
  if (category) apiUrl.searchParams.set('category', category);
  if (search) apiUrl.searchParams.set('search', search);
  if (offset) apiUrl.searchParams.set('offset', offset);
  
  try {
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        // Add your API key here or get from env
        ...(process.env.NEXT_PUBLIC_POLYMARKET_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_POLYMARKET_API_KEY}`
        }),
      },
    });

    if (!response.ok) {
      console.error('Polymarket API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl.toString()
      });
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Polymarket API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}