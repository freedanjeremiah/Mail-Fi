'use client';

import { useEffect, useState } from 'react';
import { useMagicWallet } from './magic-wallet-provider-simple';
import { useNexus } from '@avail-project/nexus-widgets';
import { createMagicDirectProvider } from './magic-direct-provider';

export function MagicWalletBridge() {
  const { isLoggedIn, getProvider, user, magic } = useMagicWallet();
  const { setProvider, initializeSdk, isSdkInitialized } = useNexus();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeNexus = async () => {
      if (isLoggedIn && getProvider && !isSdkInitialized && !isInitializing) {
        try {
          setIsInitializing(true);
          console.log('[Magic] Creating direct RPC provider that bypasses Magic.link RPC...');
          
          // Use direct provider that bypasses Magic.link RPC for network calls
          const directProvider = createMagicDirectProvider(magic);
          if (!directProvider) {
            console.error('[Magic] Failed to create direct provider');
            return;
          }
          
          console.log('[Magic] Direct provider created');
          
          console.log('[Magic] Setting direct provider...');
          setProvider(directProvider);
          
          // Wait a bit for provider to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('[Magic] Initializing SDK with direct provider...');
          console.log('[Magic] Direct provider details:', {
            isConnected: directProvider.isConnected(),
            hasRequest: typeof directProvider.request === 'function',
            hasSend: typeof directProvider.send === 'function',
            hasOn: typeof directProvider.on === 'function'
          });
          
          // Test the direct provider first
          try {
            console.log('[Magic] Testing direct provider with eth_accounts...');
            const accounts = await directProvider.request({ method: 'eth_accounts' });
            console.log('[Magic] Direct provider test successful, accounts:', accounts);
          } catch (testError) {
            console.error('[Magic] Direct provider test failed:', testError);
            throw new Error('Direct provider test failed: ' + testError.message);
          }
          
          await initializeSdk(directProvider);
          
          console.log('[Magic] Nexus SDK initialized successfully with direct provider');
        } catch (error) {
          console.error('[Magic] Failed to initialize Nexus SDK with direct provider:', error);
          console.error('[Magic] Error details:', {
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
  }, [isLoggedIn, getProvider, isSdkInitialized, setProvider, initializeSdk]);

  if (isInitializing) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg">
        Initializing Magic Wallet...
      </div>
    );
  }

  if (isSdkInitialized && isLoggedIn) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg">
        Magic Wallet Ready ✓
      </div>
    );
  }

  return null;
}
