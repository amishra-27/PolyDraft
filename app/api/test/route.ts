import { NextRequest, NextResponse } from 'next/server';

// Simple validation test endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API validation test successful',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/leagues',
      'POST /api/leagues',
      'GET /api/leagues/[id]',
      'PUT /api/leagues/[id]',
      'DELETE /api/leagues/[id]',
      'POST /api/leagues/[id]/join',
      'DELETE /api/leagues/[id]/join',
      'POST /api/draft/start',
      'GET /api/draft/start',
      'POST /api/draft/pick',
      'GET /api/draft/pick',
      'DELETE /api/draft/pick',
      'POST /api/scoring/calculate',
      'GET /api/scoring/calculate'
    ]
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    message: 'POST validation successful',
    received: body,
    timestamp: new Date().toISOString()
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}