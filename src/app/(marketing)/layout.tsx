import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Navbar } from '@/components/navigation/Navbar';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-10 sm:px-8 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-screen-2xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Private, automated finance for modern businesses. Pay invoices, earn
              protected yield, and put routine payments on Auto-Pilot.
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Solutions</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/solutions/enterprise-payroll">
                  Business Pay & Payroll
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/solutions/credit-tranches">
                  Fixed-Yield Business Vaults
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/solutions/autonomous-agents">
                  Auto-Pilot Rules & Kudex Agent
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Resources</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/#how-it-works">
                  How It Works
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/pricing">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/docs">
                  Docs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Open App</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/app/overview">
                  Home
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/pay">
                  Send & Invoice
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/earn">
                  Earn Protected Yield
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/trade">
                  Trade & Bridge
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/agent">
                  Kudex Agent
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
