'use client';

import { useEffect, useState } from 'react';

// Create a Web3-compatible provider wrapper for Magic.link
export function createMagicProviderWrapper(magicProvider: any) {
  if (!magicProvider) return null;

  console.log('[Magic] Creating provider wrapper for:', magicProvider);

  const wrapper = {
    ...magicProvider,
    isMagic: true,
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    
    // Enhanced request method with better error handling
    request: async (args: any) => {
      console.log('[Magic] Provider request:', args);
      try {
        const result = await magicProvider.request(args);
        console.log('[Magic] Request successful:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Request failed:', error);
        throw error;
      }
    },
    
    // Enhanced send method
    send: async (method: string, params: any[]) => {
      console.log('[Magic] Provider send:', method, params);
      try {
        const result = await magicProvider.send(method, params);
        console.log('[Magic] Send successful:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Send failed:', error);
        throw error;
      }
    },
    
    // Enhanced sendAsync method
    sendAsync: (request: any, callback: any) => {
      console.log('[Magic] Provider sendAsync:', request);
      try {
        magicProvider.sendAsync(request, (error: any, result: any) => {
          if (error) {
            console.error('[Magic] SendAsync error:', error);
          } else {
            console.log('[Magic] SendAsync success:', result);
          }
          callback(error, result);
        });
      } catch (error) {
        console.error('[Magic] SendAsync failed:', error);
        callback(error, null);
      }
    },
    
    // Event handling
    on: (event: string, callback: any) => {
      console.log('[Magic] Provider on:', event);
      if (magicProvider.on) {
        magicProvider.on(event, callback);
      }
    },
    
    removeListener: (event: string, callback: any) => {
      console.log('[Magic] Provider removeListener:', event);
      if (magicProvider.removeListener) {
        magicProvider.removeListener(event, callback);
      }
    },
    
    // Add chain switching capability
    requestAccounts: async () => {
      console.log('[Magic] Requesting accounts...');
      try {
        const accounts = await magicProvider.request({ method: 'eth_accounts' });
        console.log('[Magic] Accounts:', accounts);
        return accounts;
      } catch (error) {
        console.error('[Magic] Failed to get accounts:', error);
        throw error;
      }
    },
    
    // Add network detection
    getNetwork: async () => {
      console.log('[Magic] Getting network...');
      try {
        const chainId = await magicProvider.request({ method: 'eth_chainId' });
        console.log('[Magic] Chain ID:', chainId);
        return { chainId: parseInt(chainId, 16) };
      } catch (error) {
        console.error('[Magic] Failed to get network:', error);
        throw error;
      }
    }
  };

  console.log('[Magic] Provider wrapper created:', wrapper);
  return wrapper;
}

// Hook to use the Magic provider wrapper
export function useMagicProviderWrapper() {
  const [wrapper, setWrapper] = useState<any>(null);
  
  const createWrapper = (magicProvider: any) => {
    const newWrapper = createMagicProviderWrapper(magicProvider);
    setWrapper(newWrapper);
    return newWrapper;
  };
  
  return { wrapper, createWrapper };
}
