'use client';

import { useEffect, useState } from 'react';

// Create a simple provider that prioritizes Magic.link for most operations
export function createMagicSimpleProvider(magic: any) {
  if (!magic) return null;

  console.log('[Magic] Creating simple provider that prioritizes Magic.link...');

  const simpleProvider = {
    isMagic: true,
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    isSimple: true,
    
    // Get the current chain ID
    async getChainId() {
      try {
        const chainId = await magic.rpcProvider.request({ method: 'eth_chainId' });
        return parseInt(chainId, 16);
      } catch (error) {
        console.error('[Magic] Failed to get chain ID:', error);
        return 11155111; // Default to Ethereum Sepolia
      }
    },
    
    // Simple request method that uses Magic.link for everything
    async request(args: any) {
      console.log('[Magic] Simple provider request:', args);
      
      try {
        // Use Magic.link for all requests
        const result = await magic.rpcProvider.request(args);
        console.log('[Magic] Simple provider request successful:', result);
        return result;
      } catch (error) {
        console.error('[Magic] Simple provider request failed:', error);
        
        // If Magic.link fails, try to handle specific errors
        if (error.message && error.message.includes('Failed to fetch')) {
          console.log('[Magic] Magic.link RPC failed, trying alternative approach...');
          // Return a mock response for basic methods to prevent SDK initialization failure
          if (args.method === 'eth_chainId') {
            return '0xaa36a7'; // Ethereum Sepolia chain ID
          }
          if (args.method === 'eth_accounts') {
            return []; // Empty accounts array
          }
          if (args.method === 'net_version') {
            return '11155111'; // Ethereum Sepolia network version
          }
        }
        
        throw error;
      }
    },
    
    // Simple send method
    async send(method: string, params: any[]) {
      console.log('[Magic] Simple provider send:', method, params);
      return this.request({ method, params });
    },
    
    // Simple sendAsync method
    sendAsync(request: any, callback: any) {
      console.log('[Magic] Simple provider sendAsync:', request);
      this.request(request).then(result => {
        callback(null, { result });
      }).catch(error => {
        callback(error, null);
      });
    },
    
    // Event handling
    on(event: string, callback: any) {
      console.log('[Magic] Simple provider on:', event);
      if (magic.rpcProvider.on) {
        magic.rpcProvider.on(event, callback);
      }
    },
    
    removeListener(event: string, callback: any) {
      console.log('[Magic] Simple provider removeListener:', event);
      if (magic.rpcProvider.removeListener) {
        magic.rpcProvider.removeListener(event, callback);
      }
    },
    
    // Account management
    async requestAccounts() {
      console.log('[Magic] Simple provider requesting accounts...');
      try {
        const accounts = await this.request({ method: 'eth_accounts' });
        console.log('[Magic] Simple provider accounts:', accounts);
        return accounts;
      } catch (error) {
        console.error('[Magic] Simple provider failed to get accounts:', error);
        throw error;
      }
    },
    
    // Network detection
    async getNetwork() {
      console.log('[Magic] Simple provider getting network...');
      try {
        const chainId = await this.getChainId();
        console.log('[Magic] Simple provider chain ID:', chainId);
        return { chainId };
      } catch (error) {
        console.error('[Magic] Simple provider failed to get network:', error);
        throw error;
      }
    },
    
    // Add required properties for Nexus SDK
    selectedAddress: null,
    networkVersion: null,
    
    // Initialize the provider
    async initialize() {
      try {
        console.log('[Magic] Initializing simple provider...');
        const accounts = await this.requestAccounts();
        const network = await this.getNetwork();
        
        this.selectedAddress = accounts[0] || null;
        this.networkVersion = network.chainId.toString();
        
        console.log('[Magic] Simple provider initialized:', {
          selectedAddress: this.selectedAddress,
          networkVersion: this.networkVersion,
          chainId: network.chainId
        });
      } catch (error) {
        console.error('[Magic] Simple provider initialization failed:', error);
        throw error;
      }
    }
  };

  console.log('[Magic] Simple provider created');
  return simpleProvider;
}

// Hook to use the simple provider
export function useMagicSimpleProvider() {
  const [provider, setProvider] = useState<any>(null);
  
  const createProvider = (magic: any) => {
    const newProvider = createMagicSimpleProvider(magic);
    if (newProvider) {
      newProvider.initialize().then(() => {
        setProvider(newProvider);
      }).catch((error) => {
        console.error('[Magic] Failed to initialize simple provider:', error);
      });
    }
    return newProvider;
  };
  
  return { provider, createProvider };
}
