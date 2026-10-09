import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address?: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function getReadableErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';
  const str = String(error instanceof Error ? error.message : error);

  if (str.includes('User rejected') || str.includes('User denied') || str.includes('rejected the request')) {
    return 'Transaction rejected by user in wallet.';
  }
  if (str.includes('insufficient funds') || str.includes('exceeds balance')) {
    return 'Insufficient funds in wallet to cover asset amount or network gas.';
  }
  if (str.includes('reverted') || str.includes('execution reverted')) {
    const reasonMatch = str.match(/execution reverted:? ?([^\n]+)/i);
    if (reasonMatch && reasonMatch[1]) {
      return `Contract reverted: ${reasonMatch[1].trim()}`;
    }
    return 'Contract call reverted. Ensure contracts are deployed and account has approval.';
  }
  if (str.includes('Contract not deployed') || str.includes('does not have bytecode') || str.includes('target address is not a contract')) {
    return 'Target contract is not yet deployed on this network. Awaiting contract deployment.';
  }
  if (str.includes('Failed to fetch') || str.includes('NetworkError') || str.includes('fetch failed')) {
    return 'Network RPC connection error. Please verify Portaldot RPC connectivity.';
  }

  // Shorten overly verbose viem stack messages
  const firstLine = str.split('\n')[0];
  return firstLine.length > 140 ? `${firstLine.substring(0, 140)}...` : firstLine;
}
