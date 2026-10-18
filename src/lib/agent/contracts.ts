import { isAddress, parseAbi, zeroAddress } from 'viem';
const configured = (value: string | undefined) =>
  value && isAddress(value) ? value : zeroAddress;
export const AGENT_EXECUTOR = configured(process.env.NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS);
export const POLICY_REGISTRY = configured(
  process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS,
);
export const executorAbi = parseAbi([
  'function registry() view returns(address)',
  'function createPolicy(address delegate,address vault,uint64 expiresAt,uint256 perActionCap,uint256 dailyCap,uint256 totalCap) returns(bytes32)',
  'function revokePolicy(bytes32 id)',
  'function execute(bytes32 id,uint256 assets) returns(uint256 shares)',
  'function policies(bytes32 id) view returns(address owner,address delegate,address vault,address asset,uint64 expiresAt,bool revoked,uint256 perActionCap,uint256 dailyCap,uint256 totalCap,uint256 spent,uint256 day,uint256 daySpent)',
  'event PolicyCreated(bytes32 indexed policyId,address indexed owner,address indexed delegate,address vault,uint64 expiresAt)',
  'event PolicyRevoked(bytes32 indexed policyId)',
  'event DepositExecuted(bytes32 indexed policyId,uint256 assets,uint256 shares)',
]);
export const registryAbi = parseAbi([
  'function approvedVaults(address) view returns(bool)',
  'function governor() view returns(address)',
]);
export const agentVaultAbi = parseAbi(['function asset() view returns(address)']);
