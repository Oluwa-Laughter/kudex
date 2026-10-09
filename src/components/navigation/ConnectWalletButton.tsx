'use client';

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { FiPower, FiChevronDown, FiCpu } from 'react-icons/fi';
import { RiWallet3Line } from 'react-icons/ri';
import { truncateAddress } from '@/lib/utils';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { formatDisplayBalance } from '@/lib/math';

export function ConnectWalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: balanceData } = useBalance({
    address,
    chainId: portaldotTestnet.id,
  });

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:bg-slate-50 dark:hover:bg-[#161C2B] text-slate-800 dark:text-neutral-200 transition text-sm font-mono font-medium shadow-sm"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse" />
          <span className="text-slate-800 dark:text-neutral-200">
            {truncateAddress(address)}
          </span>
          {balanceData && (
            <span className="text-[#00E599] font-semibold hidden sm:inline tabular-nums">
              {formatDisplayBalance(balanceData.value, balanceData.decimals, 3)} {balanceData.symbol}
            </span>
          )}
          <FiChevronDown className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-2.5 z-50 text-sm">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-[#21293D]">
              <span className="text-slate-500 dark:text-neutral-400 block text-xs uppercase font-mono tracking-wider">Settlement Ledger</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-100 mt-0.5 block">
                Primary Network
              </span>
            </div>

            <div className="px-3 py-2 border-b border-slate-200 dark:border-[#21293D]">
              <span className="text-slate-500 dark:text-neutral-400 block text-xs uppercase font-mono tracking-wider">Account Identity</span>
              <span className="font-mono text-slate-700 dark:text-neutral-200 break-all text-xs mt-0.5 block">
                {address}
              </span>
            </div>

            <button
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition mt-1 font-medium text-sm"
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
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={isPending}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] transition text-sm font-semibold shadow-lg shadow-[#00E599]/15 disabled:opacity-50"
      >
        <RiWallet3Line className="w-4 h-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-2.5 z-50 text-sm">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-[#21293D] text-slate-500 dark:text-neutral-400 font-mono text-xs uppercase tracking-wider">
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
                className="w-full flex items-center justify-between px-3 py-2 text-slate-800 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#161C2B] rounded-lg transition"
              >
                <div className="flex items-center gap-2.5">
                  <FiCpu className="w-4 h-4 text-[#00E599]" />
                  <span className="font-medium">{connector.name}</span>
                </div>
                <span className="text-xs font-mono text-slate-400 dark:text-neutral-500">SECURE</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
