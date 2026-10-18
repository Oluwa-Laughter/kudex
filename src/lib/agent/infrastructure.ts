import { erc20Abi, parseAbi, zeroAddress, type PublicClient } from 'viem';
import {
  AGENT_EXECUTOR,
  POLICY_REGISTRY,
  agentVaultAbi,
  executorAbi,
  registryAbi,
} from './contracts';
import { assertDeployment } from '@/lib/contracts/readiness';
const timelockAbi = parseAbi(['function getMinDelay() view returns(uint256)']);
export async function checkAgentInfrastructure(
  client: PublicClient,
  vault: `0x${string}`,
  asset: `0x${string}`,
  decimals: number,
) {
  if (AGENT_EXECUTOR === zeroAddress || POLICY_REGISTRY === zeroAddress)
    throw new Error('Agent contracts have not been configured for this deployment.');
  await assertDeployment(client, [AGENT_EXECUTOR, POLICY_REGISTRY, vault, asset]);
  const [registry, approved, vaultAsset, actualDecimals, governor] = await Promise.all([
    client.readContract({
      address: AGENT_EXECUTOR,
      abi: executorAbi,
      functionName: 'registry',
    }),
    client.readContract({
      address: POLICY_REGISTRY,
      abi: registryAbi,
      functionName: 'approvedVaults',
      args: [vault],
    }),
    client.readContract({ address: vault, abi: agentVaultAbi, functionName: 'asset' }),
    client.readContract({ address: asset, abi: erc20Abi, functionName: 'decimals' }),
    client.readContract({
      address: POLICY_REGISTRY,
      abi: registryAbi,
      functionName: 'governor',
    }),
  ]);
  if (registry.toLowerCase() !== POLICY_REGISTRY.toLowerCase())
    throw new Error('The executor points to a different policy registry.');
  if (!approved) throw new Error('The vault is not approved by the policy registry.');
  if (vaultAsset.toLowerCase() !== asset.toLowerCase() || actualDecimals !== decimals)
    throw new Error('The collateral or token precision does not match the vault.');
  const delay = await client.readContract({
    address: governor,
    abi: timelockAbi,
    functionName: 'getMinDelay',
  });
  if (delay < 172800n)
    throw new Error(
      'The registry governance delay is below the two-day release requirement.',
    );
  return { delay: delay.toString(), governor };
}
