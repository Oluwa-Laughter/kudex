'use client';

import { FiRefreshCw } from 'react-icons/fi';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';

export function NativeAccountCard() {
  const { selected } = useNativeWallet();
  const account = useNativeAccount();

  if (!selected) {
    return null;
  }

  return (
    <section className="panel" aria-label="Native identity account">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Linked Native Account</p>
          <h2 className="mt-1 text-xl font-bold">
            {selected.name || 'Connected Extension Account'}
          </h2>
        </div>
        <button
          className="quiet-link text-sm"
          disabled={account.isFetching}
          onClick={() => void account.refetch()}
        >
          <FiRefreshCw
            className={account.isFetching ? 'animate-spin' : ''}
            aria-hidden="true"
          />
          <span>{account.isFetching ? 'Checking…' : 'Refresh'}</span>
        </button>
      </div>

      {account.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {account.error.message}
        </p>
      )}

      {account.data ? (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-secondary p-4">
            <dt className="text-sm text-muted-foreground">Native free balance</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">
              {account.data.nativeFreeTPOT}{' '}
              <span className="text-base font-normal text-muted-foreground">tPOT</span>
            </dd>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <dt className="text-sm text-muted-foreground">Finalized block</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">
              #{account.data.finalizedBlock}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Mapped settlement address</dt>
            <dd className="mt-2 break-all rounded-xl bg-secondary p-3 font-mono text-sm">
              {account.data.contractAddress}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {account.isFetching
            ? 'Reading finalized native account balance…'
            : 'No native balance observation available yet.'}
        </p>
      )}
    </section>
  );
}
