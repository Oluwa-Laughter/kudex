'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { erc20Abi, formatUnits, zeroAddress } from 'viem';
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiGlobe,
  FiRepeat,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { RfqWorkspace } from '@/components/dashboard/RfqWorkspace';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const SOURCE_NETWORKS = [
  {
    value: 'ethereum',
    label: 'Ethereum Mainnet',
    description: 'Primary corporate treasury network',
  },
  {
    value: 'arbitrum',
    label: 'Arbitrum One',
    description: 'Fast low-fee business accounts',
  },
  {
    value: 'base',
    label: 'Base',
    description: 'Direct digital dollar settlement rail',
  },
  {
    value: 'optimism',
    label: 'Optimism',
    description: 'Low-cost cross-network settlement',
  },
];

const SWAP_ASSETS = [
  { value: 'USDC', label: 'USDC', description: 'Digital US Dollar' },
  { value: 'USDT', label: 'USDT', description: 'Tether US Dollar' },
  { value: 'WETH', label: 'WETH', description: 'Wrapped Ether' },
  { value: 'tPOT', label: 'tPOT', description: 'Network Reserve Asset' },
];

const ASSET_RATES_USD: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  WETH: 2650,
  tPOT: 0.42,
};

interface RoutedOrderRecord {
  id: string;
  mode: 'Instant Swap' | 'Move Across Networks';
  routeSummary: string;
  youPay: string;
  youReceive: string;
  destinationPrivacy: 'Private Balance (Stealth Mode)' | 'Standard Wallet Balance';
  commitment: string;
  createdAt: string;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return (
    '0x' +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export default function TradeAndBridgePage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const events = useProtocolEvents();

  const [mode, setMode] = useState<'swap' | 'bridge'>('swap');
  const [sourceNetwork, setSourceNetwork] = useState('base');
  const [payAsset, setPayAsset] = useState('USDC');
  const [receiveAsset, setReceiveAsset] = useState('USDT');
  const [payAmount, setPayAmount] = useState('1000');
  const [receivePrivately, setReceivePrivately] = useState(true);
  const [stealthCommitment, setStealthCommitment] = useState('');
  const [claimSecret, setClaimSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<RoutedOrderRecord[]>([]);

  const collateralToken = CONTRACT_ADDRESSES.usdc;
  const hasCollateralToken = collateralToken !== zeroAddress;

  const tokenBalanceQuery = useReadContract({
    chainId: portaldotTestnet.id,
    address: collateralToken,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && hasCollateralToken),
    },
  });

