import { ProductStory, type ProductStoryProps } from '@/components/product/ProductStory';

const story = {
  eyebrow: 'Network access',
  title: 'Get connected before moving assets.',
  description:
    'Kudex runs against the Portaldot V3 testnet. Native wallet funding and EVM-compatible contract interaction are related, but require the appropriate signing path.',
  status:
    'A cross-chain bridge is not integrated. The native-to-contract account mapping is not a cross-chain bridge.',
  steps: [
    {
      title: 'Receive native test tokens',
      text: 'Use the registered native Portaldot address beginning with 5 for the organizer’s token distribution.',
    },
    {
      title: 'Verify the account mapping',
      text: 'Portaldot’s runtime maps native accounts to contract-facing addresses. A mapped 0x address does not give an Ethereum wallet the signing key.',
    },
    {
      title: 'Choose a supported signing path',
      text: 'The current vault interface uses an EVM wallet. Native extension deployment preparation is available in the repository; native signing in the app remains pending.',
    },
  ],
  limitations: [
    'Do not import a native recovery phrase into an EVM wallet to guess the mapping.',
    'Do not send mainnet assets to testnet addresses.',
    'A wallet connection does not confirm funding or contract availability.',
    'Only use verified funding and account mapping instructions.',
  ],
} satisfies ProductStoryProps;

export default function Page() {
  return <ProductStory {...story} />;
}
