import { ProductStory, type ProductStoryProps } from '@/components/product/ProductStory';

const story = {
  eyebrow: 'Product direction · Structured credit',
  title: 'Make the risk visible before the return.',
  description:
    'Senior, mezzanine, and junior credit structures are a future Kudex workflow. The current public vault is an asset container, not an RWA investment offering.',
  status:
    'Credit tranches, asset origination, and repayment waterfalls are not implemented. The current vault does not promise yield or principal protection.',
  steps: [
    {
      title: 'Verify the underlying asset',
      text: 'Any future credit pool needs documented asset ownership, legal rights, valuation, and an accountable originator.',
    },
    {
      title: 'Review loss allocation',
      text: 'A tranche must define exactly how repayments and losses are allocated. A label such as senior does not remove credit risk.',
    },
    {
      title: 'Monitor and exit',
      text: 'Redemption rights, available liquidity, and recovery processes must be explicit. Current default controls can stop new vault deposits; they do not recover debt.',
    },
  ],
  limitations: [
    'No current token represents ownership of a real-world asset.',
    'No APY, repayment guarantee, or credit rating is published.',
    'Risk scores are administrative inputs, not independent risk assessments.',
    'Test tokens have no stated monetary value.',
  ],
} satisfies ProductStoryProps;

export default function Page() {
  return <ProductStory {...story} />;
}
