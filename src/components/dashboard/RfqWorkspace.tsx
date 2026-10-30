'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowRight,
  FiFileText,
  FiRepeat,
  FiActivity,
  FiFilter,
  FiSliders,
} from 'react-icons/fi';
import { formatUnits, zeroAddress } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { parseSignedOffer } from '@/lib/contracts/orders';
import { truncateAddress } from '@/lib/utils';
import { RfqRequestBuilder } from './RfqRequestBuilder';
import { RfqOfferBuilder } from './RfqOfferBuilder';
import { RfqOfferReview } from './RfqOfferReview';

const MARKETS = [
  'All Markets',
  'Short-Term Commercial Debt',
  'Tokenized Treasuries',
  'Invoice Factoring',
  'Structured Yield Tranches',
] as const;

type OrderMode = 'limit' | 'fok' | 'dutch';

interface OrderbookEntry {
  id: string;
  side: 'BID' | 'ASK';
  market: (typeof MARKETS)[number];
  mode: OrderMode;
  makerOrRequester: string;
  assetPair: string;
  sizeDisplay: string;
  status: string;
  timestamp: string;
}

export function RfqWorkspace() {
  const [tab, setTab] = useState('request');
  const [selectedMarket, setSelectedMarket] =
    useState<(typeof MARKETS)[number]>('All Markets');
  const [orderMode, setOrderMode] = useState<OrderMode>('limit');
  const [dutchStartBps, setDutchStartBps] = useState('102');
  const [dutchFloorBps, setDutchFloorBps] = useState('98');
  const [raw, setRaw] = useState('');
  const [signed, setSigned] = useState(false);
  const [operating, setOperating] = useState(false);
  const [sessionOrders, setSessionOrders] = useState<OrderbookEntry[]>([]);

  const events = useProtocolEvents();
  const network = useQuery<{ block: string; gasPriceBaseUnits: string }>({
    queryKey: ['rfq-network-feed'],
    staleTime: 15_000,
    refetchInterval: 25_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Network feed unavailable');
      return r.json();
    },
  });

  const activeCategory =
    selectedMarket === 'All Markets' ? 'Tokenized Treasuries' : selectedMarket;

  function recordSignedOffer(payload: string) {
    try {
      const parsed = parseSignedOffer(
        payload,
        420420777,
        CONTRACT_ADDRESSES.rfqMarket,
      );
      setSessionOrders((prev) => [
        {
          id: `${parsed.order.nonce.toString().slice(0, 10)}`,
          side: 'ASK',
          market: activeCategory,
          mode: orderMode,
          makerOrRequester: truncateAddress(parsed.order.maker),
          assetPair: `${truncateAddress(parsed.order.tokenIn)} / ${truncateAddress(parsed.order.tokenOut)}`,
          sizeDisplay: `${parsed.order.amountIn.toString()} -> ${parsed.order.amountOut.toString()} base`,
          status: 'Firm Signed Quote',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch {
      // Ignore parse preview failure; RfqOfferReview validates strictly
    }
  }

  const visibleOrders = sessionOrders.filter(
    (entry) => selectedMarket === 'All Markets' || entry.market === selectedMarket,
  );
  const bids = visibleOrders.filter((e) => e.side === 'BID');
  const asks = visibleOrders.filter((e) => e.side === 'ASK');

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Institutional RFQ Exchange</p>
          <h1 className="page-title">Autonomous Orderbook & Tranche Trading</h1>
          <p className="page-description">
            Filter credit and treasury markets, negotiate signed peer-to-solver quotes,
            and execute atomic full-fill settlements.
          </p>
        </div>
        <Link className="cobalt-action text-sm" href="/app/agents">
          <span>Delegate to KUDEX AGENT</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      {/* Market Filter Bar */}
      <section aria-label="Market filter" className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <FiFilter className="text-primary" aria-hidden="true" />
          <span>Asset & Tranche Market Filter</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((market) => {
            const active = selectedMarket === market;
            return (
              <button
                key={market}
                type="button"
                onClick={() => setSelectedMarket(market)}
                className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {market}
              </button>
            );
          })}
        </div>
      </section>

      {/* Execution Mode Selector */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FiSliders className="text-accent" aria-hidden="true" />
            <span>Execution Structure</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Active Desk: <strong className="text-foreground">{selectedMarket}</strong>
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              id: 'limit' as const,
              title: 'Limit RFQ Order',
              desc: 'Fixed-rate bilateral quote valid until exact block expiry.',
            },
            {
              id: 'fok' as const,
              title: 'Fill-or-Kill Private Swap',
              desc: '100% atomic settlement with zero partial fill leakage.',
            },
            {
              id: 'dutch' as const,
              title: 'Automated Dutch Auction',
              desc: 'Linear price decay schedule inviting competitive solver fills.',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOrderMode(item.id)}
              className={`rounded-xl border p-4 text-left transition ${
                orderMode === item.id
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <p className="text-base font-bold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>

        {orderMode === 'dutch' && (
          <div className="grid gap-4 rounded-xl border border-border bg-secondary p-4 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Opening Premium (%)
              <input
                type="number"
                value={dutchStartBps}
                onChange={(e) => setDutchStartBps(e.target.value)}
                className="field-input mt-1.5 tabular-nums"
              />
            </label>
            <label className="text-sm font-medium">
              Reservation Floor (%)
              <input
                type="number"
                value={dutchFloorBps}
                onChange={(e) => setDutchFloorBps(e.target.value)}
                className="field-input mt-1.5 tabular-nums"
              />
            </label>
            <div className="flex flex-col justify-center">
              <span className="text-sm text-muted-foreground">Auction Clearing Curve</span>
              <span className="mt-1 font-mono text-base font-bold text-primary tabular-nums">
                {dutchStartBps}% → {dutchFloorBps}% linear decay
              </span>
            </div>
          </div>
        )}
      </section>

      {CONTRACT_ADDRESSES.rfqMarket === zeroAddress && (
        <p
          role="status"
          className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground"
        >
          RFQ Settlement Router awaiting contract configuration. Wallet signing unlocks
          automatically once router address is active.
        </p>
      )}

      {/* Main Grid: Order Creation & Settlement + Live Orderbook & Solver Negotiation Feed */}
      <div className="grid items-start gap-7 xl:grid-cols-[1.35fr_0.95fr]">
        <div>
          <Tabs.Root
            value={tab}
            onValueChange={(value) => {
              if (!operating) setTab(value);
            }}
          >
            <Tabs.List
              aria-label="RFQ workflow"
              className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
            >
              <Tabs.Trigger value="request" disabled={operating} className="workspace-tab">
                Create an RFQ
              </Tabs.Trigger>
              <Tabs.Trigger value="review" disabled={operating} className="workspace-tab">
                <FiFileText aria-hidden="true" /> Review an offer
              </Tabs.Trigger>
              <Tabs.Trigger value="create" disabled={operating} className="workspace-tab">
                <FiRepeat aria-hidden="true" /> Create an offer
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="request" forceMount className="data-[state=inactive]:hidden">
              <RfqRequestBuilder
                onBusyChange={setOperating}
                quote={raw}
                onInvitationVerified={(inv) =>
                  setSessionOrders((prev) => [
                    {
                      id: `${Date.now()}`,
                      side: 'BID',
                      market: activeCategory,
                      mode: orderMode,
                      makerOrRequester: truncateAddress(inv.requester),
                      assetPair: `${truncateAddress(inv.buyToken)} / ${truncateAddress(inv.payToken)}`,
                      sizeDisplay: `Min ${inv.minimumBuy} / Max ${inv.maximumPay}`,
                      status: 'Signed RFQ Bid',
                      timestamp: new Date(inv.timestamp).toLocaleTimeString(),
                    },
                    ...prev,
                  ])
                }
              />
            </Tabs.Content>

            <Tabs.Content value="create" forceMount className="data-[state=inactive]:hidden">
              <RfqOfferBuilder
                onBusyChange={setOperating}
                onSigned={(value) => {
                  setRaw(value);
                  setSigned(true);
                  recordSignedOffer(value);
                  setTab('review');
                  requestAnimationFrame(() =>
                    document.getElementById('signed-offer')?.focus(),
                  );
                }}
              />
            </Tabs.Content>

            <Tabs.Content
              value="review"
              forceMount
              className="space-y-6 data-[state=inactive]:hidden"
            >
              {signed && (
                <p role="status" className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary">
                  Offer signed and added to your session orderbook. Approve exact
                  allowance or export JSON for your counterparty.
                </p>
              )}
              <RfqOfferReview
                onBusyChange={setOperating}
                raw={raw}
                onChange={(value) => {
                  setRaw(value);
                  setSigned(false);
                }}
              />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        <aside className="space-y-6">
          {/* Two-Sided Orderbook */}
          <section className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Two-Sided RFQ Orderbook</h2>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary tabular-nums">
                {events.data ? `${events.data.totalSettlements} On-Chain Fills` : 'Live Session'}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary">
                Active Bids (RFQ Invitations · {bids.length})
              </h3>
              {bids.length === 0 ? (
                <p className="rounded-xl bg-secondary p-3.5 text-sm text-muted-foreground">
                  No open session bids in {selectedMarket}. Sign an RFQ invitation to
                  broadcast to connected solvers.
                </p>
              ) : (
                <div className="table-region rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-secondary text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">Requester</th>
                        <th className="px-3 py-2.5">Pair</th>
                        <th className="px-3 py-2.5">Bounds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bids.map((bid) => (
                        <tr key={bid.id}>
                          <td className="px-3 py-2.5 font-mono">{bid.makerOrRequester}</td>
                          <td className="px-3 py-2.5 font-mono">{bid.assetPair}</td>
                          <td className="px-3 py-2.5 font-mono text-primary tabular-nums">
                            {bid.sizeDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-accent">
                Active Asks (Solver Quotes · {asks.length})
              </h3>
              {asks.length === 0 ? (
                <p className="rounded-xl bg-secondary p-3.5 text-sm text-muted-foreground">
                  No firm asks queued in {selectedMarket}. Create a signed offer to post
                  executable liquidity.
                </p>
              ) : (
                <div className="table-region rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-secondary text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5">Maker</th>
                        <th className="px-3 py-2.5">Pair</th>
                        <th className="px-3 py-2.5">Terms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {asks.map((ask) => (
                        <tr key={ask.id}>
                          <td className="px-3 py-2.5 font-mono">{ask.makerOrRequester}</td>
                          <td className="px-3 py-2.5 font-mono">{ask.assetPair}</td>
                          <td className="px-3 py-2.5 font-mono text-accent tabular-nums">
                            {ask.sizeDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Solver Negotiation Feed */}
          <section className="panel space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiActivity className="text-accent" aria-hidden="true" />
                <h2 className="text-xl font-bold">Solver Negotiation Feed</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                KUDEX AGENT
              </span>
            </div>

            <ul className="space-y-3 text-sm">
              <li className="rounded-xl border border-border bg-secondary p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    Settlement Block Sync
                  </span>
                  <span className="font-mono text-primary tabular-nums">
                    {network.data ? `#${network.data.block}` : 'Syncing…'}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground tabular-nums">
                  {network.data
                    ? `Base gas ${formatUnits(BigInt(network.data.gasPriceBaseUnits), 9)} Gwei · Atomic fill router online`
                    : 'Observing live settlement RPC block height and gas conditions.'}
                </p>
              </li>

              <li className="rounded-xl border border-border bg-secondary p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    Indexed On-Chain Fills
                  </span>
                  <span className="font-mono text-accent tabular-nums">
                    {events.data ? `${events.data.totalSettlements} settled` : 'Awaiting router'}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground tabular-nums">
                  {events.data
                    ? `Blocks #${events.data.fromBlock.toString()}–#${events.data.indexedThrough.toString()} · ${events.data.totalDepositEvents} pool movements`
                    : 'Router event stream activates automatically when RFQ contracts are configured.'}
                </p>
              </li>

              {sessionOrders.slice(0, 3).map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-primary/30 bg-primary/5 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">{item.status}</span>
                    <span className="font-mono text-muted-foreground tabular-nums">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-foreground tabular-nums">
                    {item.market} · {item.sizeDisplay}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
