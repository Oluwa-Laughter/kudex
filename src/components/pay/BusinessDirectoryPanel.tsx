'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { isAddress, keccak256, toBytes, zeroAddress, type Address, type Hex } from 'viem';
import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  CONTRACT_ADDRESSES,
  isBusinessRegistryConfigured,
} from '@/lib/contracts/addresses';
import { kudexBusinessRegistryAbi } from '@/lib/contracts/abis';
import { LIVE_ACTIVITY_QUERY_KEY } from '@/lib/hooks/useLiveActivity';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

export interface OnChainBusinessRecord {
  owner: Address;
  businessName: string;
  category: string;
  registrationHash: Hex;
  payoutAddress: Address;
  active: boolean;
  registeredAt: bigint;
}

export function BusinessLookupBar({
  onSelectBusiness,
  label = 'Lookup Verified Business by Name (On-Chain Directory)',
}: {
  onSelectBusiness: (business: {
    businessName: string;
    payoutAddress: Address;
    category: string;
  }) => void;
  label?: string;
}) {
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const [searchName, setSearchName] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [resolved, setResolved] = useState<{
    businessName: string;
    payoutAddress: Address;
    category: string;
  } | null>(null);

  async function handleLookup() {
    setSearching(true);
    setLookupError('');
    setResolved(null);
    try {
      if (!searchName.trim()) {
        throw new Error('Enter a registered company name to resolve.');
      }
      if (!client || !isBusinessRegistryConfigured) {
        throw new Error(
          'On-chain Business Identity Registry is not yet configured on this deployment.',
        );
      }
      const [found, , profile] = await client.readContract({
        address: CONTRACT_ADDRESSES.businessRegistry,
        abi: kudexBusinessRegistryAbi,
        functionName: 'tryResolveBusinessByName',
        args: [searchName.trim()],
      });
      if (!found || !profile.active) {
        throw new Error(
          `No active verified business found matching "${searchName.trim()}".`,
        );
      }
      const match = {
        businessName: profile.businessName,
        payoutAddress: profile.payoutAddress,
        category: profile.category,
      };
      setResolved(match);
      onSelectBusiness(match);
    } catch (cause) {
      setLookupError(getReadableErrorMessage(cause));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleLookup();
              }
            }}
            placeholder="Type company name (e.g. Northstar Logistics LLC)"
            className="field-input text-sm"
          />
        </div>

        <button
          type="button"
          disabled={searching || !searchName.trim()}
          onClick={() => void handleLookup()}
          className="quiet-link text-sm disabled:opacity-40"
        >
          <FiSearch aria-hidden="true" />
          <span>{searching ? 'Resolving…' : 'Resolve Business Wallet'}</span>
        </button>
      </div>

      {resolved && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <FiCheckCircle className="text-primary shrink-0" aria-hidden="true" />
            <span className="font-bold text-foreground">{resolved.businessName}</span>
            <span className="text-muted-foreground">({resolved.category})</span>
            <span className="font-mono text-primary">
              {truncateAddress(resolved.payoutAddress)}
            </span>
          </div>
          <span className="font-semibold text-primary">Auto-Filled</span>
        </div>
      )}

      {lookupError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {lookupError}
        </p>
      )}
    </div>
  );
}

