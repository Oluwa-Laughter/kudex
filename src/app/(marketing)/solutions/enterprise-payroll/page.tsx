import { ProductStory, type ProductStoryProps } from '@/components/product/ProductStory';

const story = {
  eyebrow: 'Product direction · Enterprise settlement',
  title: 'A clearer record for every payment.',
  description:
    'Kudex aims to let teams prepare settlement instructions, review authorization, and track the confirmed outcome from one workspace.',
  status:
    'Enterprise payroll and confidential payments are planned workflows. They are not available in the current public vault release.',
  steps: [
    {
      title: 'Prepare the recipients',
      text: 'A future payment workflow will validate addresses, token quantities, and the total before authorization.',
    },
    {
      title: 'Choose the disclosure rules',
      text: 'Privacy requires a reviewed proof system and note lifecycle. Today’s public ERC-4626 deposits reveal balances and transfers.',
    },
    {
      title: 'Keep a verifiable receipt',
      text: 'Payment status must come from confirmed network events. Selective disclosure and audit exports need separate implementation.',
    },
  ],
  limitations: [
    'No payroll batches are executed here.',
    'Adding a commitment does not hide the sender, amount, or share balance.',
    'No compliance certification is implied.',
    'Use the public testnet vault to explore the current transaction flow.',
  ],
} satisfies ProductStoryProps;

export default function Page() {
  return <ProductStory {...story} />;
}
