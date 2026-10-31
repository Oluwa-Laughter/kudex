'use client';

import { formatUnits } from 'viem';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { getReadableErrorMessage } from '@/lib/utils';

export function VolumeChart() {
  const { data, error, isFetching, refetch } = useProtocolEvents();

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Balance Growth &amp; Settled Payment Volume</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Live business vault deposits and settled swaps recorded across recent
            confirmed blocks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="quiet-link px-3.5 py-2 text-sm"
        >
          <FiRefreshCw className={isFetching ? 'animate-spin' : ''} aria-hidden="true" />
          <span>{isFetching ? 'Syncing…' : 'Refresh'}</span>
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Activity sync paused: {getReadableErrorMessage(error)}
        </p>
      ) : null}

      {!data ? (
        <p role="status" className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
          {isFetching
            ? 'Loading live payment and vault activity…'
            : 'Connect your wallet or configure a business vault to stream live balance growth and payment volume.'}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">Settled Volume</span>
              <p className="mt-1 break-words text-2xl font-bold text-primary tabular-nums">
                {formatUnits(data.totalVolumeBigInt, data.decimals)}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">Vault Deposits</span>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.totalDepositEvents}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">Completed Swaps</span>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {data.rfqConfigured ? data.totalSettlements : 0}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground tabular-nums">
            Confirmed blocks #{data.fromBlock.toString()} – #{data.indexedThrough.toString()}
          </p>

          {data.totalDepositEvents === 0 ? (
            <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              No vault deposits or private payments recorded in this recent block window
              yet. Use the buttons above to make your first deposit or private transfer.
            </p>
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
                        <div className="rounded-xl border border-border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
                          <p className="mb-1 text-sm text-muted-foreground tabular-nums">
                            Window {payload[0].payload.day}
                          </p>
                          <p className="font-bold text-primary tabular-nums">
                            {formatUnits(payload[0].payload.rawVolumeBigInt, data.decimals)}{' '}
                            settled
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    dataKey="volume"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.16}
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
