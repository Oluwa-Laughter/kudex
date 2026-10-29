'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Tabs from '@radix-ui/react-tabs';
import { FiArrowRight, FiFileText, FiRepeat } from 'react-icons/fi';
import { zeroAddress } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { RfqRequestBuilder } from './RfqRequestBuilder';
import { RfqOfferBuilder } from './RfqOfferBuilder';
import { RfqOfferReview } from './RfqOfferReview';

export function RfqWorkspace() {
  const [tab, setTab] = useState('request');
  const [raw, setRaw] = useState('');
  const [signed, setSigned] = useState(false);
  const [operating, setOperating] = useState(false);
  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">RFQ marketplace</p>
          <h1 className="page-title">Negotiate. Review. Settle.</h1>
          <p className="page-description">
            Request institutional liquidity, exchange signed quotes, and review exact
            token movements before public atomic settlement.
          </p>
        </div>
        <Link className="quiet-link" href="/app/agents">
          Ask Kudex Agent <FiArrowRight aria-hidden="true" />
        </Link>
      </header>
      {CONTRACT_ADDRESSES.rfqMarket === zeroAddress && (
        <p
          role="status"
          className="rounded-xl border border-border px-5 py-4 text-sm leading-6"
        >
          Router deployment pending. Wallet actions unlock after deployment is verified.
        </p>
      )}
      <details className="rounded-xl bg-secondary px-5 text-sm leading-6">
        <summary className="min-h-12 cursor-pointer py-3 font-medium">
          Public offers · Full fills only
        </summary>
        <p className="pb-5">
          Anyone holding a signature can fill its complete terms. There is no hosted
          orderbook, solver feed, auction, or private swap service yet. Verify token
          contract addresses; transfer-tax and rebasing assets are unsupported.
        </p>
      </details>
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
          <RfqRequestBuilder onBusyChange={setOperating} quote={raw} />
        </Tabs.Content>
        <Tabs.Content value="create" forceMount className="data-[state=inactive]:hidden">
          <RfqOfferBuilder
            onBusyChange={setOperating}
            onSigned={(value) => {
              setRaw(value);
              setSigned(true);
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
            <p role="status" className="rounded-xl bg-secondary p-5">
              Signature created. Download the offer and review token allowance before
              sharing it. No trade was submitted.
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
  );
}
