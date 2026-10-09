'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import {
  FiPower,
  FiChevronDown,
  FiCpu,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiRepeat,
  FiShield,
} from 'react-icons/fi';
import { RiWallet3Line } from 'react-icons/ri';
import { truncateAddress } from '@/lib/utils';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { formatDisplayBalance } from '@/lib/math';

export function ConnectWalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: balanceData } = useBalance({
    address,
    chainId: portaldotTestnet.id,
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    const explorerUrl = chain?.blockExplorers?.default?.url
      ? `${chain.blockExplorers.default.url}/address/${address}`
      : `https://testnet.explorer.portaldot.io/address/${address}`;

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-1 shadow-sm">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#161C2B] text-slate-800 dark:text-neutral-200 transition text-sm font-mono font-medium"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse" />
            <span className="text-slate-800 dark:text-neutral-200 font-bold">
              {truncateAddress(address)}
            </span>
            {balanceData && (
              <span className="text-emerald-600 dark:text-[#00E599] font-bold hidden sm:inline tabular-nums">
                {formatDisplayBalance(balanceData.value, balanceData.decimals, 3)} {balanceData.symbol}
              </span>
            )}
            <FiChevronDown
              className={`w-4 h-4 text-slate-500 dark:text-neutral-400 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={handleCopyAddress}
            title={copied ? 'Copied address!' : 'Copy address'}
            className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-[#00E599] hover:bg-slate-100 dark:hover:bg-[#161C2B] transition"
          >
            {copied ? (
              <FiCheck className="w-3.5 h-3.5 text-[#00E599]" />
            ) : (
              <FiCopy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-3 z-50 text-sm">
            {/* Header: Network status */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 font-semibold">
                  Settlement Network
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                  <span>{chain?.name ?? 'Settlement Ledger'}</span>
                </span>
              </div>
              {balanceData && (
                <div className="mt-2 text-xs font-mono text-slate-600 dark:text-neutral-300 flex justify-between">
                  <span>Balance:</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatDisplayBalance(balanceData.value, balanceData.decimals, 4)} {balanceData.symbol}
                  </span>
                </div>
              )}
            </div>

            {/* Account Identity with Copy Button */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 font-semibold">
                  Account Identity
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-[#00E599] hover:underline font-bold"
                >
                  {copied ? (
                    <>
                      <FiCheck className="w-3.5 h-3.5 text-[#00E599]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 dark:text-neutral-200 break-all select-all bg-white dark:bg-[#0E121B] p-2 rounded-lg border border-slate-200 dark:border-[#21293D]">
                {address}
              </div>
              <div className="pt-1 flex items-center justify-between text-xs">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-[#00E599] transition font-medium"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  <span>View in Explorer</span>
                </a>
              </div>
            </div>

            {/* Switch Chain options if available */}
            {chains && chains.length > 1 && (
              <div className="mb-3 px-1">
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block mb-1.5 font-semibold">
                  Switch Network
                </span>
                <div className="space-y-1">
                  {chains.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => switchChain({ chainId: c.id })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                        c.id === chain?.id
                          ? 'bg-[#00E599]/15 text-emerald-600 dark:text-[#00E599] font-bold'
                          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                      }`}
                    >
                      <span>{c.name}</span>
                      {c.id === chain?.id && <span className="text-[10px]">CURRENT</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            <button
              type="button"
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition font-semibold text-sm border border-rose-200 dark:border-rose-900/30"
            >
              <FiPower className="w-4 h-4" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={isPending}
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] transition text-sm font-bold shadow-lg shadow-[#00E599]/15 disabled:opacity-50"
      >
        <RiWallet3Line className="w-4 h-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-2.5 z-50 text-sm">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-[#21293D] text-slate-500 dark:text-neutral-400 font-mono text-xs uppercase tracking-wider font-semibold">
            Select Provider
          </div>
          <div className="space-y-1.5 mt-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#161C2B] rounded-xl transition font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <FiCpu className="w-4 h-4 text-[#00E599]" />
                  <span>{connector.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Connect</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
