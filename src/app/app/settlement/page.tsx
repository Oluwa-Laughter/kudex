import Link from 'next/link';
import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <div className="space-y-8">
      <FeatureUnavailable
        title="Confidential settlement"
        description="Confidential transfers are disabled. Public ERC-4626 deposits and commitments do not provide privacy."
        requirements={[
          'A reviewed note circuit with membership and value conservation',
          'A valid verifier, nullifier rules, and domain-separated proofs',
        ]}
      />
      <Link className="action-link" href="/app/vaults">
        Public custody foundation
      </Link>
      <Link className="quiet-link" href="/app/marketplace">
        Negotiate an RFQ
      </Link>
    </div>
  );
}
