import { ProductStory, type ProductStoryProps } from '@/components/product/ProductStory';

const story = {
  eyebrow: 'RFQ trading',
  title: 'Review the quote. Know the trade.',
  description:
    'Kudex’s RFQ design connects a specific trading intent with a signed offer. The settlement contract exchanges both assets in one transaction.',
  status:
    'The workspace supports maker-signed offers, JSON export/import, allowance review, full fills, and cancellation after router deployment. A hosted orderbook and solver quote feed are not connected.',
  steps: [
    {
      title: 'Define your intent',
      text: 'Choose the token to offer and the exact quantity to receive. Sign those terms in your wallet and export the offer for a counterparty.',
    },
    {
      title: 'Review the complete offer',
      text: 'Check the maker, exact quantities, expiry, network, and router. A displayed price alone is not an executable order.',
    },
    {
      title: 'Settle and confirm',
      text: 'With the router deployed, the app checks both token balances and permissions. The taker approves payment separately, simulates the complete exchange, and waits for its settlement receipt.',
    },
  ],
  limitations: [
    'No live quotes or guaranteed prices are displayed.',
    'Atomic exchange does not guarantee protection from every form of MEV.',
    'Signatures are bound to the router and chain. Used nonces cannot be filled again.',
    'Test collateral carries no claim to dollars or real assets.',
  ],
} satisfies ProductStoryProps;

export default function Page() {
  return <ProductStory {...story} />;
}
