import { NextRequest, NextResponse } from 'next/server';

interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  endTime?: string;
  endDateIso?: string;
  endDate?: string;
  volume24hr?: string | number;
  outcomePrices?: string | number[];
  active?: boolean;
  closed?: boolean;
}

interface DraftMarket {
  id: string;
  question: string;
  slug: string;
  endDateIso: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
}

// Cache response for 10 seconds
let cachedData: DraftMarket[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10_000;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=15',
        },
      });
    }

    // Compute time window
    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0); // Start of today
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(nowDate.getDate() + 7);
    oneWeekFromNow.setHours(23, 59, 59, 999); // End of day 7 days from now

    // Fetch markets with pagination
    let allMarkets: GammaMarket[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const apiUrl = new URL('https://gamma-api.polymarket.com/markets');
      apiUrl.searchParams.set('closed', 'false');
      apiUrl.searchParams.set('limit', String(limit));
      apiUrl.searchParams.set('offset', String(offset));

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PolyDraft/1.0',
        },
        // Disable Next.js cache - responses are too large (>2MB) and we use in-memory caching instead
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error('Gamma API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl.toString(),
        });
        break; // Use what we have
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Gamma API returned non-array response:', typeof data);
        break;
      }

      // If we got no results or fewer than limit, we've reached the end
      if (data.length === 0) {
        break;
      }

      // Deduplicate by ID before adding (in case same market appears in multiple pages)
      const seenIds = new Set(allMarkets.map(m => String(m.id)));
      const newMarkets = data.filter(m => !seenIds.has(String(m.id)));
      
      allMarkets = allMarkets.concat(newMarkets);

      // If we got fewer results than the limit, we've reached the end
      if (data.length < limit) {
        break;
      }

      offset += limit;
    }

    // Helper to parse numbers
    const parseNumber = (value: any): number => {
      if (typeof value === 'number' && !isNaN(value)) return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Filter markets: ending after today and within one week, active, not closed
    const filteredMarkets = allMarkets
      .filter((market: GammaMarket) => {
        const endTime = market.endTime || market.endDateIso || market.endDate;
        if (!endTime) return false;

        const endDate = new Date(endTime);
        if (isNaN(endDate.getTime())) return false;

        // Must be active, not closed, ending after today and within one week
        return (
          market.active === true &&
          market.closed !== true &&
          endDate > nowDate &&
          endDate <= oneWeekFromNow
        );
      })
      .map((market: GammaMarket): DraftMarket | null => {
        try {
          const endTime = market.endTime || market.endDateIso || market.endDate;
          if (!endTime) {
            throw new Error(`Market ${market.id} missing endTime/endDateIso/endDate`);
          }

          // Parse outcomePrices
          if (!market.outcomePrices) {
            throw new Error(`Market ${market.id} missing outcomePrices`);
          }

          let outcomePricesArray: number[] = [];
          if (typeof market.outcomePrices === 'string') {
            try {
              const parsed = JSON.parse(market.outcomePrices);
              if (!Array.isArray(parsed) || parsed.length < 2) {
                throw new Error(`Market ${market.id} outcomePrices is not a valid array with 2 elements`);
              }
              outcomePricesArray = parsed.map((p: any) => parseNumber(p));
            } catch (parseErr) {
              throw new Error(`Market ${market.id} failed to parse outcomePrices: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`);
            }
          } else if (Array.isArray(market.outcomePrices)) {
            if (market.outcomePrices.length < 2) {
              throw new Error(`Market ${market.id} outcomePrices array has less than 2 elements`);
            }
            outcomePricesArray = market.outcomePrices.map((p: any) => parseNumber(p));
          } else {
            throw new Error(`Market ${market.id} outcomePrices is not a string or array`);
          }

          const yesPrice = outcomePricesArray[0];
          const noPrice = outcomePricesArray[1];

          if (isNaN(yesPrice) || isNaN(noPrice)) {
            throw new Error(`Market ${market.id} has invalid price values: YES=${yesPrice}, NO=${noPrice}`);
          }

          // Filter: no outcome probability should exceed 65%
          if (yesPrice > 0.65 || noPrice > 0.65) {
            return null; // Skip this market
          }

          return {
            id: String(market.id),
            question: market.question || 'Unknown Market',
            slug: market.slug || '',
            endDateIso: endTime,
            yesPrice: Math.max(0, Math.min(1, yesPrice)),
            noPrice: Math.max(0, Math.min(1, noPrice)),
            volume24hr: parseNumber(market.volume24hr),
          };
        } catch (err) {
          console.error(`Error processing market ${market.id}:`, err instanceof Error ? err.message : err);
          return null;
        }
      })
      .filter((market): market is DraftMarket => market !== null)
      // Remove duplicates by ID (keep the one with highest volume if duplicates exist)
      .reduce((acc, market) => {
        const existing = acc.find(m => m.id === market.id);
        if (!existing) {
          acc.push(market);
        } else if (market.volume24hr > existing.volume24hr) {
          // Replace with market that has higher volume
          const index = acc.indexOf(existing);
          acc[index] = market;
        }
        return acc;
      }, [] as DraftMarket[])
      // Sort by 24h volume descending
      .sort((a, b) => b.volume24hr - a.volume24hr)
      // Take top 20
      .slice(0, 20);

    // Update cache
    cachedData = filteredMarkets;
    cacheTimestamp = now;

    return NextResponse.json(filteredMarkets, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Draft markets API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

