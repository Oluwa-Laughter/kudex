'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { useGasPrice, useBlockNumber } from 'wagmi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { FiActivity, FiLayers, FiRadio } from 'react-icons/fi';
import { formatUnits } from 'viem';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: blockNumber } = useBlockNumber({
    chainId: portaldotTestnet.id,
    watch: true,
  });

  const { data: gasPriceWei } = useGasPrice({
    chainId: portaldotTestnet.id,
  });

  // Calculate POT gas in Gwei or micro-POT (14 decimals)
  const gasPriceDisplay = gasPriceWei
    ? `${parseFloat(formatUnits(gasPriceWei, 9)).toFixed(2)} Gwei`
    : '1.20 Gwei';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Collapsible Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Ribbon */}
        <header className="h-16 flex-shrink-0 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <MobileDrawer />

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <FiRadio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Portaldot V3.0</span>
                </div>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600 dark:text-neutral-300">
                  Block #{blockNumber ? blockNumber.toString() : '482910'}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                <FiActivity className="w-3.5 h-3.5 text-blue-500" />
                <span>Gas: {gasPriceDisplay}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
              <FiLayers className="w-3.5 h-3.5 text-emerald-500" />
              <span>EVM 8890</span>
            </div>

            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>

        {/* Tabular Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
