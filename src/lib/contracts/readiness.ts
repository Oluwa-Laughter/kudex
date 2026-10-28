import { zeroAddress, type Address, type PublicClient } from 'viem';
import { isNetworkConfigured, portaldotTestnet } from '../chains/portaldot.ts';

export async function assertDeployment(
  client: PublicClient,
  addresses: readonly Address[],
) {
  if (!isNetworkConfigured)
    throw new Error(
      'Portaldot testnet configuration is incomplete. Confirm the RPC, chain ID and gas decimals with the network team.',
    );
  if (addresses.some((address) => address === zeroAddress))
    throw new Error(
      'Contract deployment is not configured. No transaction was submitted.',
    );
  if ((await client.getChainId()) !== portaldotTestnet.id)
    throw new Error('The RPC chain ID does not match the configured Portaldot testnet.');
  const codes = await Promise.all(
    addresses.map((address) => client.getBytecode({ address })),
  );
  if (codes.some((code) => !code || code === '0x'))
    throw new Error(
      'A configured contract has no bytecode on this network. Verify the deployment addresses.',
    );
}
