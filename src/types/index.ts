export interface VaultData {
  address: `0x${string}`;
  name: string;
  symbol: string;
  assetSymbol: string;
  assetAddress: `0x${string}`;
  decimals: number;
  totalAssets: bigint;
  riskScoreBps: bigint; // 0 to 10000
  isDefaulted: boolean;
  apyBps: number;
  shieldedNotesCount: number;
}

export interface RFQOrderRecord {
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenInSymbol: string;
  tokenOut: `0x${string}`;
  tokenOutSymbol: string;
  amountIn: bigint;
  amountOut: bigint;
  deadline: bigint;
  nonce: bigint;
  settled: boolean;
  cancelled: boolean;
}

export interface RFQQuotePayload {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  estimatedReceive: string;
  solver: string;
  estimatedGasPOT: string;
  routerAddress: `0x${string}`;
  maxSlippageBps: number;
}

export interface ShieldReceipt {
  commitment: `0x${string}`;
  nullifier: `0x${string}`;
  amount: bigint | string;
  tokenSymbol: string;
  vaultAddress: `0x${string}`;
  timestamp: number;
}

export interface DaaSVaultHealthInfo {
  vaultAddress: `0x${string}`;
  vaultName: string;
  collateralRatioBps: bigint;
  riskScoreBps: bigint;
  healthFactorBps: bigint;
  restructuringActive: boolean;
  totalRestructuredDebt: bigint;
}
