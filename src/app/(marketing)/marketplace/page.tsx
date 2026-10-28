import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      {...{
        eyebrow: 'DeFi trading',
        title: 'Trading grounded in verifiable liquidity.',
        description:
          'The AMM workspace awaits verified pool infrastructure. Signed RFQ contracts and the advanced offer workspace remain available for deployment-backed exchanges.',
        status:
          'AMM swaps and liquidity management are disabled. No fixed market prices, APR, pool balances, or protocol volumes are displayed.',
        steps: [
          {
            title: 'Discover verified pools',
            text: 'Token metadata, pool reserves, deployed bytecode and source provenance must be checked before quotes or signing are enabled.',
          },
          {
            title: 'Review exact terms',
            text: 'AMM execution requires reserve-derived quotes, allowances, minimum output, deadlines and matching receipt events. RFQ uses counterparty-signed exact exchange terms.',
          },
        ],
        limitations: [
          'No native gas token wrapping is assumed.',
          'RFQ offers are public, full-fill only, and require verified router deployment.',
        ],
      }}
    />
  );
}
