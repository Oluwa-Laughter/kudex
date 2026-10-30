'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { parseEventLogs, zeroAddress } from 'viem';
import { AGENT_EXECUTOR, POLICY_REGISTRY, executorAbi } from '@/lib/agent/contracts';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { checkAgentInfrastructure } from '@/lib/agent/infrastructure';
import { getReadableErrorMessage } from '@/lib/utils';
import type { prepareAgentPolicy } from '@/lib/agent-policy';

type PolicyDraft = ReturnType<typeof prepareAgentPolicy>;

export function AgentPolicyActions({
  policy,
  onCreated,
}: {
  policy: PolicyDraft;
  onCreated?: (id: `0x${string}`) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hash, setHash] = useState<`0x${string}`>();
  const [created, setCreated] = useState<`0x${string}`>();

  const checks = useQuery({
    queryKey: [
      'agent-infrastructure',
      AGENT_EXECUTOR,
      POLICY_REGISTRY,
      policy.vault,
      policy.asset,
      policy.decimals,
    ],
    enabled:
      Boolean(client) &&
      AGENT_EXECUTOR !== zeroAddress &&
      POLICY_REGISTRY !== zeroAddress,
    staleTime: 15_000,
    retry: 0,
    queryFn: () =>
      checkAgentInfrastructure(client!, policy.vault, policy.asset, policy.decimals),
  });

  async function authorize() {
    setBusy(true);
    setError('');
    setStatus('Checking policy and deployment…');
    try {
      if (!client || !address || chainId !== portaldotTestnet.id)
        throw new Error(
          'Connect the owner transaction wallet on the settlement network.',
        );
      if (address.toLowerCase() !== policy.owner.toLowerCase())
        throw new Error('The connected wallet does not match the policy owner.');
      await checkAgentInfrastructure(client, policy.vault, policy.asset, policy.decimals);
      const block = await client.getBlock();
      if (BigInt(policy.expiresAt) <= block.timestamp)
        throw new Error('This policy draft has expired. Create a new draft.');
      const simulation = await client.simulateContract({
        address: AGENT_EXECUTOR,
        abi: executorAbi,
        functionName: 'createPolicy',
        args: [
          policy.delegate,
          policy.vault,
          BigInt(policy.expiresAt),
          BigInt(policy.limits.perAction),
          BigInt(policy.limits.daily),
          BigInt(policy.limits.total),
        ],
        account: address,
      });
      setStatus(
        'Review policy creation in your wallet. Token allowance is approved separately.',
      );
      const tx = await writeContractAsync({
        ...simulation.request,
        chainId: portaldotTestnet.id,
      });
      setHash(tx);
      setStatus('Policy transaction submitted. Waiting for confirmation…');
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== 'success')
        throw new Error('Policy creation reverted. No activation recorded.');
      const events = parseEventLogs({
        abi: executorAbi,
        eventName: 'PolicyCreated',
        logs: receipt.logs.filter(
          (log) => log.address.toLowerCase() === AGENT_EXECUTOR.toLowerCase(),
        ),
      });
      const event = events.find(
        (ev) =>
          ev.args.owner.toLowerCase() === address.toLowerCase() &&
          ev.args.delegate.toLowerCase() === policy.delegate.toLowerCase() &&
          ev.args.vault.toLowerCase() === policy.vault.toLowerCase() &&
          ev.args.expiresAt === BigInt(policy.expiresAt),
      );
      if (!event)
        throw new Error(
          'The receipt did not contain the expected policy event. Inspect the transaction before retrying.',
        );
      setCreated(event.args.policyId);
      setStatus(
        'Policy created on-chain. Open Policy Registry Controls to manage allowance or revoke.',
      );
      onCreated?.(event.args.policyId);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 space-y-4 border-t border-border pt-6">
      <h3 className="text-lg font-bold">On-Chain Policy Authorization</h3>
      {AGENT_EXECUTOR === zeroAddress || POLICY_REGISTRY === zeroAddress ? (
        <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
          Session executor contracts awaiting configuration. Export your reviewed policy
          JSON above or connect once deployed.
        </p>
      ) : checks.isFetching ? (
        <p role="status" className="text-sm text-muted-foreground">
          Verifying registry approval and asset precision…
        </p>
      ) : checks.error ? (
        <p role="alert" className="text-sm text-destructive">
          {getReadableErrorMessage(checks.error)}
        </p>
      ) : (
        checks.data && (
          <p className="text-sm font-medium text-primary">
            Registry, pool asset, and decimal checks verified.
          </p>
        )
      )}

      <button
        type="button"
        className="action-link disabled:opacity-40"
        disabled={
          busy ||
          Boolean(created) ||
          !checks.data ||
          checks.isError ||
          !address ||
          address.toLowerCase() !== policy.owner.toLowerCase() ||
          chainId !== portaldotTestnet.id
        }
        onClick={() => void authorize()}
      >
        {busy
          ? 'Waiting for wallet or chain…'
          : created
            ? 'Policy created'
            : 'Authorize policy in wallet'}
      </button>

      {!address && (
        <p className="text-sm text-muted-foreground">
          Connect the owner transaction wallet to authorize this session policy.
        </p>
      )}
      {address && address.toLowerCase() !== policy.owner.toLowerCase() && (
        <p className="text-sm text-muted-foreground">
          Switch to the policy owner wallet ({policy.owner}) to sign.
        </p>
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
      {created && (
        <p className="break-all rounded-xl bg-secondary p-3 font-mono text-sm">
          Policy ID: {created}
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
