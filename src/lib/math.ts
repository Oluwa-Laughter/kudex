import { parseUnits, formatUnits } from 'viem';

export const POT_DECIMALS = 14;
export const USDC_DECIMALS = 6;
export const STANDARD_DECIMALS = 18;

export function parsePOT(amount: string): bigint {
  return parseUnits(amount, POT_DECIMALS);
}

export function formatPOT(wei: bigint): string {
  return formatUnits(wei, POT_DECIMALS);
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  return parseUnits(amount, decimals);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

export function calculateBasisPoints(amount: bigint, bps: bigint): bigint {
  return (amount * bps) / BigInt(10000);
}

export function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  if (denominator === BigInt(0)) throw new Error('Division by zero');
  return (a * b) / denominator;
}

export function formatDisplayBalance(amount: bigint, decimals: number, maxDecimals: number = 4): string {
  const formatted = formatUnits(amount, decimals);
  const [whole, fraction] = formatted.split('.');
  if (!fraction) return whole;
  return `${whole}.${fraction.slice(0, maxDecimals)}`;
}
