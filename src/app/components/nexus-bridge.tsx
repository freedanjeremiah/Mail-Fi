'use client';

import React from 'react';
import { BridgeButton, TransferButton, TOKEN_METADATA, TOKEN_CONTRACT_ADDRESSES } from '@avail-project/nexus-widgets';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';

export function NexusBridge() {
  const { isConnected } = useAccount();
  const { isSdkInitialized, sdk } = useNexus();

  React.useEffect(() => {
    if (sdk && isSdkInitialized) {
      console.log('Available TOKEN_METADATA:', TOKEN_METADATA);
      console.log('Available TOKEN_CONTRACT_ADDRESSES:', TOKEN_CONTRACT_ADDRESSES);
      console.log('Available tokens:', Object.keys(TOKEN_METADATA));
    }
  }, [sdk, isSdkInitialized]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to use Nexus cross-chain features</p>
          <ConnectKitButton />
        </div>
      </div>
    );
  }

  if (!isSdkInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Nexus SDK...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we set up the cross-chain bridge</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Mail-Fi · Nexus Bridge</h1>
        <p className="text-gray-600">Cross-chain transfers powered by Avail</p>
        <div className="mt-4">
          <ConnectKitButton />
        </div>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-800">Transfer USDC</h3>
          <p className="text-sm text-gray-600 mb-4">Send 1 USDC on Optimism Sepolia</p>
          <TransferButton
            prefill={{
              chainId: 11155420, // Optimism Sepolia
              token: 'USDC',
              amount: '1',
            }}
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={onClick}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Send 1 USDC'}
              </button>
            )}
          </TransferButton>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-800">Bridge USDC</h3>
          <p className="text-sm text-gray-600 mb-4">Bridge 1 USDC to Arbitrum Sepolia</p>
          <BridgeButton
            prefill={{
              chainId: 421614, // Arbitrum Sepolia
              token: 'USDC',
              amount: '1',
            }}
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={onClick}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Bridging...' : 'Bridge 1 USDC'}
              </button>
            )}
          </BridgeButton>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4">
        <p>Testnet mode · Supported chains: Optimism Sepolia, Arbitrum Sepolia, Base Sepolia</p>
      </div>
    </div>
  );
}
