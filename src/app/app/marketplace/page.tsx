import Link from 'next/link';
import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <div className="space-y-8">
      <FeatureUnavailable
        title="Swap & liquidity"
        description="Swaps and liquidity operations are unavailable. No verified AMM, wrapped gas token, or funded pool is configured. Prices, APR, TVL, and LP positions cannot be quoted."
        requirements={[
          'Verified token and AMM deployments on Portaldot V3',
          'Reserve-derived quotes, slippage limits, and transaction deadlines',
          'Signed execution, matching receipt events, and refreshed balances',
        ]}
      />
      <button className="action-link opacity-50" disabled>
        Swap unavailable
      </button>
      <Link className="quiet-link" href="/app/rfq">
        Advanced: signed RFQ offers
      </Link>
    </div>
  );
}
