'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { zeroAddress } from 'viem';
import { FiArrowRight, FiDownload, FiShield, FiEdit2, FiCheck, FiClock } from 'react-icons/fi';
import { AgentPolicyActions } from './AgentPolicyActions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { AGENT_EXECUTOR, POLICY_REGISTRY } from '@/lib/agent/contracts';
import { prepareAgentPolicy, type AgentPolicyInput } from '@/lib/agent-policy';

const initial: AgentPolicyInput = {
  owner: '',
  delegate: '',
  vault: '',
  asset: '',
  decimals: '6',
  perAction: '',
  daily: '',
  total: '',
  hours: '24',
};

const EXPIRY_PRESETS = [
  { label: '2 Hours', hours: '2' },
  { label: '24 Hours', hours: '24' },
  { label: '7 Days', hours: '168' },
];

const fields: {
  key: keyof AgentPolicyInput;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: 'owner',
    label: 'Contract-facing owner',
    hint: 'Your connected 0x wallet address.',
    placeholder: '0x…',
  },
  {
    key: 'delegate',
    label: 'Agent delegate',
    hint: 'Bounded session key address authorized to submit deposits.',
    placeholder: '0x…',
  },
  {
    key: 'vault',
    label: 'Vault address',
    hint: 'Target yield pool registered in the policy registry.',
    placeholder: '0x…',
  },
  {
    key: 'asset',
    label: 'Collateral token',
    hint: 'Underlying asset contract matching the target pool.',
    placeholder: '0x…',
  },
  {
    key: 'decimals',
    label: 'Collateral decimals',
    hint: 'Token decimal precision (e.g. 6 for USDC, 18 for standard tokens).',
    placeholder: '6',
  },
  {
    key: 'hours',
    label: 'Expires in hours',
    hint: 'Session key duration from 1 to 720 hours.',
    placeholder: '24',
  },
  {
    key: 'perAction',
    label: 'Per-deposit cap',
    hint: 'Maximum token units allowed per single transaction.',
    placeholder: 'e.g. 1000',
  },
  {
    key: 'daily',
    label: 'Daily cap',
    hint: 'Maximum cumulative spend per UTC calendar day.',
    placeholder: 'e.g. 5000',
  },
  {
    key: 'total',
    label: 'Total budget',
    hint: 'Maximum cumulative spend across the entire session lifetime.',
    placeholder: 'e.g. 25000',
  },
];

