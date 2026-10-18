import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';
export default function Page() {
  return (
    <FeatureUnavailable
      title="Private settlement"
      description="Private transfers are part of the Kudex roadmap. The current public vault does not hide balances, send private payments or redeem private notes."
      requirements={[
        'A reviewed privacy circuit and generated verifier.',
        'A recoverable note wallet and proof generation.',
        'Confirmed on-chain transfer and redemption tests.',
      ]}
    />
  );
}
