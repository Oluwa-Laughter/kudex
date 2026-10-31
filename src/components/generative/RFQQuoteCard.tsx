import Link from 'next/link';
import { FiArrowRight, FiRepeat, FiShield } from 'react-icons/fi';

export interface RFQQuoteProps {
  quote?: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    estimatedReceive: string;
    hideInPrivateBalance?: boolean;
  };
}

// Plain-English swap preview card. Never turns AI text directly into unsigned wallet transactions.
export function RFQQuoteCard({ quote }: RFQQuoteProps) {
  const payLabel = quote ? `${quote.amountIn} ${quote.tokenIn}` : '500.00 USDC';
  const receiveLabel = quote
    ? `${quote.estimatedReceive} ${quote.tokenOut}`
    : '499.50 USDC (Stealth)';

  return (
    <div className="rounded-2xl border border-border bg-secondary p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FiRepeat className="text-accent" aria-hidden="true" />
          <span>Best-Price Auto-Routing Preview</span>
        </div>
        <span className="emerald-badge">Zero Price Slippage</span>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <dt className="text-sm text-muted-foreground">You Pay</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{payLabel}</dd>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <dt className="text-sm text-muted-foreground">Estimated Receive</dt>
          <dd className="mt-1 text-lg font-bold text-primary tabular-nums">
            {receiveLabel}
          </dd>
        </div>
      </dl>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Background bots compete to lock in the lowest fee before you approve in your
        wallet. Open Trade &amp; Bridge to verify exact terms and sign.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <FiShield aria-hidden="true" />
          <span>Can deliver directly to Private Balance</span>
        </span>
        <Link className="action-link text-sm" href="/app/trade">
          <span>Open Trade &amp; Bridge</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
