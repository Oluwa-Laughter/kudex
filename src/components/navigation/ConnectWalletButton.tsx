'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import {
  FiX,
  FiCopy,
  FiCheck,
  FiArrowUpRight,
  FiShield,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';
import { RiWallet3Line } from 'react-icons/ri';
import Link from 'next/link';
import { useNativeWallet } from './NativeWalletProvider';
import { useNativeAccount, useEvmMapping } from '@/lib/hooks/useNativeAccount';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';
import { portaldotTestnet } from '@/lib/chains/portaldot';

export function ConnectWalletButton() {
  const { address, chainId } = useAccount();
  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const native = useNativeWallet();
  const { data: nativeAccountData } = useNativeAccount();
  const { data: evmMappingData } = useEvmMapping(address);
  const { data: balanceData } = useBalance({ address, chainId: portaldotTestnet.id });

  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError('');
      setCopied(value);
      window.setTimeout(
        () => setCopied((current) => (current === value ? '' : current)),
        2500,
      );
    } catch {
      setCopyError('Copy failed. Select the address text and copy it manually.');
    }
  }

  const error =
    copyError ||
    (connectError ? getReadableErrorMessage(connectError) : '') ||
    (switchError ? getReadableErrorMessage(switchError) : '');

  const evmBalanceFormatted = balanceData
    ? `${parseFloat(balanceData.formatted).toFixed(2)} ${balanceData.symbol}`
    : 'Unavailable';

  const nativeBalanceFormatted = nativeAccountData?.nativeFreeTPOT
    ? `${parseFloat(nativeAccountData.nativeFreeTPOT).toFixed(2)} tPOT`
    : 'Unavailable';

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={
          address ? 'EVM account' : native.selected ? 'Native account' : 'Connect wallets'
        }
        className="action-link gap-2 px-4 py-2.5 text-sm"
      >
        <RiWallet3Line className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold tabular-nums">
          {address ? (
            <span className="flex items-center gap-2">
              <span>{truncateAddress(address)}</span>
              <span className="hidden rounded-md bg-black/20 px-2 py-0.5 text-sm font-bold sm:inline">
                {evmBalanceFormatted}
              </span>
            </span>
          ) : native.selected ? (
            truncateAddress(native.selected.address)
          ) : (
            'Connect wallets'
          )}
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="wallet-overlay fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" />
        <Dialog.Content className="wallet-dialog fixed left-1/2 top-1/2 z-[60] max-h-[92dvh] w-[calc(100vw-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <Dialog.Title className="text-xl font-bold text-foreground">
                Account & Wallet Settings
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Connect your transaction signer or link a native identity account.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close wallet panel"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <FiX className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <section className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Transaction Wallet
              </h3>
              {address && chainId === portaldotTestnet.id && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Settlement Network Active
                </span>
              )}
            </div>

            {address ? (
              <div className="space-y-4 rounded-2xl border border-border bg-secondary p-4">
                <div>
                  <span className="block text-sm font-medium text-muted-foreground">
                    Connected Address
                  </span>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                    {address}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm text-muted-foreground">
                      Gas Balance
                    </span>
                    <span className="mt-0.5 block font-mono text-base font-bold text-primary tabular-nums">
                      {evmBalanceFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm text-muted-foreground">
                      Network Status
                    </span>
                    <span className="mt-0.5 block text-base font-semibold text-foreground">
                      {chainId === portaldotTestnet.id ? 'Connected' : 'Switch Required'}
                    </span>
                  </div>
                </div>

                {evmMappingData?.nativeFundingAddress && (
                  <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
                      <span>Native Funding Address</span>
                      <button
                        type="button"
                        onClick={() => void copy(evmMappingData.nativeFundingAddress!)}
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {copied === evmMappingData.nativeFundingAddress ? (
                          <FiCheck aria-hidden="true" />
                        ) : (
                          <FiCopy aria-hidden="true" />
                        )}
                        <span>
                          {copied === evmMappingData.nativeFundingAddress
                            ? 'Copied'
                            : 'Copy Address'}
                        </span>
                      </button>
                    </div>
                    <p className="break-all font-mono text-sm font-semibold text-foreground">
                      {evmMappingData.nativeFundingAddress}
                    </p>
                  </div>
                )}

                {chainId !== portaldotTestnet.id && (
                  <button
                    type="button"
                    disabled={switching}
                    onClick={() => switchChain({ chainId: portaldotTestnet.id })}
                    className="cobalt-action w-full text-sm"
                  >
                    {switching ? (
                      <>
                        <FiRefreshCw className="h-4 w-4 animate-spin" />
                        <span>Switching Network…</span>
                      </>
                    ) : (
                      <>
                        <FiAlertTriangle className="h-4 w-4" />
                        <span>Switch to Settlement Network</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="quiet-link px-3 py-2 text-sm"
                    onClick={() => void copy(address)}
                  >
                    {copied === address ? (
                      <FiCheck className="text-primary" aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    <span>{copied === address ? 'Address Copied' : 'Copy Address'}</span>
                  </button>
                  <button
                    type="button"
                    className="quiet-link px-3 py-2 text-sm text-destructive hover:text-destructive"
                    onClick={() => disconnect()}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Select a wallet provider to sign RFQ orders, vault deposits, bridge
                  intents, and session policies.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      type="button"
                      disabled={isConnecting}
                      className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
                      onClick={() => connect({ connector })}
                    >
                      <span>{connector.name}</span>
                      <FiArrowUpRight className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mt-6 space-y-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Native Identity Extension
              </h3>
              {native.selected && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <FiShield className="h-3.5 w-3.5" />
                  Identity Linked
                </span>
              )}
            </div>

            {native.selected ? (
              <div className="space-y-3 rounded-2xl border border-border bg-secondary p-4">
                {native.accounts.length > 1 && (
                  <CustomSelect
                    label="Active Native Account"
                    value={native.selected.address}
                    onChange={native.select}
                    options={native.accounts.map((account) => ({
                      value: account.address,
                      label: account.name ?? truncateAddress(account.address),
                      description: account.source,
                    }))}
                  />
                )}
                <div>
                  <span className="block text-sm font-medium text-muted-foreground">
                    Native Account Address
                  </span>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                    {native.selected.address}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Native Balance:</span>
                    <strong className="ml-2 font-mono font-bold text-primary tabular-nums">
                      {nativeBalanceFormatted}
                    </strong>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">
                    Source: {native.selected.source}
                  </span>
                </div>

                {nativeAccountData?.contractAddress && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                      <span>Mapped Contract Address</span>
                      <button
                        type="button"
                        onClick={() => void copy(nativeAccountData.contractAddress)}
                        className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {copied === nativeAccountData.contractAddress ? (
                          <FiCheck aria-hidden="true" />
                        ) : (
                          <FiCopy aria-hidden="true" />
                        )}
                        <span>
                          {copied === nativeAccountData.contractAddress
                            ? 'Copied'
                            : 'Copy Address'}
                        </span>
                      </button>
                    </div>
                    <p className="break-all font-mono text-sm font-semibold text-foreground">
                      {nativeAccountData.contractAddress}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="quiet-link px-3 py-2 text-sm"
                    onClick={() => void copy(native.selected!.address)}
                  >
                    {copied === native.selected.address ? (
                      <FiCheck className="text-primary" aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    <span>Copy Native Address</span>
                  </button>
                  <button
                    type="button"
                    className="quiet-link px-3 py-2 text-sm text-destructive hover:text-destructive"
                    onClick={native.disconnect}
                  >
                    Disconnect Native
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-border bg-secondary p-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Link your native browser extension to view native balances and your
                  mapped settlement address.
                </p>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
                  disabled={native.pending}
                  onClick={() => void native.connect()}
                >
                  {native.pending ? (
                    <>
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                      <span>Requesting Extension Access…</span>
                    </>
                  ) : (
                    <span>Connect Native Extension</span>
                  )}
                </button>
              </div>
            )}

            {native.error && (
              <div className="space-y-1 rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <FiAlertTriangle className="h-4 w-4 shrink-0 text-primary" />
                  <span>Extension Access Notice</span>
                </div>
                <p className="text-sm leading-relaxed">{native.error}</p>
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <span>Confidential Settlement Layer</span>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <span>Developer Docs</span>
              <FiArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
