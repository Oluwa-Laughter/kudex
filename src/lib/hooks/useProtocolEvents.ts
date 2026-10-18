'use client';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { z } from 'zod';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { isNetworkConfigured } from '@/lib/chains/portaldot';
const integer = z.string().regex(/^\d+$/);
const snapshot = z.object({
  status: z.literal('observed'),
  fromBlock: integer,
  indexedThrough: integer,
  decimals: z.number().int().min(0).max(255),
  totalDepositEvents: z.number().int().nonnegative(),
  rfqConfigured: z.boolean(),
  totalSettlements: z.number().int().nonnegative(),
  totalVolumeBaseUnits: integer,
  chartSeries: z.array(z.object({ day: z.string(), baseUnits: integer })).max(500),
  observedAt: z.string(),
});
export function useProtocolEvents() {
  return useQuery({
    queryKey: [
      'protocol-events-server-v2',
      CONTRACT_ADDRESSES.vault,
      CONTRACT_ADDRESSES.rfqMarket,
    ],
    enabled: isNetworkConfigured && isVaultConfigured,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/protocol/events', { signal });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error || 'Protocol event data is not configured on this deployment.',
        );
      const parsed = snapshot.safeParse(body);
      if (!parsed.success) throw new Error('The event snapshot could not be validated.');
      const data = parsed.data;
      return {
        ...data,
        fromBlock: BigInt(data.fromBlock),
        indexedThrough: BigInt(data.indexedThrough),
        totalVolumeBigInt: BigInt(data.totalVolumeBaseUnits),
        chartSeries: data.chartSeries
          .map((point) => ({
            day: point.day,
            rawVolumeBigInt: BigInt(point.baseUnits),
            volume: Number(formatUnits(BigInt(point.baseUnits), data.decimals)),
          }))
          .filter((point) => Number.isFinite(point.volume)),
      };
    },
  });
}
