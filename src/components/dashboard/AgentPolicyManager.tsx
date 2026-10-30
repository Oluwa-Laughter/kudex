'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import {
  erc20Abi,
  formatUnits,
  isHex,
  parseUnits,
  parseEventLogs,
  zeroAddress,
} from 'viem';
import { AGENT_EXECUTOR, executorAbi } from '@/lib/agent/contracts';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { getReadableErrorMessage } from '@/lib/utils';
import { checkAgentInfrastructure } from '@/lib/agent/infrastructure';

export function AgentPolicyManager({ createdId }: { createdId?: `0x${string}` }) {
  const [input, setInput] = useState('');
  const [loaded, setLoaded] = useState<`0x${string}`>();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hash, setHash] = useState<`0x${string}`>();
  const id = loaded ?? createdId;

  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();

  const policy = useQuery({
    queryKey: ['agent-policy', AGENT_EXECUTOR, id],
    enabled: Boolean(client && id) && AGENT_EXECUTOR !== zeroAddress,
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 0,
    queryFn: async () => {
      if (!client || !id) throw new Error('Choose a policy first.');
      if ((await client.getChainId()) !== 420420777)
        throw new Error('Unexpected network.');
      const block = await client.getBlock();
      const p = await client.readContract({
        address: AGENT_EXECUTOR,
        abi: executorAbi,
        functionName: 'policies',
        args: [id],
        blockNumber: block.number,
      });
      if (p[0] === zeroAddress)
        throw new Error('No policy exists with this ID on the configured executor.');
      const [decimals, symbol, allowance, balance] = await Promise.all([
        client.readContract({
          address: p[3],
          abi: erc20Abi,
          functionName: 'decimals',
          blockNumber: block.number,
        }),
        client.readContract({
          address: p[3],
          abi: erc20Abi,
          functionName: 'symbol',
          blockNumber: block.number,
        }),
        client.readContract({
          address: p[3],
          abi: erc20Abi,
          functionName: 'allowance',
          args: [p[0], AGENT_EXECUTOR],
          blockNumber: block.number,
        }),
        client.readContract({
          address: p[3],
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [p[0]],
          blockNumber: block.number,
        }),
      ]);
      return {
        owner: p[0],
        delegate: p[1],
        vault: p[2],
        asset: p[3],
        expiresAt: p[4],
        revoked: p[5],
        perAction: p[6],
        daily: p[7],
        total: p[8],
        spent: p[9],
        day: p[10],
        daySpent: p[11],
        decimals,
        symbol,
        allowance,
        balance,
        block: block.number,
        timestamp: block.timestamp,
      };
    },
  });

  const data = policy.data;
  const owner = Boolean(
    address && data && address.toLowerCase() === data.owner.toLowerCase(),
  );
  const delegate = Boolean(
    address && data && address.toLowerCase() === data.delegate.toLowerCase(),
  );
  const active = Boolean(data && !data.revoked && data.expiresAt > data.timestamp);

  async function transact(action: 'approve' | 'revoke' | 'execute' | 'clearAllowance') {
    setBusy(true);
    setError('');
    setStatus('Refreshing policy state…');
    try {
      if (!client || !address || !id || chainId !== 420420777)
        throw new Error(
          'Connect the relevant transaction account on the settlement network.',
        );
      const fresh = await policy.refetch();
      if (fresh.error || !fresh.data)
        throw fresh.error || new Error('Policy refresh failed.');
      const p = fresh.data;
      const wait = async (tx: `0x${string}`) => {
        setHash(tx);
        setStatus('Transaction submitted. Waiting for a successful receipt…');
        const receipt = await client.waitForTransactionReceipt({ hash: tx });
        if (receipt.status !== 'success') throw new Error('The transaction reverted.');
        if (receipt.from.toLowerCase() !== address.toLowerCase())
          throw new Error('Receipt signer mismatch. Requires reconciliation.');
        return receipt;
      };
      if (action === 'approve' || action === 'clearAllowance') {
        if (address.toLowerCase() !== p.owner.toLowerCase())
          throw new Error('Only the owner can change this collateral allowance.');
        const target = action === 'clearAllowance' ? 0n : p.total - p.spent;
        if (
          action === 'approve' &&
          (p.revoked || p.expiresAt <= p.timestamp || target === 0n)
        )
          throw new Error('This policy cannot receive a new spending allowance.');
        if (action === 'approve')
          await checkAgentInfrastructure(client, p.vault, p.asset, p.decimals);
        for (const value of p.allowance > 0n && target > 0n ? [0n, target] : [target]) {
          setStatus(
            `Review ${value === 0n ? 'allowance removal' : 'remaining policy budget allowance'} in your wallet.`,
          );
          const simulation = await client.simulateContract({
            address: p.asset,
            abi: erc20Abi,
            functionName: 'approve',
            args: [AGENT_EXECUTOR, value],
            account: address,
          });
          const receipt = await wait(
            await writeContractAsync({
              ...simulation.request,
              account: address,
              chainId: 420420777,
            }),
          );
          const observed = await client.readContract({
            address: p.asset,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, AGENT_EXECUTOR],
            blockNumber: receipt.blockNumber,
          });
          if (observed !== value)
            throw new Error('Exact allowance not observed. Requires reconciliation.');
        }
      } else if (action === 'revoke') {
        if (address.toLowerCase() !== p.owner.toLowerCase())
          throw new Error('Only the policy owner can revoke it.');
        const simulation = await client.simulateContract({
          address: AGENT_EXECUTOR,
          abi: executorAbi,
          functionName: 'revokePolicy',
          args: [id],
          account: address,
        });
        setStatus('Review emergency policy revocation in your wallet.');
        const receipt = await wait(
          await writeContractAsync({
            ...simulation.request,
            account: address,
            chainId: 420420777,
          }),
        );
        const events = parseEventLogs({
          abi: executorAbi,
          eventName: 'PolicyRevoked',
          logs: receipt.logs.filter(
            (log) => log.address.toLowerCase() === AGENT_EXECUTOR.toLowerCase(),
          ),
        });
        if (!events.some((ev) => ev.args.policyId === id))
          throw new Error('Matching revocation event missing. Requires reconciliation.');
      } else {
        if (address.toLowerCase() !== p.delegate.toLowerCase())
          throw new Error(
            'Use the exact delegate signing account to execute this policy.',
          );
        if (
          !/^\d+(\.\d+)?$/.test(amount) ||
          (amount.split('.')[1]?.length ?? 0) > p.decimals
        )
          throw new Error('Enter a positive amount within the collateral precision.');
        const assets = parseUnits(amount, p.decimals);
        const block = await client.getBlock();
        const remainingDaily =
          p.daily - (p.day === block.timestamp / 86400n ? p.daySpent : 0n);
        if (
          p.revoked ||
          p.expiresAt <= block.timestamp ||
          assets <= 0n ||
          assets > p.perAction ||
          assets > remainingDaily ||
          assets > p.total - p.spent ||
          assets > p.allowance ||
          assets > p.balance
        )
          throw new Error(
            'The amount exceeds a policy cap, allowance, balance, or this policy is inactive.',
          );
        await checkAgentInfrastructure(client, p.vault, p.asset, p.decimals);
        const simulation = await client.simulateContract({
          address: AGENT_EXECUTOR,
          abi: executorAbi,
          functionName: 'execute',
          args: [id, assets],
          account: address,
        });
        setStatus(
          'Review this delegated deposit in your wallet. Shares route directly to the owner.',
        );
        const receipt = await wait(
          await writeContractAsync({
            ...simulation.request,
            account: address,
            chainId: 420420777,
          }),
        );
        const events = parseEventLogs({
          abi: executorAbi,
          eventName: 'DepositExecuted',
          logs: receipt.logs.filter(
            (log) => log.address.toLowerCase() === AGENT_EXECUTOR.toLowerCase(),
          ),
        });
        if (
          !events.some(
            (ev) =>
              ev.args.policyId === id &&
              ev.args.assets === assets &&
              ev.args.shares > 0n,
          )
        )
          throw new Error(
            'Matching deposit execution event missing. Requires reconciliation.',
          );
      }
      setStatus(
        `${action === 'approve' ? 'Allowance update' : action === 'clearAllowance' ? 'Allowance removal' : action === 'revoke' ? 'Policy revocation' : 'Delegated deposit'} confirmed on-chain.`,
      );
      setAmount('');
      await policy.refetch();
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Active Session Key & Emergency Revocation</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Load a session policy ID to inspect remaining spend caps, approve collateral,
          execute bounded deposits, or trigger immediate one-click revocation.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError('');
          if (!isHex(input, { strict: true }) || input.length !== 66) {
            setError('Enter a 32-byte policy ID beginning with 0x.');
            return;
          }
          setLoaded(input as `0x${string}`);
        }}
      >
        <label className="min-w-0 flex-1 text-sm font-medium">
          Policy ID
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={createdId ?? '0x…'}
            className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm"
          />
        </label>
        <button className="quiet-link" disabled={busy || AGENT_EXECUTOR === zeroAddress}>
          Load policy
        </button>
      </form>

      {AGENT_EXECUTOR === zeroAddress && (
        <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
          Session policy executor awaiting deployment configuration.
        </p>
      )}

      {policy.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">
          Reading on-chain policy state…
        </p>
      )}

      {policy.error && (
        <p role="alert" className="text-sm text-destructive">
          {getReadableErrorMessage(policy.error)}
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary tabular-nums">
              {data.revoked ? 'Revoked' : active ? 'Active Session' : 'Expired'} · Block #
              {data.block.toString()}
            </p>
            <button
              className="quiet-link text-sm"
              disabled={busy || policy.isFetching}
              onClick={() => void policy.refetch()}
            >
              Refresh state
            </button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Owner', data.owner],
              ['Delegate', data.delegate],
              [
                'Lifetime spent',
                `${formatUnits(data.spent, data.decimals)} / ${formatUnits(data.total, data.decimals)} ${data.symbol}`,
              ],
              [
                'Collateral allowance',
                `${formatUnits(data.allowance, data.decimals)} ${data.symbol}`,
              ],
              [
                'Per-deposit cap',
                `${formatUnits(data.perAction, data.decimals)} ${data.symbol}`,
              ],
              ['UTC-day cap', `${formatUnits(data.daily, data.decimals)} ${data.symbol}`],
              ['Expires at', new Date(Number(data.expiresAt) * 1000).toUTCString()],
              ['Vault', data.vault],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-secondary p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-all text-sm font-semibold tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold">Owner & Emergency Revocation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Revoke active delegate keys immediately or update approved collateral.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="action-link disabled:opacity-40"
                  disabled={busy || !owner || !active || chainId !== 420420777}
                  onClick={() => void transact('approve')}
                >
                  Approve remaining budget
                </button>
                <button
                  className="quiet-link text-destructive hover:text-destructive disabled:opacity-40"
                  disabled={busy || !owner || data.revoked || chainId !== 420420777}
                  onClick={() => void transact('revoke')}
                >
                  Revoke policy
                </button>
                <button
                  className="quiet-link disabled:opacity-40"
                  disabled={
                    busy || !owner || data.allowance === 0n || chainId !== 420420777
                  }
                  onClick={() => void transact('clearAllowance')}
                >
                  Remove token allowance
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void transact('execute');
              }}
            >
              <h3 className="text-lg font-bold">Execute Delegated Deposit</h3>
              <label className="mt-3 block text-sm font-medium">
                Collateral amount
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 py-2 tabular-nums"
                  disabled={busy}
                  required
                />
              </label>
              <button
                className="action-link mt-3 disabled:opacity-40"
                disabled={busy || !delegate || !active || chainId !== 420420777}
              >
                Review deposit in delegate wallet
              </button>
              <p className="mt-2 text-sm text-muted-foreground">
                Requires signing from the authorized delegate account.
              </p>
            </form>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm font-medium text-primary">
          {status}
        </p>
      )}
      {hash && (
        <p className="break-all font-mono text-sm text-muted-foreground">
          Transaction: {hash}
        </p>
      )}
    </section>
  );
}
