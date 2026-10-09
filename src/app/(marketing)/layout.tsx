'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import {
  FiArrowRight,
  FiChevronDown,
  FiLayers,
  FiShield,
  FiCpu,
  FiExternalLink,
  FiMenu,
  FiX,
  FiActivity,
  FiLock,
} from 'react-icons/fi';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const solutions = [
    {
      title: 'Enterprise Payroll',
      desc: 'Private global disbursements with zero mempool leakage',
      href: '/solutions/enterprise-payroll',
      icon: FiLock,
    },
    {
      title: 'Credit Tranches & DaaS',
      desc: 'Institutional yield pools with algorithmic debt restructuring',
      href: '/solutions/credit-tranches',
      icon: FiLayers,
    },
    {
      title: 'Autonomous Agents',
      desc: 'Solver-driven execution with bounded session spend caps',
      href: '/solutions/autonomous-agents',
      icon: FiCpu,
    },
  ];

  return (
    <div className="min-h-screen bg-[#06080D] text-neutral-100 flex flex-col selection:bg-[#00E599]/30 selection:text-white">
      {/* Top Banner Ribbon */}
      <div className="bg-[#0E121B] border-b border-[#21293D] py-2 px-4 text-center text-xs font-mono text-neutral-400">
        <span className="text-[#00E599] font-medium mr-2">CONFIDENTIAL SETTLEMENT</span>
        <span>Zero-leakage institutional settlement and autonomous RFQ liquidity</span>
        <Link
          href="/app/overview"
          className="ml-3 inline-flex items-center gap-1 text-[#00E599] hover:underline font-semibold"
        >
          <span>Launch Protocol</span>
          <FiArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#06080D]/85 border-b border-[#21293D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Logo size="md" />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300">
              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                <button
                  onClick={() => setSolutionsOpen(!solutionsOpen)}
                  className="flex items-center gap-1.5 hover:text-white transition py-2"
                >
                  <span>Solutions</span>
                  <FiChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      solutionsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {solutionsOpen && (
                  <div className="absolute top-full left-0 w-80 pt-2 z-50">
                    <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-2xl p-2.5 backdrop-blur-xl">
                      {solutions.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSolutionsOpen(false)}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#161C2B] transition group"
                          >
                            <div className="p-2 rounded-lg bg-[#161C2B] text-[#00E599] group-hover:bg-[#00E599]/15 transition border border-[#21293D]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-100 group-hover:text-[#00E599] transition">
                                {item.title}
                              </div>
                              <div className="text-xs text-neutral-400 leading-snug mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/marketplace"
                className={`hover:text-white transition ${
                  pathname === '/marketplace' ? 'text-[#00E599]' : ''
                }`}
              >
                Marketplace
              </Link>

              <Link
                href="/bridge"
                className={`hover:text-white transition ${
                  pathname === '/bridge' ? 'text-[#00E599]' : ''
                }`}
              >
                Bridge
              </Link>

              <Link
                href="/pricing"
                className={`hover:text-white transition ${
                  pathname === '/pricing' ? 'text-[#00E599]' : ''
                }`}
              >
                Pricing & Fees
              </Link>

              <Link
                href="/docs"
                className={`hover:text-white transition ${
                  pathname === '/docs' ? 'text-[#00E599]' : ''
                }`}
              >
                Documentation
              </Link>
            </nav>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-semibold text-sm transition shadow-lg shadow-[#00E599]/15 group"
            >
              <span>Launch App</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#0E121B] border border-[#21293D] text-neutral-300"
            >
              {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#21293D] bg-[#0E121B] px-4 pt-3 pb-6 space-y-3">
            <div className="text-xs font-mono uppercase text-neutral-400 px-3 pt-2">Solutions</div>
            {solutions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-[#161C2B]"
              >
                {item.title}
              </Link>
            ))}
            <div className="border-t border-[#21293D] my-2" />
            <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-[#161C2B]"
            >
              Marketplace
            </Link>
            <Link
              href="/bridge"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-[#161C2B]"
            >
              Bridge
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-[#161C2B]"
            >
              Pricing & Fees
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-200 hover:bg-[#161C2B]"
            >
              Documentation
            </Link>
            <div className="pt-2">
              <Link
                href="/app/overview"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00E599] text-[#06080D] font-semibold text-sm"
              >
                <span>Launch App</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>

      {/* Institutional Corporate Footer */}
      <footer className="border-t border-[#21293D] bg-[#0E121B] mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Col 1: Brand & Status */}
            <div className="md:col-span-2 space-y-4">
              <Logo size="md" />
              <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
                Autonomous confidential settlement network and agent-native RFQ marketplace.
                Engineered for institutional privacy, fractionalized RWA yield, and automated debt solvency.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
                  <span>Network Operational</span>
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  Avg Latency: <span className="text-neutral-300 font-semibold">180ms</span>
                </div>
              </div>
            </div>

            {/* Col 2: Solutions */}
            <div>
              <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4 font-semibold">
                Solutions
              </h5>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>
                  <Link href="/solutions/enterprise-payroll" className="hover:text-white transition">
                    Enterprise Payroll
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/credit-tranches" className="hover:text-white transition">
                    Credit Tranches & DaaS
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/autonomous-agents" className="hover:text-white transition">
                    Autonomous Agents
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-white transition">
                    Tranche Discovery
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Platform */}
            <div>
              <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4 font-semibold">
                Platform
              </h5>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>
                  <Link href="/app/overview" className="hover:text-white transition">
                    Portfolio Workspace
                  </Link>
                </li>
                <li>
                  <Link href="/app/settlement" className="hover:text-white transition">
                    Shielded Transfers
                  </Link>
                </li>
                <li>
                  <Link href="/bridge" className="hover:text-white transition">
                    Cross-Chain Gateway
                  </Link>
                </li>
                <li>
                  <Link href="/app/compliance" className="hover:text-white transition">
                    Audit & Viewing Keys
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    Protocol Fee Schedule
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Resources */}
            <div>
              <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-4 font-semibold">
                Resources
              </h5>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>
                  <Link href="/docs" className="hover:text-white transition">
                    Technical Specs
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition">
                    SDK Reference
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/Oluwa-Laughter/kudex"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition inline-flex items-center gap-1"
                  >
                    <span>GitHub Repository</span>
                    <FiExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                  </a>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    Auditor SaaS
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#21293D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
            <div>
              © {new Date().getFullYear()} Kudex Protocol. Autonomous Confidential Settlement Layer.
            </div>
            <div className="flex items-center gap-6">
              <span>Cryptographically Enforced Invariants</span>
              <span>Zero Leakage Guarantees</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
