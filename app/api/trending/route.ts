import { NextRequest, NextResponse } from 'next/server';

// Gamma API response type for trending markets
interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso?: string;
  endTime?: string;
  lastTradePrice?: number;
  bestBid?: number;
  bestAsk?: number;
  volume24hr?: string;
  volume24hrClob?: string;
  volume1wk?: string;
  volumeNum?: string;
  liquidityNum?: number;
  enableOrderBook?: boolean;
  closed?: boolean;
  active?: boolean;
  oneHourPriceChange?: number;
  oneDayPriceChange?: number;
  outcomePrices?: number[];
}

interface TrendingMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso: string;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  volume24hr: string;
  volume1wk: string;
  volumeNum: string;
  liquidityNum: number;
  oneHourPriceChange?: number;
  oneDayPriceChange?: number;
  spread: number;
  midPrice: number;
}

// Cache response for 2-5 seconds to avoid rate limits
let cachedData: TrendingMarket[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3000; // 3 seconds

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5',
        },
      });
    }

    // Build Gamma API URL with query params
    // Use the same pattern as the existing polymarket route
    const apiUrl = new URL('https://gamma-api.polymarket.com/markets');
    apiUrl.searchParams.set('closed', 'false');
    apiUrl.searchParams.set('limit', '50');
    apiUrl.searchParams.set('active', 'true');
    // Gamma API may not support volume sorting directly, so we'll fetch and sort client-side
    // Just get active markets and we'll filter/sort below

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PolyDraft/1.0',
      },
      // Cache for 2 seconds on the server side
      next: { revalidate: 2 },
    });

    if (!response.ok) {
      console.error('Gamma API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl.toString(),
      });
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const markets: any[] = await response.json();

    // Filter and process markets
    // Gamma API may return different field names, so we handle both formats
    const trendingMarkets: TrendingMarket[] = markets
      .filter((market: any) => {
        // Filter by liquidity threshold - handle different field name variations
        const liquidity = market.liquidityNum ?? parseFloat(market.liquidity || '0');
        const isActive = market.active ?? true;
        const isClosed = market.closed ?? false;
        
        // Only filter by liquidity threshold, active status, and not closed
        // No order book requirement since we're just viewing data
        return liquidity >= 50000 && isActive && !isClosed;
      })
      // Sort by volume24hr descending (handle different field names)
      .sort((a: any, b: any) => {
        const volumeA = parseFloat(a.volume24hr || a.volume24hrClob || a.volume || '0');
        const volumeB = parseFloat(b.volume24hr || b.volume24hrClob || b.volume || '0');
        return volumeB - volumeA;
      })
      .slice(0, 20) // Take top 20
      .map((market: any) => {
        // Handle different field name variations from Gamma API
        const lastPrice = market.lastTradePrice ?? market.outcomePrices?.[0] ?? 0;
        const bestBid = market.bestBid ?? market.outcomePrices?.[0] ?? 0;
        const bestAsk = market.bestAsk ?? market.outcomePrices?.[0] ?? 0;
        const spread = bestAsk - bestBid;
        const midPrice = (bestBid + bestAsk) / 2 || lastPrice;

        // Handle volume fields - Gamma may use different names
        const volume24hr = market.volume24hr || market.volume24hrClob || market.volume || '0';
        const volume1wk = market.volume1wk || market.volume || '0';
        const volumeNum = market.volumeNum || market.volume || '0';
        const liquidityNum = market.liquidityNum ?? parseFloat(market.liquidity || '0');

        return {
          id: market.id,
          question: market.question,
          slug: market.slug,
          endDateIso: market.endDateIso || market.endTime || market.end_date || '',
          lastTradePrice: lastPrice,
          bestBid: bestBid,
          bestAsk: bestAsk,
          volume24hr: String(volume24hr),
          volume1wk: String(volume1wk),
          volumeNum: String(volumeNum),
          liquidityNum: liquidityNum,
          oneHourPriceChange: market.oneHourPriceChange,
          oneDayPriceChange: market.oneDayPriceChange,
          spread: spread,
          midPrice: midPrice,
        };
      });

    // Update cache
    cachedData = trendingMarkets;
    cacheTimestamp = now;

    return NextResponse.json(trendingMarkets, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5',
      },
    });
  } catch (error) {
    console.error('Trending markets API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