export function AgentPolicyBuilder({
  onCreated,
}: {
  onCreated?: (id: `0x${string}`) => void;
}) {
  const { address } = useAccount();
  const native = useNativeAccount();
  const contractsConfigured =
    AGENT_EXECUTOR !== zeroAddress && POLICY_REGISTRY !== zeroAddress;

  const [input, setInput] = useState(initial);
  const [policy, setPolicy] = useState<ReturnType<typeof prepareAgentPolicy> | null>(
    null,
  );
  const [error, setError] = useState('');
  const [exported, setExported] = useState(false);

  function fillKnownDetails() {
    setInput((current) => ({
      ...current,
      owner: address ?? native.data?.contractAddress ?? current.owner,
      vault:
        CONTRACT_ADDRESSES.vault !== zeroAddress
          ? CONTRACT_ADDRESSES.vault
          : current.vault,
      asset:
        CONTRACT_ADDRESSES.usdc !== zeroAddress ? CONTRACT_ADDRESSES.usdc : current.asset,
    }));
  }

  function review(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setExported(false);
    try {
      setPolicy(prepareAgentPolicy(input));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Review your policy fields.');
    }
  }

  function download() {
    if (!policy) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kudex-agent-policy-draft.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-5">
        <FiShield className="mt-1 shrink-0 text-primary" size={20} aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold">
            {contractsConfigured
              ? 'Bounded Session Keys Ready for Authorization'
              : 'Session Key Builder · Executor Awaiting Deployment'}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Constrain KUDEX AGENT delegates with strict time expirations, cumulative
            spending caps, and whitelisted contract functions.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          {!policy ? (
            <form onSubmit={review} className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Configure Session Policy</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set time bounds and cumulative spending limits.
                  </p>
                </div>
                <button
                  type="button"
                  className="quiet-link text-sm"
                  onClick={fillKnownDetails}
                >
                  Autofill connected wallet & pool
                </button>
              </div>

              <div className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <FiClock className="text-primary" aria-hidden="true" />
                  <span>Quick Expiration Presets</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() =>
                        setInput((curr) => ({ ...curr, hours: preset.hours }))
                      }
                      className={`min-h-10 rounded-xl border px-3.5 py-1.5 text-sm font-semibold tabular-nums transition ${
                        input.hours === preset.hours
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.key === 'total' ? 'sm:col-span-2' : ''}
                  >
                    <label htmlFor={`agent-${field.key}`} className="text-sm font-medium">
                      {field.label}
                    </label>
                    <input
                      className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-base tabular-nums"
                      id={`agent-${field.key}`}
                      required
                      value={input[field.key]}
                      autoComplete="off"
                      spellCheck={false}
                      inputMode={
                        ['perAction', 'daily', 'total'].includes(field.key)
                          ? 'decimal'
                          : ['decimals', 'hours'].includes(field.key)
                            ? 'numeric'
                            : 'text'
                      }
                      placeholder={field.placeholder}
                      aria-describedby={`hint-${field.key}`}
                      onChange={(event) =>
                        setInput((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                    <p
                      id={`hint-${field.key}`}
                      className="mt-1.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      {field.hint}
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive p-4 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <button type="submit" className="action-link">
                Review policy
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Draft · Not authorized
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    Verify Session Bounds Before Signing
                  </h2>
                </div>
                <button className="quiet-link text-sm" onClick={() => setPolicy(null)}>
                  <FiEdit2 aria-hidden="true" />
                  Edit
                </button>
              </div>

              <dl className="divide-y divide-border">
                {[
                  ['Whitelisted function', 'Vault deposit only (execute)'],
                  ['Owner', policy.owner],
                  ['Delegate', policy.delegate],
                  ['Vault', policy.vault],
                  ['Collateral', policy.asset],
                  ['Precision', `${policy.decimals} decimals`],
                  ['Per deposit', input.perAction],
                  ['Per UTC day', input.daily],
                  ['Lifetime budget', input.total],
                  ['Expires', new Date(policy.expiresAt * 1000).toUTCString()],
                  ['Recipient lock', 'Policy owner only'],
                ].map(([label, value]) => (
                  <div className="py-3" key={label}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-all text-sm font-semibold tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <button className="quiet-link text-sm" onClick={download}>
                {exported ? (
                  <FiCheck aria-hidden="true" />
                ) : (
                  <FiDownload aria-hidden="true" />
                )}
                Download policy draft
              </button>

              {exported && (
                <p role="status" className="text-sm font-medium text-primary">
                  Policy JSON exported. Authorize in wallet to activate on-chain.
                </p>
              )}

              <AgentPolicyActions policy={policy} onCreated={onCreated} />
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="panel space-y-4">
            <h2 className="text-lg font-bold">Contract Function Whitelist</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-secondary px-3.5 py-2.5">
                <span className="font-mono">deposit(uint256,address)</span>
                <span className="font-semibold text-primary">Permitted</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-secondary px-3.5 py-2.5 text-muted-foreground">
                <span className="font-mono">withdraw / redeem</span>
                <span>Blocked</span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-secondary px-3.5 py-2.5 text-muted-foreground">
                <span className="font-mono">transfer / arbitrary call</span>
                <span>Blocked</span>
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Newly minted pool shares are routed exclusively to the owner address and
              can never be redirected by a session delegate.
            </p>
            <div className="border-t border-border pt-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <FiArrowRight aria-hidden="true" />
                <span>Instant owner revocation supported at any block</span>
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
