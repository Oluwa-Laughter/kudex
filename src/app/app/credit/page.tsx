import Link from 'next/link';
import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <div className="space-y-8">
      <FeatureUnavailable
        title="Credit & RWA"
        description="No verified issuer or investable credit facility is configured. An ERC-4626 custody position is not a debt claim, underwritten credit or principal protection."
        requirements={[
          'Verified issuers, legal claims and investor eligibility',
          'Facility accounting, repayment schedules and default/recovery rules',
          'Reviewed deployment and actual servicing evidence',
        ]}
      />
      <Link href="/app/vaults" className="action-link">
        Open public custody vault
      </Link>
    </div>
  );
}
