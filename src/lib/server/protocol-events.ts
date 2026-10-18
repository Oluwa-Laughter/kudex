import { erc20Abi, parseAbiItem, zeroAddress } from 'viem';
import { rpcClient } from './portaldot';
import { SnapshotCache } from './snapshot-cache';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { assertDeployment } from '@/lib/contracts/readiness';
const eventCache = new SnapshotCache(4, 30_000);
const deposit = parseAbiItem(
  'event Deposit(address indexed sender,address indexed owner,uint256 assets,uint256 shares)',
);
const settlement = parseAbiItem(
  'event RFQSettled(bytes32 indexed orderHash,address indexed taker,address maker)',
);
export function recentProtocolEvents() {
  return eventCache.read('recent-protocol-events', async () => {
    const { vault, rfqMarket, usdc } = CONTRACT_ADDRESSES;
    if ([vault, usdc].includes(zeroAddress)) return { status: 'not-configured' as const };
    await assertDeployment(
      rpcClient,
      rfqMarket === zeroAddress ? [vault, usdc] : [vault, rfqMarket, usdc],
    );
    const head = await rpcClient.getBlockNumber({ cacheTime: 0 });
    // Full replay of a bounded window avoids carrying orphaned logs between snapshots.
    // A 12-block lag is a display heuristic, not a finality guarantee.
    const to = head > 12n ? head - 12n : 0n,
      from = to > 499n ? to - 499n : 0n;
    const buckets = new Map<string, bigint>();
    let total = 0n,
      deposits = 0,
      settlements = 0;
    for (let start = from; start <= to; start += 100n) {
      const end = start + 99n < to ? start + 99n : to;
      const window = `#${start}–${end}`;
      buckets.set(window, 0n);
      const [notes, fills] = await Promise.all([
        rpcClient.getLogs({
          address: vault,
          event: deposit,
          fromBlock: start,
          toBlock: end,
          strict: true,
        }),
        rfqMarket === zeroAddress
          ? Promise.resolve([])
          : rpcClient.getLogs({
              address: rfqMarket,
              event: settlement,
              fromBlock: start,
              toBlock: end,
              strict: true,
            }),
      ]);
      deposits += notes.filter((note) => !note.removed).length;
      settlements += fills.filter((fill) => !fill.removed).length;
      for (const note of notes) {
        if (note.removed) continue;
        // Public deposits and shieldDeposit both emit ERC-4626 Deposit exactly once.
        // Bucket by block window to avoid a separate block-time RPC for every deposit.
        total += note.args.assets;
        buckets.set(window, (buckets.get(window) ?? 0n) + note.args.assets);
      }
    }
    const decimals = await rpcClient.readContract({
      address: usdc,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    return {
      status: 'observed' as const,
      fromBlock: from.toString(),
      indexedThrough: to.toString(),
      decimals,
      totalDepositEvents: deposits,
      rfqConfigured: rfqMarket !== zeroAddress,
      totalSettlements: settlements,
      totalVolumeBaseUnits: total.toString(),
      chartSeries: [...buckets].map(([day, amount]) => ({
        day,
        baseUnits: amount.toString(),
      })),
      observedAt: new Date().toISOString(),
      finality: '12-block display lag; not a finality guarantee',
    };
  });
}
