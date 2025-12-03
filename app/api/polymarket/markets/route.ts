import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build Polymarket API URL
  const apiUrl = new URL('https://gamma-api.polymarket.com/markets');

  // Only forward supported Polymarket API parameters
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const closed = searchParams.get('closed');
  const order = searchParams.get('order');
  const ascending = searchParams.get('ascending');
  const tagId = searchParams.get('tag_id');

  // Set query parameters that Polymarket API actually supports
  if (limit) apiUrl.searchParams.set('limit', limit);
  if (offset) apiUrl.searchParams.set('offset', offset);
  if (closed) apiUrl.searchParams.set('closed', closed);
  if (order) apiUrl.searchParams.set('order', order);
  if (ascending) apiUrl.searchParams.set('ascending', ascending);
  if (tagId) apiUrl.searchParams.set('tag_id', tagId);
  
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PolyDraft/1.0',
        // Add your API key here or get from env
        ...(process.env.NEXT_PUBLIC_POLYMARKET_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_POLYMARKET_API_KEY}`
        }),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Polymarket API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl.toString()
      });
      return NextResponse.json(
        { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          url: apiUrl.toString()
        },
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
    
    // More specific error handling
    let errorMessage = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - Polymarket API did not respond in time';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - Unable to reach Polymarket API';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        url: apiUrl.toString()
      },
      { status: statusCode }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
