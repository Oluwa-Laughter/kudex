import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <FeatureUnavailable
      title="Cross-chain bridge"
      description="Bridging is unavailable. No transfer, relay, or confidential settlement is implemented."
      requirements={[
        'A reviewed bridge deployment and supported asset registry',
        'Verified source and destination finality with message reconciliation',
      ]}
    />
  );
}
