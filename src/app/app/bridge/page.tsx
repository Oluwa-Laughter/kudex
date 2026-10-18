import { FeatureUnavailable } from '@/components/dashboard/FeatureUnavailable';

export default function Page() {
  return (
    <FeatureUnavailable
      title={'Cross-chain transfers'}
      description={
        'Cross-chain transfers are not connected to a bridge provider on this deployment.'
      }
      requirements={[
        'Verified source and destination contracts.',
        'Real route quotes, fees and timeout or refund handling.',
        'Confirmation tracking on both networks.',
      ]}
    />
  );
}
