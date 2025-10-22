"use client";

import './polyfills';
import React, { Suspense } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, arbitrum, arbitrumSepolia, optimism, optimismSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

// Lazy-load NexusProvider to avoid server-side module evaluation of
// `@avail-project/nexus-widgets` (it references browser-only APIs). This
// ensures Next.js won't crash during SSR or config-time evaluation.
const NexusProvider = React.lazy(async () => {
  const mod = await import('@avail-project/nexus-widgets');
  return { default: mod.NexusProvider };
});

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
          <Suspense fallback={<>{children}</>}>
            <NexusProvider
              config={{
                network: 'testnet',
                debug: true,
              }}
            >
              {children}
            </NexusProvider>
          </Suspense>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
