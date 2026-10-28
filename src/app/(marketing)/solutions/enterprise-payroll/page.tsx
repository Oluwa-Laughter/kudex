import { ProductStory } from '@/components/product/ProductStory';
export default function Page() {
  return (
    <ProductStory
      {...{
        eyebrow: 'Roadmap \u00b7 enterprise settlement',
        title: 'Enterprise settlement requires real privacy.',
        description:
          'Future payroll needs reviewed cryptography, recipient authorization, reconciliation and selective disclosure.',
        status:
          'Payroll and confidential transfers are unavailable. Public commitments do not hide token movements or account balances.',
        steps: [
          {
            title: 'Establish a privacy protocol',
            text: 'A reviewed circuit must bind membership, value conservation, nullifiers, output commitments and the execution domain.',
          },
          {
            title: 'Verify operational controls',
            text: 'Recipient access, spending authorization and disclosure must be tested before a payroll service can be enabled.',
          },
        ],
        limitations: [
          'The Groth16 verifier remains disabled.',
          'No private notes or authenticated viewing keys are issued.',
        ],
      }}
    />
  );
}
