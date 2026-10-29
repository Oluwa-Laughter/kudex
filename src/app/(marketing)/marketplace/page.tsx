import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      eyebrow="Institutional RFQ markets"
      title="Negotiate commercial terms. Verify settlement."
      description="Request liquidity from a named counterparty, exchange signed exact terms and authorize atomic public settlement. Kudex is building toward private institutional negotiation and agent-native execution."
      status="Signed invitations and full-fill quote workflows are implemented. Activation requires reviewed deployments and funded signing accounts. Private delivery, counterparty qualification and confidential on-chain settlement remain development work."
      steps={[
        {
          title: 'Request liquidity',
          text: 'Sign a domain-bound invitation naming a solver, asset pair, expiry and exact receipt/payment bounds. Export locally through an access-controlled channel.',
        },
        {
          title: 'Review signed quotes',
          text: 'Validate the maker signature, assets, quantities, nonce and expiry. An invitation is not a spending permission; v1 signed offers can be filled by any holder.',
        },
        {
          title: 'Settle exact terms',
          text: 'Approve separately, simulate, sign and inspect matching receipt events and chain finality. Price terms are negotiated, not fabricated market data.',
        },
      ]}
      limitations={[
        'No hosted private inbox, qualified solver registry or continuous agent worker is active.',
        'Current token transfers, counterparties and settlement amounts are public.',
        'No zero-MEV, zero-slippage or confidentiality guarantee is implied.',
        'Credit instruments require verified issuers, legal rights and separate facility accounting.',
      ]}
    />
  );
}
