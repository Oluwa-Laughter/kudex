import { ProductStory, type ProductStoryProps } from '@/components/product/ProductStory';

const story = {
  eyebrow: 'Bounded agents',
  title: 'Give an agent a task. Keep the boundaries.',
  description:
    'Start with a deposit-only policy. Choose the delegate, vault, amount limits, and expiry before granting on-chain authorization.',
  status:
    'The policy builder prepares a draft. On-chain executor deployment and a funded worker are required for automated deposits; saving a draft activates nothing.',
  steps: [
    {
      title: 'Define the permitted action',
      text: 'The first executor supports deposits into an approved vault. Shares always return to the policy owner. Arbitrary calls and withdrawals are outside its authority.',
    },
    {
      title: 'Set limits and review',
      text: 'Choose a per-deposit cap, a UTC-day cap, a total budget, and an expiry. All caps are enforced by the executor after authorization.',
    },
    {
      title: 'Authorize, observe, revoke',
      text: 'The owner must create the policy on-chain and approve collateral to the executor. A delegate then submits transactions within those bounds. Revocation stops later executions.',
    },
  ],
  limitations: [
    'Draft policies do not create an allowance or an on-chain policy.',
    'The optional Gemini assistant can inspect live state. Continuous autonomous execution still requires a separately operated worker.',
    'A registry upgrade has governance risk; the proposed delay gives users time to review changes.',
    'Keep token allowances bounded and revoke both policy and allowance when finished.',
  ],
} satisfies ProductStoryProps;

export default function Page() {
  return <ProductStory {...story} />;
}
