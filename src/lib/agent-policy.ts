import { getAddress, isAddress, parseUnits, zeroAddress } from 'viem';

export interface AgentPolicyInput {
  owner: string;
  delegate: string;
  vault: string;
  asset: string;
  decimals: string;
  perAction: string;
  daily: string;
  total: string;
  hours: string;
}
export function prepareAgentPolicy(input: AgentPolicyInput, now = Date.now()) {
  const address = (value: string, label: string) => {
    if (!isAddress(value) || value.toLowerCase() === zeroAddress)
      throw new Error(`${label} must be a nonzero contract-facing 0x address.`);
    return getAddress(value);
  };
  const owner = address(input.owner, 'Owner');
  const delegate = address(input.delegate, 'Delegate');
  const vault = address(input.vault, 'Vault');
  const asset = address(input.asset, 'Collateral');
  if (owner === delegate) throw new Error('Choose a delegate distinct from the owner.');
  if (!/^\d+$/.test(input.decimals) || Number(input.decimals) > 36)
    throw new Error(
      'Token decimals must be a whole number from 0 to 36. Verify them on-chain before activation.',
    );
  const decimals = Number(input.decimals);
  const amount = (value: string) => {
    if (!/^\d+(\.\d+)?$/.test(value) || (value.split('.')[1]?.length ?? 0) > decimals)
      throw new Error(
        'Enter positive token amounts within the specified decimal precision.',
      );
    const parsed = parseUnits(value, decimals);
    if (parsed <= 0n || parsed >= 2n ** 256n)
      throw new Error('Amount must fit a positive uint256.');
    return parsed;
  };
  const perAction = amount(input.perAction),
    daily = amount(input.daily),
    total = amount(input.total);
  if (perAction > daily || daily > total)
    throw new Error(
      'The per-deposit cap must be at most the daily cap, and the daily cap at most the total budget.',
    );
  if (!/^\d+$/.test(input.hours) || Number(input.hours) < 1 || Number(input.hours) > 720)
    throw new Error('Choose an expiry between 1 and 720 whole hours.');
  return {
    schemaVersion: 1,
    status: 'draft-not-authorized',
    chainId: 420420777,
    action: 'vault-deposit-only',
    owner,
    delegate,
    vault,
    asset,
    decimals,
    limits: {
      perAction: perAction.toString(),
      daily: daily.toString(),
      total: total.toString(),
    },
    expiresAt: Math.floor(now / 1000) + Number(input.hours) * 3600,
    dailyWindow: 'UTC calendar day',
    requirements: [
      'Verify chain, executor code, registry approval, vault asset and decimals.',
      'Owner must authorize this policy on-chain and grant a bounded allowance.',
      'A separately funded delegate must submit and confirm execution transactions.',
    ],
  } as const;
}
