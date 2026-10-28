import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      {...{
        eyebrow: 'Roadmap \u00b7 bridge',
        title: 'Cross-chain settlement, with evidence at every step.',
        description:
          'Kudex plans to connect assets across networks. This testnet application has no bridge execution path.',
        status:
          'In development. No bridge routes, relays, fees, finality times, or settled transfers are being advertised.',
        steps: [
          {
            title: 'Verify both chains',
            text: 'A supported bridge must establish source and destination identity, supported assets, and message authenticity.',
          },
          {
            title: 'Reconcile finality',
            text: 'Source submission and destination arrival require independent receipts and a documented finality model.',
          },
        ],
        limitations: [
          'No active bridge deployment has been verified.',
          'Confidential settlement is disabled.',
        ],
      }}
    />
  );
}
