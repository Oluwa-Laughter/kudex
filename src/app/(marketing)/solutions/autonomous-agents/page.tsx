import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      {...{
        eyebrow: 'Bounded agents',
        title: 'Permissions enforced by contracts.',
        description:
          'The assistant can inspect observations and explain workflows. A separate deposit-only executor enforces owner, delegate, asset, vault, expiry and spending caps.',
        status:
          'Policy creation, revocation and single delegated deposits require verified deployments and wallet signatures. A durable automation service is not implemented.',
        steps: [
          {
            title: 'Draft and review',
            text: 'Local policy drafts grant no authority. Confirm owner, delegate, per-action cap, UTC daily cap, lifetime budget and expiry.',
          },
          {
            title: 'Authorize on-chain',
            text: 'The exact owner signs policy creation and a separate collateral allowance. Only the delegate can execute; shares go to the owner.',
          },
          {
            title: 'Revoke and reconcile',
            text: 'The owner can revoke a policy and separately remove token allowance. Execution requires receipts and updated on-chain spending.',
          },
        ],
        limitations: [
          'No arbitrage, autonomous profits, payroll or DCA swaps are supported.',
          'The AI assistant has no signing keys or custody.',
        ],
      }}
    />
  );
}
