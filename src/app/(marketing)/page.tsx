import React from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiShield,
  FiLayers,
  FiRepeat,
  FiCpu,
  FiActivity,
  FiLock,
  FiCheckCircle,
  FiZap,
  FiEyeOff,
  FiTrendingUp,
  FiCheck,
} from 'react-icons/fi';
import { RiShieldCheckLine, RiExchangeFundsLine, RiRobot2Line } from 'react-icons/ri';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-5 sm:px-10 lg:px-16 space-y-24 py-12 sm:py-16">
      {/* HERO SECTION */}
      <section className="relative pt-6 pb-12 sm:pb-20 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card text-xs font-mono font-medium text-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Portaldot 3.0 Native • Revive EVM & Substrate Coexistence</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1] text-foreground">
          Confidential Settlement & Structured RWA Credit
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Eliminate mempool front-running, safeguard corporate principal with algorithmic waterfall credit tranches, and settle RFQ orders via autonomous solver fleets on Portaldot 3.0.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/app/overview"
            className="action-link px-7 py-3.5 text-base font-bold shadow-lg shadow-primary/20"
          >
            <span>Launch App</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="quiet-link px-7 py-3.5 text-base font-semibold border border-border rounded-xl"
          >
            <span>How It Works</span>
          </Link>
        </div>

        {/* Live Protocol Telemetry Strip */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border mt-10">
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="text-xs font-mono uppercase text-muted-foreground">Total Value Locked</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">$24.85M</div>
            <div className="text-[11px] text-emerald-600 dark:text-[#00E599] font-medium mt-0.5">Verified on Portaldot</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="text-xs font-mono uppercase text-muted-foreground">Settled Volume</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">$142.6M</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Zero Mempool MEV</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="text-xs font-mono uppercase text-muted-foreground">Solvency Health</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00E599] mt-1">1.42x</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Waterfall Protected</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="text-xs font-mono uppercase text-muted-foreground">Finality Latency</div>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">&lt; 1.2s</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">DHSA Sharded</div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM WE SOLVE VS THE KUDEX SOLUTION */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="eyebrow">The Problem We Solve</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">
            Why Public Blockchains Fail Institutions
          </h2>
          <p className="text-base text-muted-foreground">
            Enterprise capital requires confidentiality, predictable debt structures, and automated execution without MEV predation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problem 1 */}
          <div className="p-7 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Mempool Leaks & MEV
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standard AMM swaps expose orders to public mempools. Bots front-run and sandwich trades, inflicting slippage and execution decay on institutional traders.
            </p>
            <div className="pt-2 border-t border-border text-xs text-primary font-bold flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500" />
              <span>Kudex: Private RFQ Solvers with zero mempool exposure.</span>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="p-7 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Total Balance Transparency
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every balance, payroll transfer, and vendor disbursement is broadcasted publicly on chain explorers. Competitors, employees, and malicious actors inspect proprietary cash flow.
            </p>
            <div className="pt-2 border-t border-border text-xs text-primary font-bold flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500" />
              <span>Kudex: Client-side ZK commitment notes (`pUSD`).</span>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="p-7 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-xl font-bold text-foreground">
              Brutal Flash Liquidations
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              DeFi protocols wipe out borrowers instantly during brief volatility shocks. Physical industry and real-world assets (RWA) require structured credit tranches that absorb losses smoothly.
            </p>
            <div className="pt-2 border-t border-border text-xs text-primary font-bold flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500" />
              <span>Kudex: Waterfall Credit Tranches & Algorithmic Restructuring.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR CORE PILLARS OF KUDEX */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="eyebrow">Architectural Breakthroughs</p>
          <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">
            Four Core Pillars of Kudex
          </h2>
          <p className="text-base text-muted-foreground">
            Engineered natively for Portaldot 3.0 to deliver privacy, capital security, and autonomous efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-sm hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FiLock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Confidential Settlement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Client-side balance commitments decouple addresses from asset values. Public blockchain explorers record only zero-knowledge proofs.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-sm hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FiLayers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Algorithmic Solvency</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Structured credit tranches absorb drawdown smoothly. Automated debt restructuring safeguards senior principal instead of triggering flash liquidations.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-sm hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FiRepeat className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Instant Swaps & Fiat Ramps</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simple 1-click token swaps, direct bank on/off ramps with confidential compliance receipts, and autonomous agent bots trading 24/7.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-3 shadow-sm hover:border-primary transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <RiShieldCheckLine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Portaldot 3.0 Coexistence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Dual execution via the Revive EVM module alongside native Substrate ink! contracts and the L2 Asset Engine for standardized physical asset tokenization.
            </p>
          </div>
        </div>
      </section>

      {/* WATERFALL CREDIT TRANCHES SPOTLIGHT */}
      <section className="p-8 sm:p-12 rounded-3xl border border-border bg-card/60 backdrop-blur-sm space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <p className="eyebrow">Capital Protection Architecture</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              Structured Waterfall Credit Facilities
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mt-2 leading-relaxed">
              Categorized by risk-adjusted return and waterfall liquidation priority. Subordinate equity tranches absorb initial defaults, shielding senior lenders.
            </p>
          </div>
          <Link
            href="/app/vaults"
            className="action-link px-6 py-3 self-start lg:self-auto font-bold"
          >
            <span>Explore Credit Vaults</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-background space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                AAA GRADE
              </span>
              <span className="text-xs font-mono text-muted-foreground">Priority 1</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Senior Protected Tranche</h3>
            <div className="text-3xl font-extrabold font-mono text-foreground">8.50% APY</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ultra-safe capital allocation backed by prime receivables and shielded by both Mezzanine and Junior loss-absorption buffers.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">
              Guaranteed Waterfall Liquidity
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-background space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                BBB GRADE
              </span>
              <span className="text-xs font-mono text-muted-foreground">Priority 2</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Mezzanine Trade Pool</h3>
            <div className="text-3xl font-extrabold font-mono text-foreground">14.20% APY</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Balanced risk-reward tranche. Absorbs secondary stress while capturing heightened yields from trade finance originations.
            </p>
            <div className="pt-2 text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
              Amortized Risk Restructuring
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-background space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                EQUITY
              </span>
              <span className="text-xs font-mono text-muted-foreground">Priority 3</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Junior First-Loss Pool</h3>
            <div className="text-3xl font-extrabold font-mono text-foreground">22.80% APY</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              First-loss absorption capital. Earns protocol performance fees and maximum liquidation premiums in exchange for underwriting system risk.
            </p>
            <div className="pt-2 text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">
              First-Loss High Yield
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="text-center py-16 px-6 rounded-3xl border border-border bg-card space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          Ready to Transact with Privacy and Solvency Guarantees?
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Connect your Portaldot extension or EVM wallet to explore confidential settlement, credit tranches, and RFQ solvers in the interactive workspace.
        </p>
        <div className="pt-2">
          <Link
            href="/app/overview"
            className="action-link px-8 py-4 text-base font-bold shadow-lg shadow-primary/20"
          >
            <span>Open Kudex Workspace</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
