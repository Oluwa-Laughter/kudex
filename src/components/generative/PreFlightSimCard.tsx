import Link from 'next/link';
import { FiArrowRight, FiShield, FiTrendingUp } from 'react-icons/fi';

export interface PreFlightSimCardProps {
  amountLabel?: string;
  vaultName?: string;
  protectionSummary?: string;
}

export function PreFlightSimCard({
  amountLabel = '$2,500.00 USDC',
  vaultName = 'Verified Business Invoice Pool',
  protectionSummary = 'Protected — Safety Reserve Active',
}: PreFlightSimCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-secondary p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FiTrendingUp className="text-primary" aria-hidden="true" />
          <span>Pre-Flight Safety Check</span>
        </div>
        <span className="emerald-badge">
          <FiShield aria-hidden="true" />
          <span>{protectionSummary}</span>
        </span>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <dt className="text-sm text-muted-foreground">Recommended Vault</dt>
          <dd className="mt-1 text-base font-bold text-foreground">{vaultName}</dd>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <dt className="text-sm text-muted-foreground">Planned Allocation</dt>
          <dd className="mt-1 text-lg font-bold text-primary tabular-nums">{amountLabel}</dd>
        </div>
      </dl>

      <p className="text-sm leading-relaxed text-muted-foreground">
        If a borrower fails to pay an invoice on time, Kudex automatically freezes the
        pool and recovers your funds from the safety reserve.
      </p>

      <div className="flex flex-wrap justify-end">
        <Link className="action-link text-sm" href="/app/earn">
          <span>Review Deposit in Earn</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
