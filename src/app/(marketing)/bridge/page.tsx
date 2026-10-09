'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  FiArrowRight,
  FiRepeat,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiGlobe,
  FiDollarSign,
  FiLock,
  FiClock,
  FiLayers,
  FiActivity,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiRouteLine } from 'react-icons/ri';

export default function PublicBridgePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.from(containerRef.current.querySelectorAll('.bridge-anim'), {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        });
      }
    },
    { scope: containerRef }
  );

  const supportedNetworks = [
    {
      name: 'Ethereum Mainnet',
      asset: 'USDC / USDT / ETH',
      fillSpeed: '< 45s',
      fee: '0.08%',
      security: 'L1 Finality Anchor',
      status: 'Active',
    },
    {
      name: 'Base',
      asset: 'USDC / cbETH',
      fillSpeed: '< 12s',
      fee: '0.05%',
      security: 'OP Stack Settlement',
      status: 'Active',
    },
    {
      name: 'Arbitrum One',
      asset: 'USDC / ARB / ETH',
      fillSpeed: '< 15s',
      fee: '0.05%',
      security: 'Nitro Rollup Solvency',
      status: 'Active',
    },
    {
      name: 'Optimism',
      asset: 'USDC / OP / ETH',
      fillSpeed: '< 15s',
      fee: '0.05%',
      security: 'Superchain Mesh',
      status: 'Active',
    },
  ];

  return (
    <div ref={containerRef} className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      {/* Breadcrumb Header */}
      <div className="bridge-anim flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-emerald-600 dark:text-[#00E599] font-semibold">Cross-Chain Gateway</span>
      </div>

      {/* Hero Header */}
      <div className="bridge-anim max-w-4xl space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-emerald-600 dark:text-[#00E599]">
          <RiRouteLine className="w-4 h-4" />
          <span>CROSS-CHAIN CAPITAL GATEWAY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Instant Solver Bridging & Shield on Arrival
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Move institutional capital between major EVM networks and the Kudex Settlement Layer in seconds.
          Select &ldquo;Shield on Arrival&rdquo; to mint confidential commitment notes directly as the transfer completes.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/app/bridge"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
          >
            <span>Launch Bridge Workspace</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-[#0E121B] hover:bg-slate-200 dark:hover:bg-[#161C2B] text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-[#21293D] transition"
          >
            <span>How Bridging Works</span>
          </Link>
        </div>
      </div>

      {/* 3 Core Bridging Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bridge-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiZap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero-Delay Solver Fills</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Institutional solvers front native liquidity immediately on destination. Never wait for multi-hour
            optimistic dispute windows or slow multi-sig validation relays.
          </p>
          <div className="pt-3 text-sm font-mono text-emerald-600 dark:text-[#00E599] flex items-center gap-2 font-semibold">
            <FiClock className="w-4 h-4" />
            <span>Average Finality: ~12 Seconds</span>
          </div>
        </div>

        <div className="bridge-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiLock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Shield on Arrival</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Prevent cross-chain address association. Funds routed into Kudex are immediately converted into
            client-side encrypted notes, breaking public wallet tracking across chains.
          </p>
          <div className="pt-3 text-sm font-mono text-emerald-600 dark:text-[#00E599] flex items-center gap-2 font-semibold">
            <FiShield className="w-4 h-4" />
            <span>Zero Cross-Chain Address Linkage</span>
          </div>
        </div>

        <div className="bridge-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Negligible Solver Fees</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Competitive solver markets drive liquidity costs down to near zero. Execute large enterprise transfers
            with predictable basis-point fee structures.
          </p>
          <div className="pt-3 text-sm font-mono text-slate-700 dark:text-neutral-300 flex items-center gap-2 font-semibold">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            <span>As low as 5 to 8 bps (0.05% - 0.08%)</span>
          </div>
        </div>
      </div>

      {/* 4-Step Settlement Architecture */}
      <div className="bridge-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161C2B] text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiGlobe className="w-3.5 h-3.5" />
            <span>CROSS-CHAIN LIFECYCLE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            How Intent-Based Solver Bridging Operates
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Unlike legacy lock-and-mint bridges vulnerable to smart contract exploits, Kudex uses intent settlements backed by bonded liquidity providers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              01
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast Deposit Intent</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              User locks tokens on origin chain (Ethereum, Base, Arbitrum) emitting a signed settlement intent.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              02
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Solver Fill Race</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Solvers stake collateral and provide immediate native tokens on Kudex in less than 15 seconds.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              03
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Shield on Arrival Mint</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              If enabled, destination funds are minted straight into a confidential note, hiding final balance and recipient.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              04
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Atomic Claim & Payout</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Origin tokens are unlocked for the successful solver once proof of destination arrival verifies on-chain.
            </p>
          </div>
        </div>
      </div>

      {/* Supported Networks Matrix Table */}
      <div className="bridge-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Supported Capital Corridors & Performance
        </h3>
        <p className="text-base text-slate-600 dark:text-neutral-400 mb-6">
          Direct liquidity pipes connected to premier Layer 1 and Layer 2 EVM ecosystems
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-base">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#21293D] text-sm text-slate-500 dark:text-neutral-400">
                <th className="pb-3.5 font-semibold">NETWORK</th>
                <th className="pb-3.5 font-semibold">SUPPORTED ASSETS</th>
                <th className="pb-3.5 font-semibold">AVERAGE FILL</th>
                <th className="pb-3.5 font-semibold">SOLVER FEE</th>
                <th className="pb-3.5 font-semibold">SECURITY MODEL</th>
                <th className="pb-3.5 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21293D] text-slate-800 dark:text-neutral-300">
              {supportedNetworks.map((net) => (
                <tr key={net.name}>
                  <td className="py-4 font-bold text-slate-900 dark:text-white">{net.name}</td>
                  <td className="py-4 text-slate-600 dark:text-neutral-300 font-semibold">{net.asset}</td>
                  <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold tabular-nums">{net.fillSpeed}</td>
                  <td className="py-4 tabular-nums font-semibold">{net.fee}</td>
                  <td className="py-4 text-slate-500 dark:text-neutral-400 text-sm">{net.security}</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{net.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SECTION 1: SOLVER SLASHING PROTOCOL & CAPITAL SECURITY BOUNDS */}
      <div className="bridge-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161C2B] text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiShield className="w-3.5 h-3.5" />
            <span>SOLVER ECONOMIC SECURITY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Solver Slashing Protocol & Capital Security Bounds
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Every cross-chain transaction executed by a Kudex solver is backed by on-chain staked capital.
            Rigorous mathematical bounds ensure funds are guaranteed even in the event of solver downtime or failure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">150% Bonded Collateral</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Solvers must lock a minimum of 150% of the intent value in audited staking contracts before broadcasting fill commitments.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiClock className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Deterministic Timeout Fallback</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              If a solver claims an intent but fails to deliver destination assets within 120 seconds, their bond is automatically slashed and routed to the user.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Non-Custodial Escrow Safety</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Original assets never enter third-party custodial wallets. Origin funds remain locked in autonomous contracts until atomic verification is finalized.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: CROSS-ROLLUP MESSAGE PASSING & GAS SUBSIDIES */}
      <div className="bridge-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161C2B] text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiLayers className="w-3.5 h-3.5" />
            <span>INFRASTRUCTURE ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Cross-Rollup Message Passing & Automated Gas Subsidies
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Bridging into Kudex eliminates the friction of destination gas acquisition. Every bridged transfer
            automatically provisions native settlement gas alongside the confidential credit note.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiZap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Automated Gas Fueling</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              First-time cross-chain transfers arrive with bundled execution gas on the Kudex ledger, removing the need for pre-existing native tokens.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiRepeat className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Rollup State Verification</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Optimistic and zero-knowledge rollup state roots are continuously indexed to guarantee sub-second receipt proofs without centralized relays.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
              <FiLock className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Atomic Note Invariants</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Confidential notes are verified mathematically prior to destination commitment inscription, ensuring flawless conservation of value.
            </p>
          </div>
        </div>
      </div>

      {/* Institutional CTA Box */}
      <div className="bridge-anim p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ready to Move Institutional Capital?</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Execute real-time cross-chain transfers with bonded solver guarantees and optional shield-on-arrival notes.
          </p>
        </div>
        <Link
          href="/app/bridge"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 flex-shrink-0"
        >
          <span>Open Bridge App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
