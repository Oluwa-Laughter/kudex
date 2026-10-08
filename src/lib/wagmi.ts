import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { portaldotTestnet } from './chains/portaldot';

export const wagmiConfig = createConfig({
  chains: [portaldotTestnet],
  connectors: [
    injected(),
    ...(typeof window !== 'undefined'
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8b7c9e0d1f2a3b4c5d6e7f8a9b0c1d',
            showQrModal: false,
          }),
        ]
      : []),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [portaldotTestnet.id]: http(),
  },
  ssr: true,
});
