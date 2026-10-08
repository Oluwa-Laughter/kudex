'use client';

import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const publicClient = createPublicClient({
  chain: portaldotTestnet,
  transport: http(process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://testnet-evm.portaldot.world'),
});

export interface VolumeDataPoint {
  day: string;
  volume: number;
  potGas: number;
  rawVolumeBigInt: bigint;
}

export function useProtocolEvents() {
  return useQuery({
    queryKey: ['kudex-event-logs'],
    queryFn: async () => {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(5000) ? currentBlock - BigInt(5000) : BigInt(0);

        // Fetch actual on-chain shielded notes
        const shieldLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.vault,
          event: parseAbiItem('event NoteShielded(bytes32 indexed commitment, uint256 assetAmount, uint256 timestamp)'),
          fromBlock,
          toBlock: currentBlock,
        });

        // Fetch actual RFQ settlement logs
        const rfqLogs = await publicClient.getLogs({
          address: CONTRACT_ADDRESSES.rfqMarket,
          event: parseAbiItem('event RFQSettled(bytes32 indexed orderHash, address indexed taker, address maker)'),
          fromBlock,
          toBlock: currentBlock,
        });

        // Aggregate actual volume from on-chain NoteShielded events
        let totalShieldedVolumeWei = BigInt(0);
        for (const log of shieldLogs) {
          if (log.args.assetAmount) {
            totalShieldedVolumeWei += log.args.assetAmount;
          }
        }

        // Build weekday volume buckets from on-chain event timestamps
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const volumeByDay: { [key: string]: { volumeWei: bigint; count: number } } = {
          Mon: { volumeWei: BigInt(0), count: 0 },
          Tue: { volumeWei: BigInt(0), count: 0 },
          Wed: { volumeWei: BigInt(0), count: 0 },
          Thu: { volumeWei: BigInt(0), count: 0 },
          Fri: { volumeWei: BigInt(0), count: 0 },
          Sat: { volumeWei: BigInt(0), count: 0 },
          Sun: { volumeWei: BigInt(0), count: 0 },
        };

        for (const log of shieldLogs) {
          const timestamp = log.args.timestamp ? Number(log.args.timestamp) * 1000 : Date.now();
          const dayName = dayNames[new Date(timestamp).getDay()];
          if (volumeByDay[dayName] && log.args.assetAmount) {
            volumeByDay[dayName].volumeWei += log.args.assetAmount;
            volumeByDay[dayName].count += 1;
          }
        }

        // Generate series array
        const orderDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const chartSeries: VolumeDataPoint[] = orderDays.map((d) => {
          const item = volumeByDay[d];
          // 6 decimals for pUSD
          const volNumeric = Number(item.volumeWei / BigInt(1e6));
          return {
            day: d,
            volume: volNumeric,
            potGas: Number((volNumeric * 0.00014).toFixed(4)),
            rawVolumeBigInt: item.volumeWei,
          };
        });

        return {
          totalShieldEvents: shieldLogs.length,
          totalSettlements: rfqLogs.length,
          totalVolumeBigInt: totalShieldedVolumeWei,
          recentActivity: [...shieldLogs, ...rfqLogs].slice(-10),
          chartSeries,
          isLiveFromChain: true,
        };
      } catch (err) {
        console.warn('Live log querying fallback active:', err);
        // Deterministic BigInt zero state awaiting on-chain indexing
        const orderDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return {
          totalShieldEvents: 0,
          totalSettlements: 0,
          totalVolumeBigInt: BigInt(0),
          recentActivity: [],
          chartSeries: orderDays.map((d) => ({
            day: d,
            volume: 0,
            potGas: 0,
            rawVolumeBigInt: BigInt(0),
          })),
          isLiveFromChain: false,
        };
      }
    },
    refetchInterval: 12_000, // Refresh every Portaldot block interval
  });
}