export function BusinessDirectoryPanel({
  onPayBusiness,
  onInvoiceBusiness,
  onAddBusinessToBatch,
}: {
  onPayBusiness: (business: OnChainBusinessRecord) => void;
  onInvoiceBusiness: (business: OnChainBusinessRecord) => void;
  onAddBusinessToBatch: (business: OnChainBusinessRecord) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Supplier & Trade Partner');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [registrationRef, setRegistrationRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  useEffect(() => {
    if (address && !payoutAddress) {
      setPayoutAddress(address);
    }
  }, [address, payoutAddress]);

  const myProfileQuery = useQuery({
    queryKey: [
      'my-business-profile',
      CONTRACT_ADDRESSES.businessRegistry,
      address,
    ],
    enabled: isBusinessRegistryConfigured && Boolean(client && address),
    staleTime: 10_000,
    queryFn: async () => {
      const profile = await client!.readContract({
        address: CONTRACT_ADDRESSES.businessRegistry,
        abi: kudexBusinessRegistryAbi,
        functionName: 'getBusinessProfile',
        args: [address!],
      });
      return profile;
    },
  });

  const directoryQuery = useQuery({
    queryKey: ['onchain-business-directory', CONTRACT_ADDRESSES.businessRegistry],
    enabled: isBusinessRegistryConfigured && Boolean(client),
    staleTime: 10_000,
    queryFn: async (): Promise<OnChainBusinessRecord[]> => {
      const [owners, profiles] = await client!.readContract({
        address: CONTRACT_ADDRESSES.businessRegistry,
        abi: kudexBusinessRegistryAbi,
        functionName: 'getBusinesses',
        args: [0n, 50n],
      });
      return owners
        .map((owner, idx) => ({
          owner,
          businessName: profiles[idx].businessName,
          category: profiles[idx].category,
          registrationHash: profiles[idx].registrationHash,
          payoutAddress: profiles[idx].payoutAddress,
          active: profiles[idx].active,
          registeredAt: profiles[idx].registeredAt,
        }))
        .filter((item) => item.active && item.registeredAt > 0n);
    },
  });

  useEffect(() => {
    if (myProfileQuery.data && myProfileQuery.data.registeredAt > 0n) {
      setBusinessName((prev) => prev || myProfileQuery.data!.businessName);
      setCategory((prev) =>
        prev === 'Supplier & Trade Partner' && myProfileQuery.data!.category
          ? myProfileQuery.data!.category
          : prev,
      );
      setPayoutAddress((prev) => prev || myProfileQuery.data!.payoutAddress);
    }
  }, [myProfileQuery.data]);

  const alreadyRegistered = Boolean(
    myProfileQuery.data && myProfileQuery.data.registeredAt > 0n,
  );

  async function handleRegisterOrUpdate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client) {
        throw new Error(
          'Connect your wallet on the active network to register your business on-chain.',
        );
      }
      if (!isBusinessRegistryConfigured) {
        throw new Error(
          'Verified Business Identity Registry contract is not yet configured on this deployment.',
        );
      }
      if (!businessName.trim()) {
        throw new Error('Enter your company or trading name.');
      }
      const targetPayout = payoutAddress.trim() || address;
      if (!isAddress(targetPayout) || targetPayout.toLowerCase() === zeroAddress) {
        throw new Error('Enter a valid payout wallet address starting with 0x.');
      }

      const regHash = registrationRef.trim()
        ? keccak256(toBytes(registrationRef.trim()))
        : (`0x${'0'.repeat(64)}` as Hex);

      setStatus('Publishing verified business profile to the on-chain directory…');
      const sim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.businessRegistry,
        abi: kudexBusinessRegistryAbi,
        functionName: 'registerBusiness',
        args: [
          businessName.trim(),
          category.trim() || 'Business',
          regHash,
          targetPayout as Address,
        ],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });

      await Promise.all([
        myProfileQuery.refetch(),
        directoryQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: [LIVE_ACTIVITY_QUERY_KEY] }),
      ]);
      setStatus(
        `Verified business "${businessName.trim()}" registered on-chain (${truncateAddress(txHash)}).`,
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const businesses = directoryQuery.data ?? [];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <form
        onSubmit={(e) => void handleRegisterOrUpdate(e)}
        className="panel min-w-0 space-y-5 border-primary/30"
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="emerald-badge">
              <FiAward aria-hidden="true" />
              <span>On-Chain Business Identity</span>
            </span>
          </div>
          <h2 className="text-xl font-bold">
            {alreadyRegistered
              ? 'Update Verified Business Profile'
              : 'Register Verified Business On-Chain'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Publish your unique company name and verified payout wallet to the network
            directory so customers and partners can pay you by name without address
            copy-paste errors.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="reg-business-name" className="mb-2 block text-sm font-medium">
              Company or Trading Name
            </label>
            <input
              id="reg-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Global Logistics"
              disabled={busy}
              required
              className="field-input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-business-category"
              className="mb-2 block text-sm font-medium"
            >
              Business Category
            </label>
            <input
              id="reg-business-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Logistics & Supply Chain"
              disabled={busy}
              required
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="reg-payout-wallet" className="mb-2 block text-sm font-medium">
              Verified Payout Destination
            </label>
            <input
              id="reg-payout-wallet"
              value={payoutAddress}
              onChange={(e) => setPayoutAddress(e.target.value)}
              placeholder={address ?? '0x…'}
              spellCheck={false}
              disabled={busy}
              required
              className="field-input font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor="reg-doc-ref" className="mb-2 block text-sm font-medium">
              Company Registration Reference (Optional · Hashed On-Chain)
            </label>
            <input
              id="reg-doc-ref"
              value={registrationRef}
              onChange={(e) => setRegistrationRef(e.target.value)}
              placeholder="REG-US-DE-884120"
              disabled={busy}
              className="field-input text-sm"
            />
          </div>
        </div>

        <button type="submit" disabled={busy} className="action-link disabled:opacity-40">
          <FiBriefcase aria-hidden="true" />
          <span>
            {busy
              ? 'Confirming On-Chain…'
              : alreadyRegistered
                ? 'Update Business Profile On-Chain'
                : 'Register Business On-Chain'}
          </span>
        </button>

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
      </form>

      <section className="panel min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Verified Business Directory (On-Chain)</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Live company handles read directly from the network identity registry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground tabular-nums">
              {businesses.length} verified
            </span>
            <button
              type="button"
              disabled={!isBusinessRegistryConfigured || directoryQuery.isFetching}
              onClick={() => void directoryQuery.refetch()}
              aria-label="Refresh business directory"
              className="quiet-link px-3 py-1.5 text-sm disabled:opacity-50"
            >
              <FiRefreshCw
                className={directoryQuery.isFetching ? 'animate-spin' : ''}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {businesses.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary/50 p-5 text-sm text-muted-foreground">
            {isBusinessRegistryConfigured
              ? 'No businesses registered on this chain yet. Use the form on the left to register the first verified company handle on-chain.'
              : 'Connect to an active Business Identity Registry deployment to browse and resolve verified company names on-chain.'}
          </div>
        ) : (
          <div className="space-y-3">
            {businesses.map((biz) => (
              <div
                key={biz.owner}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">{biz.businessName}</span>
                    <span className="emerald-badge">
                      <FiCheckCircle aria-hidden="true" />
                      <span>{biz.category}</span>
                    </span>
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    Payout: {truncateAddress(biz.payoutAddress)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onPayBusiness(biz)}
                    className="quiet-link px-3 py-1.5 text-sm"
                  >
                    <FiSend aria-hidden="true" />
                    <span>Pay Business</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInvoiceBusiness(biz)}
                    className="quiet-link px-3 py-1.5 text-sm"
                  >
                    <FiFileText aria-hidden="true" />
                    <span>Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddBusinessToBatch(biz)}
                    className="quiet-link px-3 py-1.5 text-sm"
                  >
                    <FiPlus aria-hidden="true" />
                    <span>Add to Batch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
