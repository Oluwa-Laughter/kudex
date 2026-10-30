'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import { formatUnits } from 'viem';
import {
  FiGlobe,
  FiShield,
  FiZap,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDownload,
} from 'react-icons/fi';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const SOURCE_CHAINS = [
  {
    value: 'ethereum',
    label: 'Ethereum Mainnet',
    description: 'Canonical institutional liquidity settlement',
  },
  {
    value: 'arbitrum',
    label: 'Arbitrum One',
    description: 'High-throughput L2 treasury liquidity',
  },
  {
    value: 'base',
    label: 'Base',
    description: 'Direct corporate USDC settlement rail',
  },
  {
    value: 'optimism',
    label: 'Optimism',
    description: 'Low-latency Rollup liquidity corridor',
  },
];

const ASSETS = [
  { value: 'USDC', label: 'USDC', description: 'USD Coin · 6 decimals' },
  { value: 'USDT', label: 'USDT', description: 'Tether USD · 6 decimals' },
  { value: 'WETH', label: 'WETH', description: 'Wrapped Ether · 18 decimals' },
];

interface SignedBridgeIntent {
  id: string;
  sourceChain: string;
  asset: string;
  grossAmount: string;
  netAmount: string;
  engine: 'Direct Deposit' | 'Shield on Arrival';
  commitment: string;
  signature: string;
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

export default function BridgeWorkspacePage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const events = useProtocolEvents();

  const [sourceChain, setSourceChain] = useState('ethereum');
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('10000');
  const [engine, setEngine] = useState<'direct' | 'shield'>('shield');
  const [commitment, setCommitment] = useState('');
  const [noteSecret, setNoteSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [intents, setIntents] = useState<SignedBridgeIntent[]>([]);

  const network = useQuery<{ block: string; gasPriceBaseUnits: string }>({
    queryKey: ['bridge-network-quote'],
    staleTime: 15_000,
    refetchInterval: 25_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Solver RPC quote unavailable');
      return r.json();
    },
  });

  useEffect(() => {
    let active = true;
    if (engine !== 'shield') {
      setCommitment('');
      setNoteSecret('');
      return;
    }
    const random = crypto.getRandomValues(new Uint8Array(16));
    const secret =
      '0x' + Array.from(random, (x) => x.toString(16).padStart(2, '0')).join('');
    setNoteSecret(secret);
    void sha256Hex(
      `kudex-bridge-shield:${sourceChain}:${asset}:${amount || '0'}:${address ?? 'preview'}:${secret}`,
    ).then((hash) => {
      if (active) setCommitment(hash);
    });
    return () => {
      active = false;
    };
  }, [engine, sourceChain, asset, amount, address]);

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const routingFee = validAmount ? numericAmount * 0.0005 : 0;
  const netOutput = validAmount ? numericAmount - routingFee : 0;
  const gasRefundEst = network.data
    ? `${(Number(formatUnits(BigInt(network.data.gasPriceBaseUnits), 18)) * 65_000).toFixed(6)} tPOT`
    : '0.000420 tPOT';

