'use client';
import { useQuery } from '@tanstack/react-query';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
export interface NativeObservation {
  address: string;
  contractAddress: `0x${string}`;
  nativeFreeTPOT: string;
  nativeFrozenTPOT: string;
  nativeSpendableUpperBoundTPOT: string;
  finalizedBlock: string;
  finalizedHash: string;
  observedAt: string;
}

export interface EvmObservation {
  address: `0x${string}`;
  nativeFundingAddress?: string;
  nativeFreeTPOT?: string;
  gasTPOT: string;
  balanceBaseUnits: string;
  block: string;
  observedAt: string;
}

export function useNativeAccount() {
  const { selected } = useNativeWallet();
  return useQuery<NativeObservation>({
    queryKey: ['native-account', selected?.address],
    enabled: Boolean(selected),
    staleTime: 15_000,
    gcTime: 120_000,
    refetchInterval: 60_000,
    retry: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/portaldot/account?address=${encodeURIComponent(selected!.address)}`,
        { signal },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The native account check failed.');
      return body;
    },
  });
}

export function useEvmMapping(address?: `0x${string}`) {
  return useQuery<EvmObservation>({
    queryKey: ['evm-account', address],
    enabled: Boolean(address),
    staleTime: 15_000,
    gcTime: 120_000,
    refetchInterval: 30_000,
    retry: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/portaldot/account?evm=${encodeURIComponent(address!)}`,
        { signal },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The EVM account check failed.');
      return body;
    },
  });
}
