'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { FiX, FiCopy, FiCheck, FiArrowUpRight, FiShield, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { RiWallet3Line } from 'react-icons/ri';
import { useNativeWallet } from './NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import Link from 'next/link';

export function ConnectWalletButton() {
  const { address, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const native = useNativeWallet();
  const { data: nativeAccountData } = useNativeAccount();

  const { data: balanceData } = useBalance({
    address,
  });

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
    : '0.00 tPOT';

  const nativeBalanceFormatted = nativeAccountData?.nativeFreeTPOT
    ? `${parseFloat(nativeAccountData.nativeFreeTPOT).toFixed(2)} tPOT`
    : '500.00 tPOT';

  return (
    <Dialog.Root>
      <Dialog.Trigger className="action-link gap-2">
        <RiWallet3Line className="w-4 h-4 text-emerald-400" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold">
          {address ? (
            <span className="flex items-center gap-1.5">
              <span>{truncateAddress(address)}</span>
              <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] text-[11px] font-bold">
                {evmBalanceFormatted}
              </span>
            </span>
          ) : native.selected ? (
            truncateAddress(native.selected.address)
          ) : (
            'Connect Wallet'
          )}
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="wallet-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="wallet-dialog fixed left-1/2 top-1/2 z-[60] max-h-[92dvh] w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
            <div>
              <Dialog.Title className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                Wallet Management
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
                Portaldot 3.0 Dual Architecture: Revive EVM & Native Substrate
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close wallet panel"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition"
            >
              <FiX className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Section 1: Primary EVM Transaction Wallet */}
          <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Primary Transaction Wallet (EVM)
              </h3>
              {address && chainId === portaldotTestnet.id && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Portaldot V3 Revive
                </span>
              )}
            </div>

            {address ? (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
                      Connected Address
                    </span>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all mt-0.5">
                      {address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-[#21293D]/60">
                  <div>
                    <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-neutral-400 block">
                      Gas Balance
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-[#00E599]">
                      {evmBalanceFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-neutral-400 block">
                      Network Chain ID
                    </span>
                    <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                      {chainId || 420420777}
                    </span>
                  </div>
                </div>

                {chainId !== portaldotTestnet.id && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={switching}
                      onClick={() => switchChain({ chainId: portaldotTestnet.id })}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
                    >
                      {switching ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                          <span>Switching Network...</span>
                        </>
                      ) : (
                        <>
                          <FiAlertTriangle className="w-4 h-4" />
                          <span>Switch to Portaldot V3 Testnet</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    className="quiet-link px-3 py-1.5 text-xs font-semibold"
                    onClick={() => void copy(address)}
                  >
                    {copied === address ? (
                      <FiCheck className="text-emerald-500" aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    <span>{copied === address ? 'Address Copied' : 'Copy Address'}</span>
                  </button>
                  <button
                    type="button"
                    className="quiet-link px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
                    onClick={() => disconnect()}
                  >
                    Disconnect EVM
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Connect your EVM wallet (MetaMask, Rabby, or WalletConnect) to execute DeFi swaps, add liquidity, and deposit into structured vaults.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      type="button"
                      disabled={isConnecting}
                      className="p-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between transition disabled:opacity-50"
                      onClick={() => connect({ connector })}
                    >
                      <span>{connector.name}</span>
                      <FiArrowUpRight className="w-4 h-4 text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Native Substrate Extension */}
          <section className="mt-6 pt-5 border-t border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Native Substrate Identity (SS58)
              </h3>
              {native.selected && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                  <FiShield className="w-3 h-3" />
                  Substrate Linked
                </span>
              )}
            </div>

            {native.selected ? (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] space-y-3">
                {native.accounts.length > 1 && (
                  <CustomSelect
                    label="Active Substrate Account"
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
                  <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
                    Native Address (starts with 5)
                  </span>
                  <p className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all mt-0.5">
                    {native.selected.address}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-[#21293D]/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-neutral-400">Native Balance:</span>
                    <strong className="font-mono text-emerald-600 dark:text-[#00E599] ml-1.5 font-bold">
                      {nativeBalanceFormatted}
                    </strong>
                  </div>
                  <span className="text-slate-500 dark:text-neutral-400 font-mono text-[11px]">
                    Source: {native.selected.source}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="quiet-link px-3 py-1.5 text-xs font-semibold"
                    onClick={() => void copy(native.selected!.address)}
                  >
                    {copied === native.selected.address ? (
                      <FiCheck className="text-emerald-500" aria-hidden="true" />
                    ) : (
                      <FiCopy aria-hidden="true" />
                    )}
                    <span>Copy Native Address</span>
                  </button>
                  <button
                    type="button"
                    className="quiet-link px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
                    onClick={native.disconnect}
                  >
                    Disconnect Native
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] space-y-3">
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Optional: Connect your Portaldot / Substrate extension to link your native SS58 identity for multi-shard governance.
                </p>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-bold text-slate-900 dark:text-white transition disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={native.pending}
                  onClick={() => void native.connect()}
                >
                  {native.pending ? (
                    <>
                      <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Requesting Extension Access...</span>
                    </>
                  ) : (
                    <span>Connect Portaldot Native Extension</span>
                  )}
                </button>
              </div>
            )}

            {native.error && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FiAlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Extension Access Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-neutral-300">
                  {native.error}
                </p>
              </div>
            )}
          </section>

          {/* Dialog Footer Notice */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#21293D] flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
            <span>Portaldot 3.0 Revive Protocol</span>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-[#00E599] font-bold hover:underline"
            >
              <span>Architecture Guide</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
