'use client';

import './polyfills';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, arbitrum, arbitrumSepolia, optimism, optimismSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { NexusProvider } from '@avail-project/nexus-widgets';

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, sepolia, base, arbitrum, arbitrumSepolia, optimism, optimismSepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [base.id]: http(),
      [arbitrum.id]: http(),
      [arbitrumSepolia.id]: http(),
      [optimism.id]: http(),
      [optimismSepolia.id]: http(),
    },
    walletConnectProjectId: '7a6e6a1f7934519391a590f1b17504df',
    appName: 'Mail-Fi',
  })
);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <NexusProvider
            config={{
              network: 'testnet',
              debug: true,
            }}
          >
            {children}
          </NexusProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
