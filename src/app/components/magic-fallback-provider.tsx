'use client';

import { useEffect, useState } from 'react';

// Alternative approach: Create a minimal Web3 provider that works with Nexus SDK
export function createMagicFallbackProvider(magic: any) {
  if (!magic) return null;

  console.log('[Magic] Creating fallback provider...');

  const fallbackProvider = {
    isMagic: true,
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    
    // Basic Web3 provider interface
    request: async (args: any) => {
      console.log('[Magic] Fallback provider request:', args);
      try {
        const result = await magic.rpcProvider.request(args);
        console.log('[Magic] Fallback request successful:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Fallback request failed:', error);
        throw error;
      }
    },
    
    send: async (method: string, params: any[]) => {
      console.log('[Magic] Fallback provider send:', method, params);
      try {
        const result = await magic.rpcProvider.send(method, params);
        console.log('[Magic] Fallback send successful:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Fallback send failed:', error);
        throw error;
      }
    },
    
    sendAsync: (request: any, callback: any) => {
      console.log('[Magic] Fallback provider sendAsync:', request);
      try {
        magic.rpcProvider.sendAsync(request, (error: any, result: any) => {
          if (error) {
            console.error('[Magic] Fallback sendAsync error:', error);
          } else {
            console.log('[Magic] Fallback sendAsync success:', result);
          }
          callback(error, result);
        });
      } catch (error) {
        console.error('[Magic] Fallback sendAsync failed:', error);
        callback(error, null);
      }
    },
    
    // Event handling
    on: (event: string, callback: any) => {
      console.log('[Magic] Fallback provider on:', event);
      if (magic.rpcProvider.on) {
        magic.rpcProvider.on(event, callback);
      }
    },
    
    removeListener: (event: string, callback: any) => {
      console.log('[Magic] Fallback provider removeListener:', event);
      if (magic.rpcProvider.removeListener) {
        magic.rpcProvider.removeListener(event, callback);
      }
    },
    
    // Chain switching
    requestAccounts: async () => {
      console.log('[Magic] Fallback requesting accounts...');
      try {
        const accounts = await magic.rpcProvider.request({ method: 'eth_accounts' });
        console.log('[Magic] Fallback accounts:', accounts);
        return accounts;
      } catch (error) {
        console.error('[Magic] Fallback failed to get accounts:', error);
        throw error;
      }
    },
    
    // Network detection
    getNetwork: async () => {
      console.log('[Magic] Fallback getting network...');
      try {
        const chainId = await magic.rpcProvider.request({ method: 'eth_chainId' });
        console.log('[Magic] Fallback chain ID:', chainId);
        return { chainId: parseInt(chainId, 16) };
      } catch (error) {
        console.error('[Magic] Fallback failed to get network:', error);
        throw error;
      }
    },
    
    // Add required properties for Nexus SDK
    selectedAddress: null,
    networkVersion: null,
    
    // Initialize these properties
    async initialize() {
      try {
        console.log('[Magic] Initializing fallback provider...');
        const accounts = await this.requestAccounts();
        const network = await this.getNetwork();
        
        this.selectedAddress = accounts[0] || null;
        this.networkVersion = network.chainId.toString();
        
        console.log('[Magic] Fallback provider initialized:', {
          selectedAddress: this.selectedAddress,
          networkVersion: this.networkVersion
        });
      } catch (error) {
        console.error('[Magic] Fallback provider initialization failed:', error);
        throw error;
      }
    }
  };

  console.log('[Magic] Fallback provider created');
  return fallbackProvider;
}

// Hook to use the fallback provider
export function useMagicFallbackProvider() {
  const [provider, setProvider] = useState<any>(null);
  
  const createProvider = (magic: any) => {
    const newProvider = createMagicFallbackProvider(magic);
    if (newProvider) {
      newProvider.initialize().then(() => {
        setProvider(newProvider);
      }).catch((error) => {
        console.error('[Magic] Failed to initialize fallback provider:', error);
      });
    }
    return newProvider;
  };
  
  return { provider, createProvider };
}
