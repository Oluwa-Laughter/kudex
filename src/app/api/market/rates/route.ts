import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface CachedRatesPayload {
  rates: {
    USDC: number;
    USDT: number;
    WETH: number;
    tPOT: number;
  };
  source: 'live-market' | 'reference-fallback';
  observedAt: string;
}

const REFERENCE_FALLBACK_RATES: CachedRatesPayload['rates'] = {
  USDC: 1,
  USDT: 1,
  WETH: 2650,
  tPOT: 0.42,
};

let cachedRates: { expiresAt: number; payload: CachedRatesPayload } | null = null;

export async function GET() {
  const now = Date.now();
  if (cachedRates && cachedRates.expiresAt > now) {
    return NextResponse.json(cachedRates.payload, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,tether&vs_currencies=usd',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Market feed status ${response.status}`);
    }

    const body = (await response.json()) as {
      ethereum?: { usd?: number };
      'usd-coin'?: { usd?: number };
      tether?: { usd?: number };
    };

    const ethUsd = body.ethereum?.usd;
    const usdcUsd = body['usd-coin']?.usd;
    const usdtUsd = body.tether?.usd;

    if (
      typeof ethUsd !== 'number' ||
      !Number.isFinite(ethUsd) ||
      ethUsd <= 0
    ) {
      throw new Error('Incomplete live rate payload');
    }

    const payload: CachedRatesPayload = {
      rates: {
        USDC:
          typeof usdcUsd === 'number' && Number.isFinite(usdcUsd) && usdcUsd > 0
            ? Number(usdcUsd.toFixed(4))
            : 1,
        USDT:
          typeof usdtUsd === 'number' && Number.isFinite(usdtUsd) && usdtUsd > 0
            ? Number(usdtUsd.toFixed(4))
            : 1,
        WETH: Number(ethUsd.toFixed(2)),
        tPOT: REFERENCE_FALLBACK_RATES.tPOT,
      },
      source: 'live-market',
      observedAt: new Date().toISOString(),
    };

    cachedRates = { expiresAt: now + 60_000, payload };
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    });
  } catch {
    const fallback: CachedRatesPayload = {
      rates: REFERENCE_FALLBACK_RATES,
      source: 'reference-fallback',
      observedAt: new Date().toISOString(),
    };
    cachedRates = { expiresAt: now + 15_000, payload: fallback };
    return NextResponse.json(fallback, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
