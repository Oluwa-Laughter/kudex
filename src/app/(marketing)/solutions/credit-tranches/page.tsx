import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      {...{
        eyebrow: 'Roadmap \u00b7 tokenized credit',
        title: 'A public vault first. Structured credit next.',
        description:
          'The ERC-4626 vault provides share accounting for public token custody. It does not create receivables, issuer rights, seniority, or yield.',
        status:
          'Credit facilities are not implemented. No APY, ratings, principal protection, or real-world collateral is being offered.',
        steps: [
          {
            title: 'Verify custody accounting',
            text: 'Approve collateral, simulate a bounded deposit, verify its receipt and read shares from chain. Redemption returns available collateral.',
          },
          {
            title: 'Build one credit facility',
            text: 'Future work needs registered issuers, repayment schedules, claims, defaults, loss waterfalls and legal review.',
          },
        ],
        limitations: [
          'Test collateral is unbacked and has no promised dollar value.',
          'An administrative risk score is not an oracle or solvency proof.',
        ],
      }}
    />
  );
}
