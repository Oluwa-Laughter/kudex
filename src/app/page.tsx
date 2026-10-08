'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from '@/components/navigation/Navbar';
import {
  FiShield,
  FiZap,
  FiLock,
  FiActivity,
  FiArrowRight,
  FiTerminal,
  FiCpu,
  FiLayers,
  FiCheckCircle,
  FiCode,
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

const PILLARS = [
  {
    icon: FiLock,
    title: 'Confidential RWA Vaults',
    tag: 'ERC-4626 + ZK',
    description:
      'Fractionalized credit facilities and real-world asset pools shielded by client-side Groth16 commitments. Maintain full financial privacy while preserving verifiable solvency.',
  },
  {
    icon: FiZap,
    title: 'Agentic RFQ Solvers',
    tag: 'Zero MEV Leakage',
    description:
      'Intent-centric off-chain quote aggregation settled atomically on Portaldot V3.0 EVM. Competitive solvers compete to execute block-atomic cross-chain swaps without sandwich attacks.',
  },
  {
    icon: FiCpu,
    title: 'Autonomous Session Delegation',
    tag: 'ERC-7579 Policies',
    description:
      'Delegate high-frequency execution to AI agents with granular, bounded session key policies. Zero wallet popups, strict spending limits, and automated expiry.',
  },
  {
    icon: FiActivity,
    title: 'Portaldot DaaS Integration',
    tag: 'Default-as-a-Service',
    description:
      'On-chain algorithmic sentinel hooks monitor collateralization and credit health factors. Automated restructuring cascades prevent systemic bad debt before insolvency occurs.',
  },
];

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();

  const fadeInVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Glassmorphic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 border-b border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-blue-500/10 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Portaldot Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-xs font-mono text-emerald-800 dark:text-emerald-300 mb-8 backdrop-blur-sm shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Natively Built for Portaldot Network V3.0 EVM (Chain ID 8890)</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.1 } },
            }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-mono max-w-5xl mx-auto leading-[1.1] text-neutral-900 dark:text-white"
          >
            Autonomous Confidential Settlement & Agentic RFQ Layer
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.2 } },
            }}
            className="mt-6 text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed font-sans"
          >
            Kudex unifies fractionalized Real World Asset (RWA) vaults, client-side Zero-Knowledge commitments, Default-as-a-Service debt restructuring, and zero-popup ERC-7579 session execution.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.3 } },
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm font-mono transition shadow-lg shadow-emerald-600/20"
            >
              <FiTerminal className="w-4 h-4" />
              <span>Launch Sentinel Terminal</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/vaults"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 font-medium text-sm font-mono transition backdrop-blur-sm"
            >
              <FiLock className="w-4 h-4 text-emerald-500" />
              <span>Explore Shielded Vaults</span>
            </Link>
          </motion.div>

          {/* Live Invariant Metrics Bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.8, delay: 0.4 } },
            }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left"
          >
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
              <span className="text-[11px] font-mono text-neutral-500 block uppercase">Native POT Precision</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">14 Decimals</span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
              <span className="text-[11px] font-mono text-neutral-500 block uppercase">ZK Proof System</span>
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">Groth16 Snarkjs</span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
              <span className="text-[11px] font-mono text-neutral-500 block uppercase">Settlement Speed</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">Sub-Second Atomic</span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md">
              <span className="text-[11px] font-mono text-neutral-500 block uppercase">DaaS Restructuring</span>
              <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">Automated Cascade</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Framer Motion Terminal Preview */}
      <section className="py-16 md:py-24 bg-neutral-50/50 dark:bg-neutral-950/40 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
              Autonomous Copilot Demonstration
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              Natural Language to Atomic EVM Calldata
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-neutral-900 text-neutral-100 shadow-2xl overflow-hidden font-mono text-xs"
          >
            {/* Terminal Header */}
            <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-neutral-400 text-[11px]">kudex-sentinel-v3.0.sh</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portaldot EVM 8890</span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 space-y-4 font-mono">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="text-emerald-400">user@portaldot:~$</span>
                <span className="text-neutral-100 font-semibold">
                  kudex swap 500 pUSD for wPOT --max-slippage 50bps --shield
                </span>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <RiRobot2Line className="w-4 h-4" />
                  <span className="font-bold">Sentinel Copilot Stream Activated</span>
                </div>
                <p className="text-neutral-300">
                  Decomposing intent into Portaldot RFQ atomic swap order with Groth16 shielded receipt.
                </p>
                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-neutral-400 border-t border-neutral-800/80">
                  <div>Amount In: <span className="text-white font-bold">500.000000 pUSD (6 dec)</span></div>
                  <div>Estimated Out: <span className="text-emerald-400 font-bold">250.00000000000000 wPOT (14 dec)</span></div>
                  <div>Solver Route: <span className="text-white">0xSolverPortaldotAlpha77</span></div>
                  <div>State Diff Audit: <span className="text-emerald-400 font-bold">Zero Reentrancy Detected</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>ERC-7579 Bounded Session Key Ready: Single-click execution without signature dialogs</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Matrix: Four Core Pillars */}
      <section id="pillars" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
            Architectural Foundations
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-neutral-900 dark:text-white mt-2">
            The Kudex Protocol Pillar Matrix
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mt-3 text-sm">
            Engineered from first principles to bring institution-grade confidential settlement to the Portaldot Network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md hover:border-emerald-500/40 transition group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    {pillar.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-mono text-neutral-900 dark:text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed font-sans">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">KUDEX PROTOCOL</span>
            <span className="text-neutral-400 text-xs">|</span>
            <span className="text-neutral-500 text-xs font-mono">Portaldot Network V3.0 EVM</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-500 font-mono">
            <a
              href="https://github.com/Oluwa-Laughter/kudex"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-500 transition flex items-center gap-1"
            >
              <FiCode className="w-3.5 h-3.5" />
              <span>Source Repository</span>
            </a>
            <a
              href="https://testnet.portaldot.world/explorer"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-500 transition flex items-center gap-1"
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>Network Explorer</span>
            </a>
            <Link href="/dashboard" className="hover:text-emerald-500 transition">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
