'use client';

import { useEffect, useState } from 'react';
import { useHybridWallet } from './hybrid-wallet-provider';
import { useNexus } from '@avail-project/nexus-widgets';

export function HybridWalletBridge() {
  const { 
    isLoggedIn, 
    isMetaMaskConnected, 
    metaMaskProvider, 
    metaMaskAddress 
  } = useHybridWallet();
  
  const { setProvider, initializeSdk, isSdkInitialized } = useNexus();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeNexus = async () => {
      // Only initialize if both Magic.link is logged in AND MetaMask is connected
      if (isLoggedIn && isMetaMaskConnected && metaMaskProvider && !isSdkInitialized && !isInitializing) {
        try {
          setIsInitializing(true);
          console.log('[Hybrid] Initializing Nexus SDK with MetaMask provider...');
          console.log('[Hybrid] Magic.link logged in:', isLoggedIn);
          console.log('[Hybrid] MetaMask connected:', isMetaMaskConnected);
          console.log('[Hybrid] MetaMask address:', metaMaskAddress);
          
          // Use MetaMask provider for Nexus SDK
          setProvider(metaMaskProvider);
          
          // Wait a bit for provider to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('[Hybrid] Testing MetaMask provider...');
          const accounts = await metaMaskProvider.request({ method: 'eth_accounts' });
          const chainId = await metaMaskProvider.request({ method: 'eth_chainId' });
          console.log('[Hybrid] MetaMask provider test successful:', { accounts, chainId });
          
          await initializeSdk(metaMaskProvider);
          
          console.log('[Hybrid] Nexus SDK initialized successfully with MetaMask provider');
        } catch (error) {
          console.error('[Hybrid] Failed to initialize Nexus SDK with MetaMask provider:', error);
          console.error('[Hybrid] Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeNexus();
  }, [isLoggedIn, isMetaMaskConnected, metaMaskProvider, isSdkInitialized, setProvider, initializeSdk, metaMaskAddress]);

  if (isInitializing) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg">
        Initializing Hybrid Wallet...
      </div>
    );
  }

  if (isSdkInitialized && isLoggedIn && isMetaMaskConnected) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg">
        Hybrid Wallet Ready ✓<br/>
        <small>Magic: {isLoggedIn ? '✓' : '✗'} | MetaMask: {isMetaMaskConnected ? '✓' : '✗'}</small>
      </div>
    );
  }

  return null;
}