  async function submitBridgeIntent() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address) throw new Error('Connect your transaction wallet to sign a bridge intent.');
      if (!validAmount) throw new Error('Enter a positive transfer amount.');
      const chainLabel =
        SOURCE_CHAINS.find((c) => c.value === sourceChain)?.label ?? sourceChain;
      const engineLabel =
        engine === 'shield' ? 'Shield on Arrival' : 'Direct Deposit';
      const intentPayload = [
        'KUDEX CROSS-CHAIN SOLVER INTENT',
        `Origin: ${chainLabel}`,
        'Destination: Kudex Confidential Settlement',
        `Asset: ${amount} ${asset}`,
        `Routing Fee (0.05%): ${routingFee.toFixed(4)} ${asset}`,
        `Minimum Net Output: ${netOutput.toFixed(4)} ${asset}`,
        `Settlement Engine: ${engineLabel}`,
        ...(engine === 'shield' ? [`Shielded Note Commitment: ${commitment}`] : []),
        `Timestamp: ${new Date().toISOString()}`,
      ].join('\n');

      const signature = await signMessageAsync({ message: intentPayload });
      const proofId = await sha256Hex(signature);

      setIntents((prev) => [
        {
          id: proofId.slice(0, 14),
          sourceChain: chainLabel,
          asset,
          grossAmount: numericAmount.toFixed(2),
          netAmount: netOutput.toFixed(2),
          engine: engineLabel,
          commitment: engine === 'shield' ? commitment : 'Direct Wallet Credit',
          signature,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus(
        `Solver intent signed (${truncateAddress(proofId)}). Keep your shielded note claim backup if Shield on Arrival was selected.`,
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function downloadShieldBackup() {
    if (!commitment || !noteSecret) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            protocol: 'kudex-confidential-bridge-note-v1',
            sourceChain,
            destination: 'Kudex Confidential Settlement',
            asset,
            netAmount: netOutput.toFixed(4),
            commitment,
            blindingSecret: noteSecret,
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
    a.download = 'kudex-bridge-shield-note.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Cross-Chain Capital Gateway</p>
          <h1 className="page-title">Bridge & Solver Settlement</h1>
          <p className="page-description">
            Route liquidity from Ethereum, Arbitrum, Base, and Optimism directly into
            Kudex accounts or private settlement notes.
          </p>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span className="block font-semibold text-accent">Solver Network Online</span>
          <span className="text-muted-foreground tabular-nums">
            Target finality &lt; 45s · 0.05% routing fee
          </span>
        </div>
      </header>

      <div className="grid items-start gap-7 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Route & Settlement Engine Panel */}
        <section className="panel space-y-6">
          <h2 className="text-xl font-bold">Configure Cross-Chain Route</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-medium">Source Network</span>
              <CustomSelect
                label="Source Network"
                value={sourceChain}
                options={SOURCE_CHAINS}
                onChange={setSourceChain}
                disabled={busy}
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">Destination Network</span>
              <div className="flex min-h-12 items-center gap-2.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                <FiShield aria-hidden="true" />
                <span>Kudex Confidential Settlement</span>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium">Asset</span>
              <CustomSelect
                label="Bridge Asset"
                value={asset}
                options={ASSETS}
                onChange={setAsset}
                disabled={busy}
              />
            </div>

            <label className="block text-sm font-medium">
              Transfer Amount
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy}
                className="field-input mt-2 tabular-nums"
                placeholder="10000"
              />
            </label>
          </div>

          {/* Settlement Engine Toggle */}
          <div className="space-y-3">
            <span className="block text-sm font-semibold">Settlement Engine</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEngine('direct')}
                className={`rounded-xl border p-4 text-left transition ${
                  engine === 'direct'
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <FiGlobe className="text-accent" aria-hidden="true" />
                  <span>Direct Deposit</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">
                  Deliver standard tokens directly to your connected destination wallet.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setEngine('shield')}
                className={`rounded-xl border p-4 text-left transition ${
                  engine === 'shield'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <FiShield className="text-primary" aria-hidden="true" />
                  <span>Shield on Arrival</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed">
                  Mint a confidential settlement note immediately upon arrival.
                </p>
              </button>
            </div>
          </div>

          {engine === 'shield' && commitment && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-secondary p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary">
                  Generated Arrival Note Commitment
                </span>
                <button
                  type="button"
                  onClick={downloadShieldBackup}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download Claim Secret</span>
                </button>
              </div>
              <p className="break-all font-mono text-sm text-foreground">{commitment}</p>
            </div>
          )}

          <button
            type="button"
            disabled={busy || !validAmount}
            onClick={() => void submitBridgeIntent()}
            className="cobalt-action w-full text-base disabled:opacity-40"
          >
            <span>
              {busy
                ? 'Signing Solver Intent…'
                : address
                  ? 'Sign & Dispatch Bridge Intent'
                  : 'Connect Wallet to Bridge'}
            </span>
            <FiArrowRight aria-hidden="true" />
          </button>

          {status && (
            <p role="status" className="text-sm font-medium text-primary">
              {status}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </section>

        {/* Solver Quote Card */}
        <aside className="space-y-6">
          <section className="panel space-y-5 border-accent/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiZap className="text-accent" size={20} aria-hidden="true" />
                <h2 className="text-xl font-bold">Solver Quote</h2>
              </div>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
                Guaranteed Route
              </span>
            </div>

            <dl className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Estimated Completion</dt>
                <dd className="font-mono font-bold text-primary tabular-nums">
                  &lt; 45 seconds
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Cross-Chain Routing Fee (0.05%)</dt>
                <dd className="font-mono font-semibold tabular-nums">
                  {routingFee.toFixed(4)} {asset}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Destination Gas Refund Est.</dt>
                <dd className="font-mono font-semibold text-accent tabular-nums">
                  {gasRefundEst}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <dt className="text-muted-foreground">Arrival Mode</dt>
                <dd className="font-semibold">
                  {engine === 'shield' ? 'Shielded Note' : 'Direct Balance'}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-base font-bold">Net Settlement Output</dt>
                <dd className="font-mono text-xl font-bold text-primary tabular-nums">
                  {netOutput.toFixed(4)} {asset}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {/* Active Bridge Transfers Table */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Active Bridge Transfers & Settlement Proofs</h2>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {events.data
                ? `Indexed on-chain settlements through block #${events.data.indexedThrough.toString()} (${events.data.totalDepositEvents} pool arrivals)`
                : 'Live session intents and indexed settlement proofs'}
            </p>
          </div>
          {network.data && (
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              Head Block #{network.data.block}
            </span>
          )}
        </div>

        <div className="table-region rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Intent / Window</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Net Output</th>
                <th className="px-4 py-3">Settlement Engine</th>
                <th className="px-4 py-3">Status & Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {intents.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{row.id}</td>
                  <td className="px-4 py-3">
                    {row.sourceChain} → Kudex
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-primary tabular-nums">
                    {row.netAmount} {row.asset}
                  </td>
                  <td className="px-4 py-3">{row.engine}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                      <FiClock aria-hidden="true" />
                      <span>Signed · Awaiting Origin Lock</span>
                    </span>
                  </td>
                </tr>
              ))}
              {events.data?.chartSeries
                .filter((bucket) => bucket.rawVolumeBigInt > 0n)
                .map((bucket) => (
                  <tr key={bucket.day}>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      Blocks {bucket.day}
                    </td>
                    <td className="px-4 py-3">External → Kudex Pool</td>
                    <td className="px-4 py-3 font-mono font-semibold text-primary tabular-nums">
                      {formatUnits(bucket.rawVolumeBigInt, events.data!.decimals)} units
                    </td>
                    <td className="px-4 py-3">Pool Settlement</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                        <FiCheckCircle aria-hidden="true" />
                        <span>Confirmed On-Chain</span>
                      </span>
                    </td>
                  </tr>
                ))}
              {intents.length === 0 &&
                (!events.data || events.data.totalDepositEvents === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No active bridge intents in this session. Select a source chain and
                      sign an intent above to initiate solver routing.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
