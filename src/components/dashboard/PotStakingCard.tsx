'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import {
  FiAward,
  FiCheckCircle,
  FiDollarSign,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';
import {
  PORTALDOT_NATIVE_DECIMALS,
  portaldotTestnet,
} from '@/lib/chains/portaldot';
import {
  CONTRACT_ADDRESSES,
  isPotStakingConfigured,
} from '@/lib/contracts/addresses';
import { kudexPOTStakingAbi } from '@/lib/contracts/abis';
import { LIVE_ACTIVITY_QUERY_KEY } from '@/lib/hooks/useLiveActivity';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const HUNDRED_POT_UNITS = 100n * 10n ** BigInt(PORTALDOT_NATIVE_DECIMALS);

function formatPotDisplay(units: bigint): string {
  const num = Number(formatUnits(units, PORTALDOT_NATIVE_DECIMALS));
  if (!Number.isFinite(num)) return formatUnits(units, PORTALDOT_NATIVE_DECIMALS);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function PotStakingCard({
  rewardDecimals = 6,
  rewardSymbol = 'USDC',
}: {
  rewardDecimals?: number;
  rewardSymbol?: string;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  const stakedBalanceRead = useReadContract({
    address: CONTRACT_ADDRESSES.potStaking,
    abi: kudexPOTStakingAbi,
    functionName: 'stakedBalanceOf',
    args: [address ?? zeroAddress],
    chainId: portaldotTestnet.id,
    query: {
      enabled: isPotStakingConfigured && Boolean(address),
      staleTime: 8_000,
    },
  });

  const feeWaiverRead = useReadContract({
    address: CONTRACT_ADDRESSES.potStaking,
    abi: kudexPOTStakingAbi,
    functionName: 'qualifiesForFeeWaiver',
    args: [address ?? zeroAddress],
    chainId: portaldotTestnet.id,
    query: {
      enabled: isPotStakingConfigured && Boolean(address),
      staleTime: 8_000,
    },
  });

  const claimableRewardsRead = useReadContract({
    address: CONTRACT_ADDRESSES.potStaking,
    abi: kudexPOTStakingAbi,
    functionName: 'claimableRewards',
    args: [address ?? zeroAddress],
    chainId: portaldotTestnet.id,
    query: {
      enabled: isPotStakingConfigured && Boolean(address),
      staleTime: 8_000,
    },
  });

  const totalStakedRead = useReadContract({
    address: CONTRACT_ADDRESSES.potStaking,
    abi: kudexPOTStakingAbi,
    functionName: 'totalStaked',
    chainId: portaldotTestnet.id,
    query: {
      enabled: isPotStakingConfigured,
      staleTime: 10_000,
    },
  });

  const userStakeUnits =
    typeof stakedBalanceRead.data === 'bigint' ? stakedBalanceRead.data : 0n;
  const totalStakedUnits =
    typeof totalStakedRead.data === 'bigint' ? totalStakedRead.data : 0n;
  const claimableUnits =
    typeof claimableRewardsRead.data === 'bigint' ? claimableRewardsRead.data : 0n;
  const hasFeeWaiver =
    Boolean(feeWaiverRead.data) || userStakeUnits >= HUNDRED_POT_UNITS;

  const progressPct = Math.min(
    100,
    Number((userStakeUnits * 100n) / HUNDRED_POT_UNITS),
  );

  const claimableFormatted = Number(
    formatUnits(claimableUnits, rewardDecimals),
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  async function refreshAll() {
    await Promise.all([
      stakedBalanceRead.refetch(),
      feeWaiverRead.refetch(),
      claimableRewardsRead.refetch(),
      totalStakedRead.refetch(),
      queryClient.invalidateQueries({ queryKey: [LIVE_ACTIVITY_QUERY_KEY] }),
    ]);
  }

  async function handleLockPot(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client) {
        throw new Error('Connect your wallet on the active network to lock POT.');
      }
      if (!isPotStakingConfigured) {
        throw new Error(
          'POT Fee-Free Membership contract is not yet configured on this deployment.',
        );
      }
      if (!amount || Number(amount) <= 0) {
        throw new Error('Enter a POT amount greater than zero.');
      }
      const valueUnits = parseUnits(amount, PORTALDOT_NATIVE_DECIMALS);
      setStatus(`Locking ${amount} POT in the Fee-Free Membership Vault…`);
      const sim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.potStaking,
        abi: kudexPOTStakingAbi,
        functionName: 'stakePOT',
        value: valueUnits,
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });
      await refreshAll();
      setStatus(
        `Locked ${amount} POT on-chain (${truncateAddress(txHash)}). ${
          userStakeUnits + valueUnits >= HUNDRED_POT_UNITS
            ? '0% Fee Business Transfers & Swaps unlocked.'
            : ''
        }`,
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlockPot() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client || !isPotStakingConfigured) {
        throw new Error('Connect your wallet on the active network to unlock POT.');
      }
      if (!amount || Number(amount) <= 0) {
        throw new Error('Enter the POT amount you want to unlock.');
      }
      const unlockUnits = parseUnits(amount, PORTALDOT_NATIVE_DECIMALS);
      if (unlockUnits > userStakeUnits) {
        throw new Error('Requested unlock amount exceeds your locked POT balance.');
      }
      setStatus(`Unlocking ${amount} POT back to your wallet…`);
      const sim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.potStaking,
        abi: kudexPOTStakingAbi,
        functionName: 'unstakePOT',
        args: [unlockUnits],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });
      await refreshAll();
      setStatus(`Unlocked ${amount} POT (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimRewards() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client || !isPotStakingConfigured) {
        throw new Error('Connect your wallet on the active network to claim rewards.');
      }
      setStatus('Claiming accrued protocol revenue rewards…');
      const sim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.potStaking,
        abi: kudexPOTStakingAbi,
        functionName: 'claimRewards',
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });
      await refreshAll();
      setStatus(`Protocol fee rewards claimed (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="pot-membership-heading"
      className="panel space-y-6 border-primary/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="emerald-badge">
              <FiAward aria-hidden="true" />
              <span>POT Fee-Free Membership</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
              {hasFeeWaiver ? (
                <>
                  <FiCheckCircle className="text-primary" aria-hidden="true" />
                  <span>0% Fee Tier Active</span>
                </>
              ) : (
                <span>Lock 100 POT for 0% Fees</span>
              )}
            </span>
          </div>
          <h2 id="pot-membership-heading" className="text-xl font-bold">
            0% Fee Business Transfers &amp; Swaps Membership
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Lock at least <strong className="text-foreground">100 POT</strong> (14-decimal
            native network token) to waive the 0.10% settlement fee across Best-Price
            Swaps and On-Chain Invoices while earning a direct share of protocol fee
            revenue. You can unlock your POT anytime.
          </p>
        </div>
      </div>

      {/* Live POT Membership Metrics */}
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-secondary p-4">
          <dt className="text-sm text-muted-foreground">Your Locked POT</dt>
          <dd className="mt-1 text-2xl font-bold text-primary tabular-nums">
            {formatPotDisplay(userStakeUnits)} POT
          </dd>
          <dd className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {progressPct}% of 100 POT threshold
          </dd>
        </div>

        <div className="rounded-xl bg-secondary p-4">
          <dt className="text-sm text-muted-foreground">Your Settlement Fee Rate</dt>
          <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {hasFeeWaiver ? '0.00% (Fee-Free)' : '0.10% Standard'}
          </dd>
          <dd className="mt-0.5 text-sm text-muted-foreground">
            {hasFeeWaiver
              ? 'Applied automatically to swaps & invoices'
              : 'Lock 100+ POT for instant 0% fees'}
          </dd>
        </div>

        <div className="rounded-xl bg-secondary p-4">
          <dt className="text-sm text-muted-foreground">Claimable Fee Rewards</dt>
          <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            ${claimableFormatted} {rewardSymbol}
          </dd>
          <dd className="mt-0.5 text-sm text-muted-foreground">
            Earned from non-member settlement fees
          </dd>
        </div>

        <div className="rounded-xl bg-secondary p-4">
          <dt className="text-sm text-muted-foreground">Total Network POT Locked</dt>
          <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {formatPotDisplay(totalStakedUnits)} POT
          </dd>
          <dd className="mt-0.5 text-sm text-muted-foreground">
            Active business membership pool
          </dd>
        </div>
      </dl>

      <form onSubmit={(e) => void handleLockPot(e)} className="space-y-4">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="pot-stake-amount" className="text-sm font-medium">
                POT Amount to Lock or Unlock
              </label>
              <button
                type="button"
                onClick={() => setAmount('100')}
                disabled={busy}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Fill 100 POT (Fee-Free Tier)
              </button>
            </div>
            <input
              id="pot-stake-amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              disabled={busy}
              required
              className="field-input font-bold tabular-nums"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button type="submit" disabled={busy} className="action-link disabled:opacity-40">
              <FiLock aria-hidden="true" />
              <span>{busy ? 'Processing…' : 'Lock POT for 0% Fees'}</span>
            </button>

            <button
              type="button"
              disabled={busy || userStakeUnits === 0n}
              onClick={() => void handleUnlockPot()}
              className="quiet-link text-sm disabled:opacity-40"
            >
              <FiUnlock aria-hidden="true" />
              <span>Unlock POT</span>
            </button>

            <button
              type="button"
              disabled={busy || claimableUnits === 0n}
              onClick={() => void handleClaimRewards()}
              className="quiet-link text-sm disabled:opacity-40"
            >
              <FiDollarSign className="text-primary" aria-hidden="true" />
              <span>Claim Fee Rewards</span>
            </button>
          </div>
        </div>
      </form>

      {status && (
        <p role="status" className="text-sm font-semibold text-primary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
