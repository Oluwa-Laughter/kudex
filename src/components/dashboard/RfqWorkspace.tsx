'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { FiFileText, FiRepeat, FiSend } from 'react-icons/fi';
import { zeroAddress } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { parseSignedOffer } from '@/lib/contracts/orders';
import { truncateAddress } from '@/lib/utils';
import { RfqRequestBuilder } from './RfqRequestBuilder';
import { RfqOfferBuilder } from './RfqOfferBuilder';
import { RfqOfferReview } from './RfqOfferReview';

interface DirectSwapEntry {
  id: string;
  side: 'REQUEST' | 'OFFER';
  counterparty: string;
  assetPair: string;
  sizeDisplay: string;
  timestamp: string;
}

export function RfqWorkspace() {
  const [tab, setTab] = useState('request');
  const [raw, setRaw] = useState('');
  const [signed, setSigned] = useState(false);
  const [operating, setOperating] = useState(false);
  const [sessionOrders, setSessionOrders] = useState<DirectSwapEntry[]>([]);

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
          side: 'OFFER',
          counterparty: truncateAddress(parsed.order.maker),
          assetPair: `${truncateAddress(parsed.order.tokenIn)} / ${truncateAddress(parsed.order.tokenOut)}`,
          sizeDisplay: `${parsed.order.amountIn.toString()} → ${parsed.order.amountOut.toString()}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch {
      // Validated strictly in RfqOfferReview
    }
  }

  return (
    <div className="space-y-6">
      {CONTRACT_ADDRESSES.rfqMarket === zeroAddress && (
        <p
          role="status"
          className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground"
        >
          Direct on-chain swap contract is awaiting deployment configuration. Wallet
          signing unlocks automatically once active.
        </p>
      )}

      <div className="grid items-start gap-7 xl:grid-cols-[1.35fr_0.95fr]">
        <div>
          <Tabs.Root
            value={tab}
            onValueChange={(value) => {
              if (!operating) setTab(value);
            }}
          >
            <Tabs.List
              aria-label="Direct swap quotes"
              className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
            >
              <Tabs.Trigger value="request" disabled={operating} className="workspace-tab">
                <FiSend aria-hidden="true" /> Request a quote
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
                      side: 'REQUEST',
                      counterparty: truncateAddress(inv.requester),
                      assetPair: `${truncateAddress(inv.buyToken)} / ${truncateAddress(inv.payToken)}`,
                      sizeDisplay: `Min ${inv.minimumBuy} / Max ${inv.maximumPay}`,
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
                <p
                  role="status"
                  className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-primary"
                >
                  Offer signed and ready. Approve exact token allowance or download the
                  signed JSON for your counterparty.
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
          <section className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Signed Session Quotes</h2>
              <span className="emerald-badge tabular-nums">
                {sessionOrders.length} Active
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Direct signed quotes settle atomically in one transaction with zero price
              slippage.
            </p>
            {sessionOrders.length === 0 ? (
              <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                No custom signed quotes in this session yet. Use Best-Price Auto-Routing
                above for 1-click swaps, or create a custom counterparty quote on the
                left.
              </p>
            ) : (
              <div className="table-region rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Account</th>
                      <th className="px-3 py-2.5">Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessionOrders.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-semibold text-primary">
                          {item.side}
                        </td>
                        <td className="px-3 py-2.5 font-mono">{item.counterparty}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold tabular-nums">
                          {item.sizeDisplay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
