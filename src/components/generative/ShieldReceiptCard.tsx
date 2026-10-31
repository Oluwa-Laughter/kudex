import Link from 'next/link';
import { FiArrowRight, FiLock, FiCheckCircle } from 'react-icons/fi';

export interface ShieldReceiptCardProps {
  amountLabel?: string;
  destinationLabel?: string;
}

export function ShieldReceiptCard({
  amountLabel = '500.00 USDC',
  destinationLabel = 'Private Balances (Stealth Mode)',
}: ShieldReceiptCardProps) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-secondary p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FiLock className="text-primary" aria-hidden="true" />
          <span>{destinationLabel}</span>
        </div>
        <span className="emerald-badge">
          <FiCheckCircle aria-hidden="true" />
          <span>Stealth Mode Ready</span>
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <span className="text-sm text-muted-foreground">Amount Prepared to Hide</span>
        <p className="mt-1 text-xl font-bold text-primary tabular-nums">{amountLabel}</p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Your wallet balance and payment amounts are hidden from the public. Only you and
        the person you pay can see the numbers.
      </p>

      <div className="flex flex-wrap gap-3">
        <Link className="action-link text-sm" href="/app/pay">
          <span>Send Private Payment</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
        <Link className="quiet-link text-sm" href="/app/earn">
          <span>Deposit &amp; Hide in Vault</span>
        </Link>
      </div>
    </div>
  );
}
