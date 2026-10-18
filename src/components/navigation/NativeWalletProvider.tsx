'use client';
import { createContext, useContext, useState } from 'react';
export interface NativeAccount {
  address: string;
  name?: string;
  source: string;
}
interface InjectedExtension {
  enable: (
    name: string,
  ) => Promise<{
    accounts: { get: () => Promise<{ address: string; name?: string }[]> };
  }>;
}
declare global {
  interface Window {
    injectedWeb3?: Record<string, InjectedExtension>;
  }
}
const Context = createContext<{
  accounts: NativeAccount[];
  selected: NativeAccount | null;
  pending: boolean;
  error: string;
  providers: string[];
  connect: (source?: string) => Promise<void>;
  select: (address: string) => void;
  disconnect: () => void;
} | null>(null);
export function NativeWalletProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<NativeAccount[]>([]);
  const [selected, setSelected] = useState<NativeAccount | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<string[]>([]);
  async function connect(source?: string) {
    setPending(true);
    setError('');
    try {
      const extensions = Object.entries(window.injectedWeb3 ?? {});
      if (!extensions.length)
        throw new Error(
          'No compatible native extension was detected. Unlock Portaldot extension, allow access to this site, then try again.',
        );
      setProviders(extensions.map(([name]) => name));
      const chosen = source
        ? extensions.find(([name]) => name === source)
        : (extensions.find(([name]) => /portaldot/i.test(name)) ??
          (extensions.length === 1 ? extensions[0] : undefined));
      if (!chosen) throw new Error('Choose which native extension to connect below.');
      const injected = await chosen[1].enable('Kudex');
      const available = (await injected.accounts.get()).map((account) => ({
        ...account,
        source: chosen[0],
      }));
      if (!available.length)
        throw new Error(
          'No accounts were shared. Approve account access in your native extension and try again.',
        );
      // Prefer the organizer's requested address format; no account conversion is guessed here.
      const native = Array.from(
        new Map(
          available
            .filter((account) => account.address.startsWith('5'))
            .map((account) => [account.address, account]),
        ).values(),
      );
      if (!native.length)
        throw new Error(
          'No native address beginning with 5 was shared. Check the selected network and address format in your extension.',
        );
      setAccounts(native);
      setSelected(native[0]);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not connect the native extension.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Context.Provider
      value={{
        accounts,
        selected,
        pending,
        error,
        providers,
        connect,
        select: (address) =>
          setSelected(accounts.find((account) => account.address === address) ?? null),
        disconnect: () => {
          setAccounts([]);
          setSelected(null);
          setError('');
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useNativeWallet() {
  const value = useContext(Context);
  if (!value) throw new Error('Native wallet provider missing.');
  return value;
}
