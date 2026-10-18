'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi';
import { formatUnits, zeroAddress } from 'viem';
import {
  portaldotTestnet,
  isNetworkConfigured,
  PORTALDOT_NODE_CONSOLE,
} from '@/lib/chains/portaldot';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getReadableErrorMessage } from '@/lib/utils';

const deployments = [
  ['Vault', CONTRACT_ADDRESSES.vault],
  ['RFQ router', CONTRACT_ADDRESSES.rfqMarket],
  ['Collateral token', CONTRACT_ADDRESSES.usdc],
  ['Risk adapter', CONTRACT_ADDRESSES.daasAdapter],
] as const;

export function NetworkReadiness() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { switchChain, isPending: switching, error: switchError } = useSwitchChain();
  const network = useQuery({
    queryKey: [
      'network-readiness',
      portaldotTestnet.id,
      portaldotTestnet.rpcUrls.default.http[0],
      deployments,
      address,
    ],
    enabled: Boolean(client) && isNetworkConfigured,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
    queryFn: async () => {
      if (!client) throw new Error('Network client is unavailable.');
      const [actualChain, block, gasBalance, contracts] = await Promise.all([
        client.getChainId(),
        client.getBlockNumber({ cacheTime: 0 }),
        address ? client.getBalance({ address }) : Promise.resolve(null),
        Promise.all(
          deployments.map(async ([name, target]) => {
            const code =
              target === zeroAddress
                ? undefined
                : await client.getBytecode({ address: target });
            return {
              name,
              address: target,
              status:
                target === zeroAddress
                  ? 'Address not configured'
                  : code && code !== '0x'
                    ? 'Contract reachable'
                    : 'No code at configured address',
            };
          }),
        ),
      ]);
      if (actualChain !== portaldotTestnet.id)
        throw new Error('RPC chain ID does not match Portaldot V3 Testnet.');
      return { block, gasBalance, contracts };
    },
  });

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Testnet readiness</h2>
          <p className="mt-2 max-w-prose text-base leading-7 text-muted-foreground">
            Check the network, wallet funding and deployment before you transact.
          </p>
        </div>
        <button
          type="button"
          disabled={network.isFetching}
          onClick={() => void network.refetch()}
          className="rounded-lg border border-border px-4 py-3 disabled:opacity-50"
        >
          {network.isFetching ? 'Checking…' : 'Check again'}
        </button>
      </div>
      {!isNetworkConfigured && (
        <p role="alert" className="text-destructive">
          The configured chain or gas denomination does not match the verified V3 network.
        </p>
      )}
      {network.error && (
        <p role="alert" className="text-destructive">
          Network check failed: {getReadableErrorMessage(network.error)}
          {network.data
            ? ' The values below are from the previous successful check.'
            : ''}
        </p>
      )}
      <dl className="grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Network</dt>
          <dd className="mt-1 text-lg">Portaldot V3 Testnet · {portaldotTestnet.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Latest observed block</dt>
          <dd className="mt-1 text-lg tabular-nums">
            {network.data?.block.toString() ??
              (network.isFetching ? 'Checking…' : 'Unavailable')}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Wallet gas balance</dt>
          <dd className="mt-1 break-words text-lg tabular-nums">
            {!address
              ? 'Connect your wallet'
              : network.data?.gasBalance !== null &&
                  network.data?.gasBalance !== undefined
                ? `${formatUnits(network.data.gasBalance, 18)} tPOT`
                : 'Unavailable'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Wallet network</dt>
          <dd className="mt-1 text-lg">
            {!address
              ? 'Not connected'
              : chainId === portaldotTestnet.id
                ? 'Correct testnet selected'
                : 'Switch required'}
          </dd>
        </div>
      </dl>
      {address && chainId !== portaldotTestnet.id && (
        <button
          type="button"
          disabled={switching}
          onClick={() => switchChain({ chainId: portaldotTestnet.id })}
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {switching ? 'Waiting for wallet…' : 'Switch to Portaldot V3 Testnet'}
        </button>
      )}
      {switchError && (
        <p role="alert" className="text-destructive">
          {getReadableErrorMessage(switchError)}
        </p>
      )}
      {network.data?.gasBalance === 0n && (
        <p role="status" className="max-w-prose leading-7">
          This EVM account has no gas funds. The organizer faucet uses native addresses
          beginning with 5. Verify your allocation and the account mapping before
          attempting a native transfer; wallet connection alone does not fund an EVM
          account.
        </p>
      )}
      <ul className="divide-y divide-border border-y border-border">
        {(
          network.data?.contracts ??
          deployments.map(([name, target]) => ({
            name,
            address: target,
            status:
              target === zeroAddress
                ? 'Address not configured'
                : 'Awaiting network check',
          }))
        ).map((contract) => (
          <li key={contract.name} className="flex flex-wrap justify-between gap-3 py-4">
            <span className="font-medium">{contract.name}</span>
            <span className="text-muted-foreground">{contract.status}</span>
          </li>
        ))}
      </ul>
      <p className="max-w-prose text-sm leading-6 text-muted-foreground">
        Native tPOT balances use 14 decimals. This Ethereum RPC uses 18 decimals, as
        confirmed by the runtime conversion ratio. Missing deployment addresses remain
        unavailable until real receipts and contract relationships are verified.
      </p>
      <a
        href={PORTALDOT_NODE_CONSOLE}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border border-border px-4 py-3"
      >
        Open native network console
      </a>
    </section>
  );
}
