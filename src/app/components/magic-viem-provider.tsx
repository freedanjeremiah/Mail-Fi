'use client';

import { useEffect, useState } from 'react';

// Create a proper Ethereum provider that works with viem
export function createMagicViemProvider(magic: any) {
  if (!magic) return null;

  console.log('[Magic] Creating proper viem-compatible provider...');

  const viemProvider = {
    // Standard Ethereum provider interface
    request: async (args: any) => {
      console.log('[Magic] Viem provider request:', args);
      
      try {
        // Use Magic.link for all requests
        const result = await magic.rpcProvider.request(args);
        console.log('[Magic] Viem provider result:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Viem provider request failed:', error);
        throw error;
      }
    },
    
    // Event emitter methods
    on: (event: string, callback: any) => {
      console.log('[Magic] Viem provider on:', event);
      if (magic.rpcProvider.on) {
        magic.rpcProvider.on(event, callback);
      }
    },
    
    removeListener: (event: string, callback: any) => {
      console.log('[Magic] Viem provider removeListener:', event);
      if (magic.rpcProvider.removeListener) {
        magic.rpcProvider.removeListener(event, callback);
      }
    },
    
    // Add event emitter methods
    emit: (event: string, ...args: any[]) => {
      console.log('[Magic] Viem provider emit:', event, args);
    },
    
    // Standard provider properties
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    
    // Add required methods for viem compatibility
    async send(method: string, params: any[]) {
      console.log('[Magic] Viem provider send:', method, params);
      return this.request({ method, params });
    },
    
    async sendAsync(request: any, callback: any) {
      console.log('[Magic] Viem provider sendAsync:', request);
      this.request(request).then(result => {
        callback(null, { result });
      }).catch(error => {
        callback(error, null);
      });
    }
  };

  console.log('[Magic] Viem provider created');
  return viemProvider;
}

// Hook to use the viem provider
export function useMagicViemProvider() {
  const [provider, setProvider] = useState<any>(null);
  
  const createProvider = (magic: any) => {
    const newProvider = createMagicViemProvider(magic);
    setProvider(newProvider);
    return newProvider;
  };
  
  return { provider, createProvider };
}
