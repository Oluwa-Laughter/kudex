import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <FeatureUnavailable
      title="Confidential settlement"
      description="Confidential transfers are disabled. Public ERC-4626 deposits and commitments do not provide privacy."
      requirements={[
        'A reviewed note circuit with membership and value conservation',
        'A valid verifier, nullifier rules, and domain-separated proofs',
      ]}
    />
  );
}
