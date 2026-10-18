'use client';

import Link from 'next/link';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { erc20Abi, formatUnits, parseAbi, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { isNetworkConfigured, portaldotTestnet } from '@/lib/chains/portaldot';
import { assertDeployment } from '@/lib/contracts/readiness';
import { getReadableErrorMessage } from '@/lib/utils';

const vaultAbi = parseAbi([
  'function previewDeposit(uint256 assets) view returns (uint256)',
  'function previewWithdraw(uint256 assets) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function asset() view returns (address)',
  'function totalAssets() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function maxWithdraw(address) view returns (uint256)',
  'function maxDeposit(address) view returns (uint256)',
  'function deposit(uint256 assets, address receiver) returns (uint256)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
]);

export default function VaultPage() {
  const { address, chainId } = useAccount();
  const native = useNativeWallet();
  const [review, setReview] = useState<{ assets: string; shares: string } | null>(null);
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [hash, setHash] = useState<string>();
  const { vault, usdc } = CONTRACT_ADDRESSES;
  const snapshot = useQuery({
    queryKey: ['vault-snapshot', portaldotTestnet.id, vault, usdc, address],
    enabled: Boolean(client && address && isVaultConfigured && isNetworkConfigured),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
    queryFn: async () => {
      if (!client || !address)
        throw new Error('Connect a wallet to load your vault balance.');
      await assertDeployment(client, [vault, usdc]);
      const asset = await client.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'asset',
      });
      if (asset.toLowerCase() !== usdc.toLowerCase())
        throw new Error(
          'The vault asset does not match the configured collateral token.',
        );
      const [decimals, symbol, balance, shares, withdrawable, depositLimit, totalAssets] =
        await Promise.all([
          client.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'decimals',
          }),
          client.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'symbol',
          }),
          client.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          }),
          client.readContract({
            address: vault,
            abi: vaultAbi,
            functionName: 'balanceOf',
            args: [address],
          }),
          client.readContract({
            address: vault,
            abi: vaultAbi,
            functionName: 'maxWithdraw',
            args: [address],
          }),
          client.readContract({
            address: vault,
            abi: vaultAbi,
            functionName: 'maxDeposit',
            args: [address],
          }),
          client.readContract({
            address: vault,
            abi: vaultAbi,
            functionName: 'totalAssets',
          }),
        ]);
      return {
        asset,
        decimals,
        symbol,
        balance,
        shares,
        withdrawable,
        depositLimit,
        totalAssets,
      };
    },
  });
  const data = snapshot.data;
  const limit = data ? (mode === 'deposit' ? data.balance : data.withdrawable) : 0n;

  async function prepareReview() {
    setError('');
    setStatus('');
    setHash(undefined);
    setBusy(true);
    try {
      if (!client || !address || chainId !== portaldotTestnet.id)
        throw new Error('Connect an EVM wallet on Portaldot V3 testnet.');
      const fresh = await snapshot.refetch();
      if (fresh.error || !fresh.data)
        throw new Error('Could not refresh the vault. Try again.');
      const current = fresh.data;
      if (
        !/^\d+(\.\d+)?$/.test(amount) ||
        (amount.split('.')[1]?.length ?? 0) > current.decimals
      )
        throw new Error('Enter a positive amount within the token precision.');
      const assets = parseUnits(amount, current.decimals);
      if (
        assets <= 0n ||
        assets > (mode === 'deposit' ? current.balance : current.withdrawable)
      )
        throw new Error('The amount exceeds your available balance or is zero.');
      if (mode === 'deposit' && assets > current.depositLimit)
        throw new Error('Deposits are currently restricted by the vault.');
      const [shares, shareDecimals] = await Promise.all([
        client.readContract({
          address: vault,
          abi: vaultAbi,
          functionName: mode === 'deposit' ? 'previewDeposit' : 'previewWithdraw',
          args: [assets],
        }),
        client.readContract({ address: vault, abi: vaultAbi, functionName: 'decimals' }),
      ]);
      setReview({
        assets: `${formatUnits(assets, current.decimals)} ${current.symbol}`,
        shares: formatUnits(shares, shareDecimals),
      });
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setError('');
    setStatus('');
    setHash(undefined);
    setBusy(true);
    try {
      if (!client || !address) throw new Error('Connect your wallet to continue.');
      if (chainId !== portaldotTestnet.id)
        throw new Error('Switch your wallet to the configured Portaldot testnet.');
      await assertDeployment(client, [vault, usdc]);
      const fresh = await snapshot.refetch();
      if (fresh.error || !fresh.data)
        throw fresh.error || new Error('Balances could not be refreshed. Try again.');
      const current = fresh.data;
      if (
        !/^\d+(\.\d+)?$/.test(amount.trim()) ||
        (amount.split('.')[1]?.length ?? 0) > current.decimals
      )
        throw new Error('Enter a positive amount within the token precision.');
      const assets = parseUnits(amount.trim(), current.decimals);
      const available = mode === 'deposit' ? current.balance : current.withdrawable;
      if (assets <= 0n || assets > available)
        throw new Error('The amount exceeds your available balance or is zero.');
      if (mode === 'deposit' && assets > current.depositLimit)
        throw new Error('Deposits are currently restricted by the vault.');
      const wait = async (tx: `0x${string}`) => {
        setHash(tx);
        setStatus('Transaction submitted. Waiting for confirmation…');
        const receipt = await client.waitForTransactionReceipt({ hash: tx });
        if (receipt.status !== 'success')
          throw new Error(
            'The transaction reverted. Your balances have not been updated locally.',
          );
      };
      if (mode === 'deposit') {
        const allowance = await client.readContract({
          address: current.asset,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, vault],
        });
        if (allowance < assets) {
          // Reset a nonzero allowance before changing it for tokens that require this pattern.
          for (const approval of allowance === 0n ? [assets] : [0n, assets]) {
            setStatus('Approve the exact token allowance in your wallet.');
            const simulation = await client.simulateContract({
              address: current.asset,
              abi: erc20Abi,
              functionName: 'approve',
              args: [vault, approval],
              account: address,
            });
            await wait(
              await writeContractAsync({
                ...simulation.request,
                chainId: portaldotTestnet.id,
              }),
            );
          }
        }
      }
      setStatus(`Review the ${mode} transaction in your wallet.`);
      if (mode === 'deposit') {
        const simulation = await client.simulateContract({
          address: vault,
          abi: vaultAbi,
          functionName: 'deposit',
          args: [assets, address],
          account: address,
        });
        await wait(
          await writeContractAsync({
            ...simulation.request,
            chainId: portaldotTestnet.id,
          }),
        );
      } else {
        const simulation = await client.simulateContract({
          address: vault,
          abi: vaultAbi,
          functionName: 'withdraw',
          args: [assets, address, address],
          account: address,
        });
        await wait(
          await writeContractAsync({
            ...simulation.request,
            chainId: portaldotTestnet.id,
          }),
        );
      }
      setStatus(`${mode === 'deposit' ? 'Deposit' : 'Withdrawal'} confirmed on chain.`);
      setAmount('');
      await snapshot.refetch();
    } catch (err) {
      setStatus('');
      setError(getReadableErrorMessage(err));
    } finally {
      setReview(null);
      setBusy(false);
    }
  }

  const field =
    'w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  return (
    <div className="space-y-8 text-foreground">
      <header className="space-y-3">
        <p className="eyebrow">Public testnet vault</p>
        <h1 className="page-title">A clear place to start.</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Deposit test collateral and withdraw available assets from the deployed vault.
          Balances and transactions are public. RWA tranches and projected yields are not
          available yet.
        </p>
      </header>
      {(!isVaultConfigured || !isNetworkConfigured) && (
        <p role="status" className="rounded-xl border border-border bg-card p-5">
          Testnet deployment is not configured. Vault actions will become available after
          the network settings and contract addresses are verified.
        </p>
      )}
      {native.selected && !address && (
        <aside className="rounded-xl border border-border bg-secondary p-5">
          <p className="font-medium">
            Your native account is connected for identification.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This form currently needs an EVM signing account. Native extension signing is
            still being integrated; your mapped contract address is not an EVM wallet key.
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center text-sm text-primary"
            href="/app/how-it-works"
          >
            Understand the wallet paths
          </Link>
        </aside>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void (review ? submit() : prepareReview());
          }}
          className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <div className="flex gap-3">
            {(['deposit', 'withdraw'] as const).map((item) => (
              <button
                type="button"
                key={item}
                disabled={busy || Boolean(review)}
                aria-pressed={mode === item}
                onClick={() => {
                  setMode(item);
                  setAmount('');
                }}
                className={`rounded-lg px-5 py-3 font-medium ${mode === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                {item === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            ))}
          </div>
          <label className="block space-y-3">
            <span>Amount {data ? `(${data.symbol})` : ''}</span>
            <input
              className={field}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              disabled={busy || Boolean(review)}
              required
            />
          </label>
          <p className="break-words text-muted-foreground">
            Available:{' '}
            {data ? `${formatUnits(limit, data.decimals)} ${data.symbol}` : 'Unavailable'}
          </p>
          <div className="flex flex-wrap gap-3">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                type="button"
                disabled={!data || busy || Boolean(review)}
                onClick={() =>
                  data &&
                  setAmount(formatUnits((limit * BigInt(percent)) / 100n, data.decimals))
                }
                className="min-h-11 rounded-lg border border-border px-4 py-2 disabled:opacity-50"
              >
                {percent}%
              </button>
            ))}
          </div>
          {review && (
            <section
              className="space-y-4 rounded-xl border border-border bg-background p-4"
              aria-label="Transaction review"
            >
              <h2 className="text-lg font-semibold">Review {mode}</h2>
              <dl className="space-y-3 text-sm">
                {[
                  ['Amount', review.assets],
                  [
                    mode === 'deposit'
                      ? 'Estimated shares received'
                      : 'Estimated shares burned',
                    review.shares,
                  ],
                  ['Vault', vault],
                  ['Your account', address ?? ''],
                  ['Network', `Portaldot V3 testnet · ${portaldotTestnet.id}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-all">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs leading-5 text-muted-foreground">
                Share quantities are estimates and can change before inclusion. Your
                wallet displays transaction fees. A deposit may require a separate
                exact-amount approval first.
              </p>
              <button
                type="button"
                className="quiet-link"
                disabled={busy}
                onClick={() => setReview(null)}
              >
                Edit amount
              </button>
            </section>
          )}
          <button
            disabled={
              busy ||
              !data ||
              snapshot.isError ||
              !address ||
              chainId !== portaldotTestnet.id
            }
            className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? 'Transaction in progress…'
              : review
                ? 'Confirm in wallet'
                : mode === 'deposit'
                  ? 'Review deposit'
                  : 'Review withdrawal'}
          </button>
          {!address && <p>Connect an EVM signing wallet to load your balance.</p>}
          {address && chainId !== portaldotTestnet.id && (
            <p role="status">
              Switch to Portaldot Testnet using your wallet’s network settings.
            </p>
          )}
          {(error || snapshot.error) && (
            <p role="alert" className="break-words text-destructive">
              {error || getReadableErrorMessage(snapshot.error)}
            </p>
          )}
          {status && <p role="status">{status}</p>}
          {hash && (
            <p className="break-all text-sm text-muted-foreground">
              Transaction hash: {hash}
            </p>
          )}
        </form>
        <section className="panel space-y-5">
          <h2 className="text-xl font-semibold">On-chain vault balances</h2>
          <p className="text-muted-foreground">
            {snapshot.isFetching
              ? 'Refreshing on-chain data…'
              : data
                ? 'Loaded from the configured testnet RPC.'
                : 'Waiting for a wallet and a verified deployment.'}
          </p>
          <dl className="space-y-6">
            <div>
              <dt className="text-muted-foreground">Total vault assets</dt>
              <dd className="mt-2 break-words text-2xl tabular-nums">
                {data
                  ? `${formatUnits(data.totalAssets, data.decimals)} ${data.symbol}`
                  : 'Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Your withdrawable assets</dt>
              <dd className="mt-2 break-words text-2xl tabular-nums">
                {data
                  ? `${formatUnits(data.withdrawable, data.decimals)} ${data.symbol}`
                  : 'Unavailable'}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={busy || snapshot.isFetching || !address || !isVaultConfigured}
            onClick={() => void snapshot.refetch()}
            className="rounded-lg border border-border px-4 py-3"
          >
            Refresh balances
          </button>
          <p className="max-w-prose leading-7 text-muted-foreground">
            An approval authorizes the vault to spend tokens. A deposit is complete only
            after its separate transaction confirms. Keep test funds only in this
            development deployment.
          </p>
        </section>
      </div>
    </div>
  );
}
