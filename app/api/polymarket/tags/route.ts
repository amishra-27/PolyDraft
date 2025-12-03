import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://gamma-api.polymarket.com/tags', {
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
      console.error('Polymarket Tags API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: 'https://gamma-api.polymarket.com/tags'
      });
      return NextResponse.json(
        { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          url: 'https://gamma-api.polymarket.com/tags'
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
    console.error('Polymarket Tags API Error:', error);
    
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
        url: 'https://gamma-api.polymarket.com/tags'
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
