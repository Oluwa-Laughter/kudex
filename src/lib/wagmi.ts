import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { portaldotTestnet } from './chains/portaldot';

export const wagmiConfig = createConfig({
  chains: [portaldotTestnet],
  connectors: [
    injected(),
    ...(typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
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
