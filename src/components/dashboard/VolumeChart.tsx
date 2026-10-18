'use client';

import { formatUnits } from 'viem';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { getReadableErrorMessage } from '@/lib/utils';

export function VolumeChart() {
  const { data, error, isFetching, refetch } = useProtocolEvents();
  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Recent vault deposits</h2>
          <p className="mt-2 max-w-prose leading-7 text-muted-foreground">
            A recent window of up to 500 blocks, delayed by 12 blocks. This is not
            lifetime volume or a claim of network finality.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="rounded-lg border border-border px-4 py-3"
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive">
          Event data unavailable: {getReadableErrorMessage(error)}
        </p>
      ) : null}
      {!data ? (
        <p role="status">
          {isFetching
            ? 'Loading event data…'
            : 'Event data is unavailable until the network and contract deployment are configured.'}
        </p>
      ) : (
        <>
          <p className="break-words text-2xl tabular-nums">
            {formatUnits(data.totalVolumeBigInt, data.decimals)} collateral units
          </p>
          <p className="text-muted-foreground">
            Blocks {data.fromBlock.toString()}–{data.indexedThrough.toString()}:{' '}
            {data.totalDepositEvents} vault deposits;{' '}
            {data.rfqConfigured
              ? `${data.totalSettlements} RFQ settlements.`
              : 'RFQ feed not configured.'}{' '}
            {error ? 'Showing the last successful result.' : ''}
          </p>
          {data.totalDepositEvents === 0 ? (
            <p>No vault deposits were found in this block window.</p>
          ) : (
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartSeries}>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }}
                  />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 14 }} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-border bg-popover p-3 text-popover-foreground">
                          <p className="mb-1 text-xs text-muted-foreground">
                            Blocks {payload[0].payload.day}
                          </p>
                          {formatUnits(payload[0].payload.rawVolumeBigInt, data.decimals)}{' '}
                          collateral units
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    dataKey="volume"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.12}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </section>
  );
}
