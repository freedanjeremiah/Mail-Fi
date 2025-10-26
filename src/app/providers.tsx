"use client";

import './polyfills';
import React, { Suspense } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, arbitrum, arbitrumSepolia, optimism, optimismSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig } from 'connectkit';
import { HybridWalletProvider } from './components/hybrid-wallet-provider';

// Lazy-load NexusProvider to avoid server-side module evaluation of
// `@avail-project/nexus-widgets` (it references browser-only APIs). This
// ensures Next.js won't crash during SSR or config-time evaluation.
const NexusProvider = React.lazy(async () => {
  const mod = await import('@avail-project/nexus-widgets');
  return { default: mod.NexusProvider };
});

// Custom chain definitions for chains not available in wagmi/chains
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
    public: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
} as const;

const polygonAmoy = {
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
    public: { http: ['https://rpc-amoy.polygon.technology'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
  testnet: true,
} as const;

const polygon = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://polygon.llamarpc.com'] },
    public: { http: ['https://polygon.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
  },
} as const;

const avalanche = {
  id: 43114,
  name: 'Avalanche',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://avalanche.llamarpc.com'] },
    public: { http: ['https://avalanche.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
} as const;

const bsc = {
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc.llamarpc.com'] },
    public: { http: ['https://bsc.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
} as const;

const config = createConfig(
  getDefaultConfig({
    chains: [
      // Testnet chains
      sepolia, 
      arbitrumSepolia, 
      optimismSepolia,
      baseSepolia,
      polygonAmoy,
      // Mainnet chains
      mainnet,
      arbitrum,
      optimism,
      base,
      polygon,
      avalanche,
      bsc
    ],
    transports: {
      // Testnet
      [sepolia.id]: http(),
      [arbitrumSepolia.id]: http(),
      [optimismSepolia.id]: http(),
      [baseSepolia.id]: http(),
      [polygonAmoy.id]: http(),
      // Mainnet
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [base.id]: http(),
      [polygon.id]: http(),
      [avalanche.id]: http(),
      [bsc.id]: http(),
    },
    walletConnectProjectId: '7a6e6a1f7934519391a590f1b17504df',
    appName: 'Mail-Fi',
  })
);

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
        <HybridWalletProvider>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<>{children}</>}>
            {children}
          </Suspense>
        </QueryClientProvider>
      </WagmiProvider>
        </HybridWalletProvider>
  );
}
