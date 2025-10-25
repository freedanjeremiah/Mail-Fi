"use client";

import React from 'react';
import { BridgeButton, BridgeAndExecuteButton, TransferButton, TOKEN_METADATA, TOKEN_CONTRACT_ADDRESSES } from '@avail-project/nexus-widgets';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useNexus } from '@avail-project/nexus-widgets';


export function BridgeTest() {
  const { isConnected } = useAccount();
  const { isSdkInitialized, sdk } = useNexus();


  React.useEffect(() => {
    if (sdk && isSdkInitialized) {
      console.log('Available TOKEN_METADATA:', TOKEN_METADATA);
      console.log('Available TOKEN_CONTRACT_ADDRESSES:', TOKEN_CONTRACT_ADDRESSES);
      console.log('USDC on Arbitrum (42161):', (TOKEN_CONTRACT_ADDRESSES as any)['USDC']?.[42161]);
      console.log('ETH on Arbitrum (42161):', (TOKEN_CONTRACT_ADDRESSES as any)['ETH']?.[42161]);
      console.log('Available tokens:', Object.keys(TOKEN_METADATA));
    }
  }, [sdk, isSdkInitialized]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ConnectKitButton />
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">Nexus SDK</h1>

      <BridgeButton
        prefill={{
          chainId: 421614,
          token: 'USDC',
          amount: '1',
        }}
      >
        {({ onClick, isLoading }) => (
          <button
            onClick={onClick}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Bridging...' : 'Bridge 1 USDC to Arbitrum Sepolia'}
          </button>
        )}
      </BridgeButton>

      <TransferButton
        prefill={{
          chainId: 11155420,
          token: 'USDC',
          amount: '1',
          recipient: '0x0754241982730db1ecf4a2c5e7839c1467f13c5e',
        }}
      >
        {({ onClick, isLoading }) => (
          <button onClick={onClick} disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? 'Sending…' : 'Send 1 USDC'}
          </button>
        )}
      </TransferButton>

      <BridgeAndExecuteButton
        contractAddress="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"
        contractAbi={[
          {
            name: 'supply',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'asset', type: 'address' },
              { name: 'amount', type: 'uint256' },
              { name: 'onBehalfOf', type: 'address' },
              { name: 'referralCode', type: 'uint16' },
            ],
            outputs: [],
          },
        ] as const}
        functionName="supply"
        buildFunctionParams={(token, amount, chainId, userAddress) => {
          const decimals = (TOKEN_METADATA as any)[token].decimals;
          const amountWei = parseUnits(amount, decimals);
          const tokenAddress = (TOKEN_CONTRACT_ADDRESSES as any)[token][chainId];
          return {
            functionParams: [tokenAddress, amountWei, userAddress, 0],
          };
        }}
        prefill={{ toChainId: 421614, token: 'USDC' }}
      >
        {({ onClick, isLoading, disabled }) => (
          <button onClick={onClick} disabled={isLoading || disabled}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isLoading ? 'Processing…' : 'Bridge & Supply to Aave'}
          </button>
        )}
      </BridgeAndExecuteButton>
    </div>
  );
}
