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
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-xs font-mono font-medium"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-neutral-700 dark:text-neutral-300">
            {truncateAddress(address)}
          </span>
          {balanceData && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
              {formatDisplayBalance(balanceData.value, balanceData.decimals, 3)} {balanceData.symbol}
            </span>
          )}
          <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-2 z-50 text-xs">
            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px] uppercase font-mono">Connected Network</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {chain?.name || 'Portaldot V3.0 EVM'}
              </span>
            </div>

            <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px] uppercase font-mono">Account Address</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200 break-all text-[11px]">
                {address}
              </span>
            </div>

            <button
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition mt-1 font-medium"
            >
              <FiPower className="w-3.5 h-3.5" />
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
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-medium font-sans shadow-sm disabled:opacity-50"
      >
        <RiWallet3Line className="w-4 h-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-2 z-50 text-xs">
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 font-mono text-[10px] uppercase">
            Select Connector
          </div>
          <div className="space-y-1 mt-1">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              >
                <div className="flex items-center gap-2">
                  <FiCpu className="w-4 h-4 text-emerald-500" />
                  <span>{connector.name}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">EVM</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
