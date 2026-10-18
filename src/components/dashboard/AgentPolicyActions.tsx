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
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [status, setStatus] = useState(''),
    [hash, setHash] = useState<`0x${string}`>(),
    [created, setCreated] = useState<`0x${string}`>();
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
          'Connect the owner EVM wallet on Portaldot V3 testnet. Native extension signing is not integrated into this control.',
        );
      if (address.toLowerCase() !== policy.owner.toLowerCase())
        throw new Error('The connected EVM signer does not match the draft owner.');
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
        'Review policy creation in your wallet. This step grants no token allowance.',
      );
      const tx = await writeContractAsync({
        ...simulation.request,
        chainId: portaldotTestnet.id,
      });
      setHash(tx);
      setStatus('Policy transaction submitted. Waiting for a receipt…');
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== 'success')
        throw new Error('Policy creation reverted. No activation is being reported.');
      const events = parseEventLogs({
        abi: executorAbi,
        eventName: 'PolicyCreated',
        logs: receipt.logs.filter(
          (log) => log.address.toLowerCase() === AGENT_EXECUTOR.toLowerCase(),
        ),
      });
      const event = events.find(
        (event) =>
          event.args.owner.toLowerCase() === address.toLowerCase() &&
          event.args.delegate.toLowerCase() === policy.delegate.toLowerCase(),
      );
      if (!event)
        throw new Error(
          'The receipt did not contain the expected policy event. Inspect the transaction before retrying.',
        );
      setCreated(event.args.policyId);
      setStatus(
        'Policy created on-chain. Open policy controls to review allowance and delegate execution.',
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
      <h3 className="text-lg font-semibold">Authorize on the testnet</h3>
      <p className="text-sm leading-6 text-muted-foreground">
        Policy creation records these limits on-chain. Collateral approval is a separate
        owner action in Policy controls. This check does not establish an independent
        security audit.
      </p>
      {AGENT_EXECUTOR === zeroAddress || POLICY_REGISTRY === zeroAddress ? (
        <p className="rounded-xl bg-secondary p-4 text-sm">
          Waiting for the executor and registry deployment. The draft is ready for review;
          no policy has been created.
        </p>
      ) : checks.isFetching ? (
        <p role="status" className="text-sm">
          Checking registry approval, asset precision, and governance delay…
        </p>
      ) : checks.error ? (
        <p role="alert" className="text-sm text-destructive">
          {getReadableErrorMessage(checks.error)}
        </p>
      ) : (
        checks.data && (
          <p className="text-sm text-primary">
            The configured registry, vault asset, precision, and governance delay passed
            the current on-chain checks.
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
        <p className="text-xs text-muted-foreground">
          Connect the owner’s EVM signing account to authorize. A native extension
          connection identifies the account but does not enable this signing control.
        </p>
      )}
      {address && address.toLowerCase() !== policy.owner.toLowerCase() && (
        <p className="text-sm text-muted-foreground">
          Switch to the policy owner’s signing account.
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-primary">
          {status}
        </p>
      )}
      {created && (
        <p className="break-all rounded-xl bg-background p-3 font-mono text-xs">
          Policy ID: {created}
        </p>
      )}
      {hash && (
        <p className="break-all text-xs text-muted-foreground">
          Transaction: {hash}. A submitted hash alone does not confirm success.
        </p>
      )}
    </section>
  );
}
