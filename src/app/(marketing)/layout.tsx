import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { FiArrowUpRight } from 'react-icons/fi';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-card p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-10 lg:px-16">
          <Logo size="sm" />
          <nav
            aria-label="Main navigation"
            className="order-3 flex w-full gap-6 overflow-x-auto text-sm font-medium sm:order-none sm:w-auto"
          >
            <Link className="py-3 hover:text-primary" href="/how-it-works">
              How it works
            </Link>
            <Link className="py-3 hover:text-primary" href="/marketplace">
              Trade
            </Link>
            <Link
              className="whitespace-nowrap py-3 hover:text-primary"
              href="/solutions/autonomous-agents"
            >
              Agents
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link className="action-link px-3 sm:px-5" href="/app/overview">
              Open app <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="mt-16 border-t border-border">
        <div className="mx-auto grid max-w-screen-2xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              A settlement workspace built on Portaldot. Start with the essentials. Know
              what you authorize.
            </p>
            <p className="mt-4 text-sm text-primary">
              Testnet development · No real funds
            </p>
          </div>
          <nav aria-label="Product">
            <p className="mb-3 font-semibold">Explore Kudex</p>
            <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
              <Link href="/app/vaults">Structured Credit Vaults</Link>
              <Link href="/app/marketplace">Instant Swaps & Fiat Ramps</Link>
              <Link href="/solutions/autonomous-agents">Autonomous Agents</Link>
            </div>
          </nav>
          <nav aria-label="Resources">
            <p className="mb-3 font-semibold">Get started</p>
            <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
              <Link href="/how-it-works">How It Works</Link>
              <Link href="/solutions/credit-tranches">Credit Tranches</Link>
              <Link href="/solutions/enterprise-payroll">Enterprise Payroll</Link>
              <Link href="/app/overview">Product Workspace</Link>
            </div>
          </nav>
        </div>
        <p className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
          Kudex · Confidential Settlement, Structured Waterfall Credit & Autonomous Agent Economy on Portaldot 3.0.
        </p>
      </footer>
    </div>
  );
}
