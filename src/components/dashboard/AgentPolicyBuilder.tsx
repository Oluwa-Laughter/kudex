'use client';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { zeroAddress } from 'viem';
import { AgentPolicyActions } from './AgentPolicyActions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { AGENT_EXECUTOR, POLICY_REGISTRY } from '@/lib/agent/contracts';
import { FiArrowRight, FiDownload, FiShield, FiEdit2, FiCheck } from 'react-icons/fi';
import Link from 'next/link';
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
const fields: {
  key: keyof AgentPolicyInput;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: 'owner',
    label: 'Contract-facing owner',
    hint: 'Your 0x address, verified from your wallet or native runtime mapping.',
    placeholder: '0x…',
  },
  {
    key: 'delegate',
    label: 'Agent delegate',
    hint: 'A separate signing account you control. Never enter a private key.',
    placeholder: '0x…',
  },
  {
    key: 'vault',
    label: 'Vault address',
    hint: 'Must be approved in the deployed policy registry.',
    placeholder: '0x…',
  },
  {
    key: 'asset',
    label: 'Collateral token',
    hint: 'Must match the vault’s on-chain asset.',
    placeholder: '0x…',
  },
  {
    key: 'decimals',
    label: 'Collateral decimals',
    hint: 'Verify the token’s precision. Native POT and EVM gas use different units.',
    placeholder: '6',
  },
  {
    key: 'hours',
    label: 'Expires in hours',
    hint: 'A whole number from 1 to 720 (30 days).',
    placeholder: '24',
  },
  {
    key: 'perAction',
    label: 'Per-deposit cap',
    hint: 'Maximum collateral tokens in one deposit.',
    placeholder: 'e.g. 10',
  },
  {
    key: 'daily',
    label: 'Daily cap',
    hint: 'Maximum per UTC calendar day; not a rolling 24-hour window.',
    placeholder: 'e.g. 20',
  },
  {
    key: 'total',
    label: 'Total budget',
    hint: 'Maximum collateral tokens across the policy lifetime.',
    placeholder: 'e.g. 100',
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
  const [input, setInput] = useState(initial);
  const [policy, setPolicy] = useState<ReturnType<typeof prepareAgentPolicy> | null>(
    null,
  );
  const [error, setError] = useState('');
  const [exported, setExported] = useState(false);
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
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-5">
        <FiShield className="mt-1 shrink-0 text-primary" size={20} aria-hidden="true" />
        <div>
          <h2 className="font-sans text-base font-semibold tracking-normal">
            {contractsConfigured
              ? 'Setup available · Review before authorization'
              : 'Setup available · Activation pending deployment'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            A draft grants no authority. Creating the policy and approving collateral
            require separate wallet actions after deployment checks. The assistant cannot
            sign for you; a hosted worker is not running for this policy.
          </p>
        </div>
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel">
          {!policy ? (
            <form onSubmit={review} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Define your policy</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Amounts are collateral token quantities, not gas. Every field is
                  required.
                </p>
                <button
                  type="button"
                  className="quiet-link mt-4"
                  onClick={fillKnownDetails}
                >
                  Use connected account and configured vault
                </button>
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
                      className="mt-2 min-h-12 w-full rounded-xl border border-input px-3 py-2 text-base"
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
                      className="mt-2 text-xs leading-5 text-muted-foreground"
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
                Review policy <FiArrowRight aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-primary">Draft · Not authorized</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Review before you activate.
                  </h2>
                </div>
                <button className="quiet-link" onClick={() => setPolicy(null)}>
                  <FiEdit2 aria-hidden="true" />
                  Edit
                </button>
              </div>
              <dl className="divide-y divide-border">
                {[
                  ['Permitted action', 'Vault deposit only'],
                  ['Owner', policy.owner],
                  ['Delegate', policy.delegate],
                  ['Vault', policy.vault],
                  ['Collateral', policy.asset],
                  ['Precision', `${policy.decimals} decimals`],
                  ['Per deposit', input.perAction],
                  ['Per UTC day', input.daily],
                  ['Lifetime budget', input.total],
                  ['Expires', new Date(policy.expiresAt * 1000).toUTCString()],
                  ['Shares sent to', 'Policy owner only'],
                ].map(([label, value]) => (
                  <div className="py-3" key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-all text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">
                Draft details are not proof of deployment. Authorization checks the
                configured registry, asset, precision, owner signer, and governance delay
                before simulation.
              </p>
              <button className="action-link" onClick={download}>
                {exported ? (
                  <FiCheck aria-hidden="true" />
                ) : (
                  <FiDownload aria-hidden="true" />
                )}
                Download policy draft
              </button>
              <p role="status" className="text-sm text-primary">
                {exported
                  ? 'Draft downloaded. Exporting creates no on-chain authority.'
                  : ''}
              </p>
              <AgentPolicyActions policy={policy} onCreated={onCreated} />
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <section className="panel">
            <h2 className="text-lg font-semibold">What the executor can do</h2>
            <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li>Deposit into the vault you selected, while it remains approved.</li>
              <li>Spend within the per-action, daily, and total caps.</li>
              <li>Send all newly received shares to you.</li>
            </ul>
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-sans text-sm font-semibold tracking-normal">
                Outside its authority
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Withdrawals, arbitrary contract calls, switching vaults, changing caps, or
                operating after expiry or revocation.
              </p>
            </div>
          </section>
          <section className="panel">
            <h2 className="text-lg font-semibold">From draft to running</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
              <li>Verify the executor, registry, collateral, and approved vault.</li>
              <li>
                Authorize the policy and a bounded token allowance from the owner account.
              </li>
              <li>
                Fund the delegate and run the deposit worker with a protected signer.
              </li>
              <li>
                Monitor receipts. Revoke the policy and remaining allowance when finished.
              </li>
            </ol>
            <Link
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
              href="/app/how-it-works"
            >
              Read the setup guide <FiArrowRight aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
