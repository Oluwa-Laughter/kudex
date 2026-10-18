import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <FeatureUnavailable
      title="Audit access"
      description="Selective disclosure is not available. Random identifiers are not cryptographic viewing keys."
      requirements={[
        'A defined disclosure scheme for the privacy circuit.',
        'Encrypted exports scoped to the selected wallet.',
        'Auditor access expiry and a tested revocation model.',
      ]}
    />
  );
}
