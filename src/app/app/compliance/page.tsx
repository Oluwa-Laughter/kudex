import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <FeatureUnavailable
      title="Selective disclosure"
      description="Viewing keys and confidential audit exports are unavailable. A locally generated key cannot disclose or authenticate blockchain records."
      requirements={[
        'A reviewed confidential protocol and disclosure scheme',
        'Authenticated auditor access and verifiable disclosures',
      ]}
    />
  );
}
