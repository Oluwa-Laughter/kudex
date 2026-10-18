'use client';
import { FiArrowUpRight, FiRefreshCw } from 'react-icons/fi';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
export function NativeAccountCard() {
  const { selected } = useNativeWallet();
  const account = useNativeAccount();
  if (!selected)
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-6">
        <div>
          <h2 className="font-sans text-base font-semibold tracking-normal">
            Start with your Portaldot account
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect your native extension from Wallets to check funding and the runtime’s
            contract address mapping.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
          href="/app/how-it-works"
        >
          Wallet guide <FiArrowUpRight aria-hidden="true" />
        </a>
      </section>
    );
  return (
    <section className="panel" aria-label="Native Portaldot account">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-primary">Portaldot native account</p>
          <h2 className="mt-2 text-xl font-semibold">
            {selected.name || 'Your extension account'}
          </h2>
        </div>
        <button
          className="quiet-link"
          disabled={account.isFetching}
          onClick={() => void account.refetch()}
        >
          <FiRefreshCw aria-hidden="true" />
          {account.isFetching ? 'Checking…' : 'Refresh'}
        </button>
      </div>
      {account.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {account.error.message}
          {account.data
            ? ' The observation below is from the previous successful check.'
            : ''}
        </p>
      )}
      {account.data ? (
        <>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Native free balance</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {account.data.nativeFreeTPOT}{' '}
                <span className="text-base font-normal text-muted-foreground">tPOT</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Observed at finalized block
              </dt>
              <dd className="mt-1 text-2xl tabular-nums">
                {account.data.finalizedBlock}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                Contract-facing address from the runtime
              </dt>
              <dd className="mt-2 break-all rounded-xl bg-background p-3 font-mono text-sm">
                {account.data.contractAddress}
              </dd>
            </div>
          </dl>
          <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
            Free balance can include frozen funds and does not subtract fees or minimum
            account requirements. Native balances use 14 decimals; EVM gas uses 18. The
            mapped address has no separate EVM signing key.
          </p>
          {account.data.nativeFreeTPOT === '0' && (
            <p role="status" className="mt-4 rounded-xl bg-secondary p-4 text-sm">
              This native account has no free test tokens at the observed finalized block.
              Await the organizer allocation before signing.
            </p>
          )}
        </>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          {account.isFetching
            ? 'Reading native runtime metadata and finalized account state…'
            : 'No native balance observation is available yet.'}
        </p>
      )}
    </section>
  );
}