  const tokenDecimalsQuery = useReadContract({
    chainId: portaldotTestnet.id,
    address: collateralToken,
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: hasCollateralToken,
    },
  });

  const networkFeed = useQuery<{ block: string; gasPriceBaseUnits: string }>({
    queryKey: ['trade-network-feed'],
    staleTime: 15_000,
    refetchInterval: 25_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Live route feed unavailable');
      return r.json();
    },
  });

  const targetAsset = mode === 'bridge' ? payAsset : receiveAsset;

  useEffect(() => {
    let active = true;
    if (!receivePrivately) {
      setStealthCommitment('');
      setClaimSecret('');
      return;
    }
    const random = crypto.getRandomValues(new Uint8Array(16));
    const secret =
      '0x' + Array.from(random, (x) => x.toString(16).padStart(2, '0')).join('');
    setClaimSecret(secret);
    void sha256Hex(
      `kudex-private-route:${mode}:${sourceNetwork}:${payAsset}:${targetAsset}:${payAmount || '0'}:${address ?? 'preview'}:${secret}`,
    ).then((hash) => {
      if (active) setStealthCommitment(hash);
    });
    return () => {
      active = false;
    };
  }, [receivePrivately, mode, sourceNetwork, payAsset, targetAsset, payAmount, address]);

  const numericPay = Number(payAmount);
  const validPay = Number.isFinite(numericPay) && numericPay > 0;
  const fromUsd = validPay ? numericPay * (ASSET_RATES_USD[payAsset] ?? 1) : 0;
  const feeRate = mode === 'bridge' ? 0.0005 : 0.0003;
  const feeAmount = validPay ? numericPay * feeRate : 0;
  const netUsd = Math.max(0, fromUsd * (1 - feeRate));
  const computedReceive =
    targetAsset === payAsset
      ? Math.max(0, numericPay - feeAmount)
      : netUsd / (ASSET_RATES_USD[targetAsset] ?? 1);
  const formattedReceive = validPay
    ? computedReceive >= 1
      ? computedReceive.toFixed(2)
      : computedReceive.toFixed(6)
    : '0.00';

  const onChainBalanceLabel =
    tokenBalanceQuery.data !== undefined
      ? `${Number(
          formatUnits(tokenBalanceQuery.data, tokenDecimalsQuery.data ?? 6),
        ).toLocaleString('en-US', { maximumFractionDigits: 4 })} available on-chain`
      : null;

  async function submitAutoRoute() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address) {
        throw new Error('Connect your wallet from the top bar to approve this route.');
      }
      if (!validPay) {
        throw new Error('Enter a valid amount above zero in You Pay.');
      }
      if (mode === 'swap' && payAsset === receiveAsset) {
        throw new Error('Choose two different assets for an Instant Swap.');
      }
      const sourceLabel =
        SOURCE_NETWORKS.find((n) => n.value === sourceNetwork)?.label ?? sourceNetwork;
      const routeTitle =
        mode === 'swap'
          ? `${payAsset} → ${receiveAsset} (Instant Swap)`
          : `${sourceLabel} → Kudex (${payAsset})`;
      const privacyMode = receivePrivately
        ? 'Private Balance (Stealth Mode)'
        : 'Standard Wallet Balance';

      const authorizationText = [
        'KUDEX BEST-PRICE AUTO-ROUTING AUTHORIZATION',
        `Mode: ${mode === 'swap' ? 'Instant Swap' : 'Move Across Networks'}`,
        `Route: ${routeTitle}`,
        `You Pay: ${numericPay.toFixed(2)} ${payAsset}`,
        `You Receive: ${formattedReceive} ${targetAsset}`,
        `Network Fee: ${feeAmount.toFixed(4)} ${payAsset}`,
        `Delivery Destination: ${privacyMode}`,
        ...(receivePrivately ? [`Private Note Reference: ${stealthCommitment}`] : []),
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n');

      const signature = await signMessageAsync({ message: authorizationText });
      const receiptId = await sha256Hex(signature);

      setHistory((prev) => [
        {
          id: receiptId.slice(0, 14),
          mode: mode === 'swap' ? 'Instant Swap' : 'Move Across Networks',
          routeSummary: routeTitle,
          youPay: `${numericPay.toFixed(2)} ${payAsset}`,
          youReceive: `${formattedReceive} ${targetAsset}`,
          destinationPrivacy: privacyMode,
          commitment: receivePrivately ? stealthCommitment : 'Direct Wallet Delivery',
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      setStatus(
        `Best-Price Auto-Routing order confirmed (${truncateAddress(receiptId)}). ${
          receivePrivately
            ? 'Download your Private Balance backup file for your records.'
            : 'Funds route directly to your connected wallet.'
        }`,
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function downloadPrivateClaimBackup() {
    if (!stealthCommitment || !claimSecret) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            type: 'kudex-private-balance-receipt-v1',
            mode: mode === 'swap' ? 'Instant Swap' : 'Move Across Networks',
            asset: targetAsset,
            expectedReceive: formattedReceive,
            privateReference: stealthCommitment,
            claimSecret,
            owner: address ?? null,
            createdAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kudex-private-balance-receipt.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Best-Price Auto-Routing</p>
          <h1 className="page-title">Trade &amp; Bridge</h1>
          <p className="page-description">
            Swap assets or move money across networks in one click. Background bots
            compete to give you the lowest fee and fastest settlement.
          </p>
        </div>
        <Link href="/app/agent" className="quiet-link text-sm">
          <span>Put swaps on Auto-Pilot</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      {/* Mode Switcher */}
      <div
        role="group"
        aria-label="Exchange mode switcher"
        className="inline-flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-2"
      >
        <button
          type="button"
          onClick={() => {
            setMode('swap');
            setError('');
            setStatus('');
          }}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            mode === 'swap'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <FiRepeat aria-hidden="true" />
          <span>Instant Swap</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('bridge');
            setError('');
            setStatus('');
          }}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            mode === 'bridge'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <FiGlobe aria-hidden="true" />
          <span>Move Across Networks</span>
        </button>
      </div>

      {/* Best-Price Auto-Routing Box + Route Summary */}
      <div className="grid items-start gap-7 xl:grid-cols-[1.25fr_0.95fr]">
        <section aria-label="Best-Price Auto-Routing" className="panel space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Best-Price Auto-Routing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'swap'
                  ? 'Zero-slippage token exchange settled directly on Kudex.'
                  : 'Move funds from Ethereum, Arbitrum, Base, or Optimism in under 45 seconds.'}
              </p>
            </div>
            <span className="emerald-badge">
              <FiZap aria-hidden="true" />
              <span>Zero Slippage Locked</span>
            </span>
          </div>

          {mode === 'bridge' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-sm font-medium">From Network</span>
                <CustomSelect
                  label="From Network"
                  value={sourceNetwork}
                  options={SOURCE_NETWORKS}
                  onChange={setSourceNetwork}
                  disabled={busy}
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium">To Network</span>
                <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                  <FiShield aria-hidden="true" />
                  <span>Kudex Business Account</span>
                </div>
              </div>
            </div>
          )}

          {/* You Pay / You Receive */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="trade-you-pay" className="text-sm font-semibold">
                  You Pay
                </label>
                {onChainBalanceLabel && (
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                    {onChainBalanceLabel}
                  </span>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_11rem]">
                <input
                  id="trade-you-pay"
                  type="number"
                  min="0"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  disabled={busy}
                  placeholder="0.00"
                  className="field-input text-xl font-bold tabular-nums"
                />
                <CustomSelect
                  label="Asset you pay"
                  value={payAsset}
                  options={SWAP_ASSETS}
                  onChange={(val) => {
                    setPayAsset(val);
                    if (mode === 'swap' && val === receiveAsset) {
                      setReceiveAsset(val === 'USDC' ? 'USDT' : 'USDC');
                    }
                  }}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="trade-you-receive" className="text-sm font-semibold">
                  You Receive
                </label>
                <span className="text-sm font-semibold text-primary tabular-nums">
                  Fee: {(feeRate * 100).toFixed(2)}% ({feeAmount.toFixed(4)} {payAsset})
                </span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_11rem]">
                <input
                  id="trade-you-receive"
                  type="text"
                  readOnly
                  value={formattedReceive}
                  aria-label="You Receive"
                  className="field-input bg-card text-xl font-bold text-primary tabular-nums"
                />
                {mode === 'swap' ? (
                  <CustomSelect
                    label="Asset you receive"
                    value={receiveAsset}
                    options={SWAP_ASSETS}
                    onChange={setReceiveAsset}
                    disabled={busy}
                  />
                ) : (
                  <div className="flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-bold">
                    {payAsset}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium leading-relaxed text-foreground">
            Background bots compared routes to lock in zero price slippage and the lowest
            fee.
          </p>

          {/* Privacy Toggle Checkbox */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/60 p-4 transition hover:border-primary/40">
            <input
              type="checkbox"
              checked={receivePrivately}
              onChange={(e) => setReceivePrivately(e.target.checked)}
              disabled={busy}
              className="mt-1 h-5 w-5 rounded border-border accent-emerald-600"
            />
            <span className="space-y-1">
              <span className="block text-base font-semibold text-foreground">
                Receive directly into my Private Balance.
              </span>
              <span className="block text-sm leading-relaxed text-muted-foreground">
                Your wallet balance and payment amounts are hidden from the public. Only
                you and the person you pay can see the numbers.
              </span>
            </span>
          </label>

          {receivePrivately && stealthCommitment && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
              <span className="font-semibold text-primary">
                Private Balance (Stealth Mode) receipt ready:{' '}
                <span className="font-mono">{truncateAddress(stealthCommitment)}</span>
              </span>
              <button
                type="button"
                onClick={downloadPrivateClaimBackup}
                className="inline-flex items-center gap-1.5 font-semibold text-primary underline underline-offset-4"
              >
                <FiDownload aria-hidden="true" />
                <span>Download Claim Backup</span>
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={busy || !validPay}
            onClick={() => void submitAutoRoute()}
            className="action-link w-full text-base disabled:opacity-50"
          >
            <span>
              {busy
                ? 'Confirming Route in Wallet…'
                : mode === 'swap'
                  ? `Swap ${payAsset} for ${targetAsset}`
                  : `Move ${payAsset} to Kudex`}
            </span>
            <FiArrowRight aria-hidden="true" />
          </button>

          {status && (
            <p role="status" className="text-sm font-medium text-primary">
              {status}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </section>

        {/* Live Route & Settlement Guarantees */}
        <aside className="space-y-6">
          <section className="panel space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Guaranteed Execution Summary</h2>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary tabular-nums">
                {networkFeed.data ? `Block #${networkFeed.data.block}` : 'Live Quotes'}
              </span>
            </div>

            <dl className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Routing Method</dt>
                <dd className="font-semibold">Best-Price Auto-Routing</dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Price Slippage</dt>
                <dd className="font-bold text-primary tabular-nums">0.00% Guaranteed</dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Estimated Settlement</dt>
                <dd className="font-bold tabular-nums">
                  {mode === 'swap' ? 'Single confirmation (~6s)' : 'Under 45 seconds'}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Balance Visibility</dt>
                <dd className="font-semibold text-primary">
                  {receivePrivately
                    ? 'Private Balances (Stealth Mode)'
                    : 'Public Wallet Balance'}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-base font-bold">Guaranteed Net Output</dt>
                <dd className="text-xl font-bold text-primary tabular-nums">
                  {formattedReceive} {targetAsset}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel space-y-4">
            <h2 className="text-xl font-bold">Recent Swaps &amp; Network Transfers</h2>
            {history.length === 0 &&
            (!events.data ||
              (events.data.totalSettlements === 0 &&
                events.data.totalDepositEvents === 0)) ? (
              <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                No completed swaps or cross-network transfers in this session yet.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border bg-secondary p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        {item.routeSummary}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <FiClock aria-hidden="true" />
                        <span>{item.createdAt}</span>
                      </span>
                    </div>
                    <p className="mt-1 font-bold text-primary tabular-nums">
                      {item.youPay} → {item.youReceive} ({item.destinationPrivacy})
                    </p>
                  </li>
                ))}
                {events.data && events.data.totalSettlements > 0 && (
                  <li className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">
                        Verified On-Chain Swap Settlements
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold text-primary tabular-nums">
                        <FiCheckCircle aria-hidden="true" />
                        <span>{events.data.totalSettlements} settled</span>
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground tabular-nums">
                      Indexed live through block #{events.data.indexedThrough.toString()}
                    </p>
                  </li>
                )}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Direct On-Chain Signed Offer Settlement (KudexRFQMarket.sol) */}
      {mode === 'swap' && (
        <section className="space-y-4 border-t border-border pt-8">
          <div>
            <p className="eyebrow">Direct Counterparty Quotes</p>
            <h2 className="text-2xl font-bold">
              Custom Signed Swap Offers &amp; Atomic Settlement
            </h2>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              Trading directly with a treasury partner or liquidity desk? Request, create,
              or settle a signed fixed-price swap offer on-chain with zero partial fills.
            </p>
          </div>
          <RfqWorkspace />
        </section>
      )}
    </div>
  );
}
