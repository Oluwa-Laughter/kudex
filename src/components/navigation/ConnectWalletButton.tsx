'use client';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { FiX, FiCopy, FiCheck, FiArrowUpRight } from 'react-icons/fi';
import { RiWallet3Line } from 'react-icons/ri';
import { useNativeWallet } from './NativeWalletProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import Link from 'next/link';
export function ConnectWalletButton() {
  const { address, chainId } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const native = useNativeWallet();
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
  return (
    <Dialog.Root>
      <Dialog.Trigger className="action-link">
        <RiWallet3Line aria-hidden="true" />
        <span>
          {native.selected && address
            ? 'Wallets connected'
            : native.selected
              ? 'Native account'
              : address
                ? truncateAddress(address)
                : 'Connect wallets'}
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="wallet-overlay fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content className="wallet-dialog fixed left-1/2 top-1/2 z-[60] max-h-[90dvh] w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-7">
          <Dialog.Title className="pr-10 font-heading text-2xl font-semibold">
            Your wallets
          </Dialog.Title>
          <Dialog.Description className="mt-3 pr-5 text-sm leading-6 text-muted-foreground">
            Native extension access and EVM transaction signing are separate. Connecting
            grants no token allowance.
          </Dialog.Description>
          <Dialog.Close
            aria-label="Close wallet panel"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-secondary"
          >
            <FiX />
          </Dialog.Close>
          <section className="mt-7 border-t border-border pt-5">
            <h2 className="font-sans text-base font-semibold tracking-normal">
              Portaldot extension
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your native account for identification. Native transactions in this
              app are not enabled yet.
            </p>
            {native.selected ? (
              <div className="mt-4 space-y-3">
                <CustomSelect
                  label="Native account"
                  value={native.selected.address}
                  onChange={native.select}
                  options={native.accounts.map((account) => ({
                    value: account.address,
                    label: account.name ?? truncateAddress(account.address),
                    description: account.source,
                  }))}
                />
                <p className="break-all rounded-xl bg-background p-3 font-mono text-xs">
                  {native.selected.address}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="quiet-link"
                    onClick={() => void copy(native.selected!.address)}
                  >
                    {copied === native.selected.address ? (
                      <FiCheck aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    Copy address
                  </button>
                  <button
                    type="button"
                    className="quiet-link"
                    onClick={native.disconnect}
                  >
                    Disconnect from app
                  </button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Balance has not been queried. Connection does not confirm faucet
                  funding. You can also revoke site access in the extension.
                </p>
              </div>
            ) : (
              <button
                type="button"
                className="quiet-link mt-4"
                disabled={native.pending}
                onClick={() => void native.connect()}
              >
                {native.pending ? 'Waiting for extension…' : 'Connect native extension'}
              </button>
            )}
            {!native.selected && native.providers.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {native.providers.map((source) => (
                  <button
                    type="button"
                    className="quiet-link"
                    key={source}
                    disabled={native.pending}
                    onClick={() => void native.connect(source)}
                  >
                    Connect {source}
                  </button>
                ))}
              </div>
            )}
            {native.error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {native.error}
              </p>
            )}
          </section>
          <section className="mt-6 border-t border-border pt-5">
            <h2 className="font-sans text-base font-semibold tracking-normal">
              EVM transaction wallet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Used by the current public vault form. It needs its own verified account
              mapping and testnet gas funds.
            </p>
            {address ? (
              <div className="mt-4 space-y-3">
                <p className="break-all rounded-xl bg-background p-3 font-mono text-xs">
                  {address}
                </p>
                <p className="text-sm text-primary">
                  {chainId === portaldotTestnet.id
                    ? 'Portaldot V3 testnet selected'
                    : 'Switch network before transacting'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {chainId !== portaldotTestnet.id && (
                    <button
                      className="action-link"
                      disabled={switching}
                      onClick={() => switchChain({ chainId: portaldotTestnet.id })}
                    >
                      {switching ? 'Waiting…' : 'Switch to testnet'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="quiet-link"
                    onClick={() => void copy(address)}
                  >
                    {copied === address ? (
                      <FiCheck aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    Copy address
                  </button>
                  <button className="quiet-link" onClick={() => disconnect()}>
                    Disconnect EVM wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    type="button"
                    disabled={isPending}
                    className="quiet-link w-full justify-between disabled:opacity-50"
                    onClick={() => connect({ connector })}
                  >
                    {isPending ? 'Waiting for wallet…' : connector.name}
                    <FiArrowUpRight aria-hidden="true" />
                  </button>
                ))}
                {connectors.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No EVM wallet was detected.
                  </p>
                )}
              </div>
            )}
          </section>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <p role="status" className="mt-2 text-sm text-primary">
            {copied ? 'Address copied.' : ''}
          </p>
          <Link
            href="/app/how-it-works"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-primary"
          >
            Read the wallet guide <FiArrowUpRight aria-hidden="true" />
          </Link>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
