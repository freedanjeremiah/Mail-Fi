'use client';

import { useEffect, useState } from 'react';

// Create a custom Web3 provider that bypasses Magic.link RPC limitations
export function createMagicCustomProvider(magic: any) {
  if (!magic) return null;

  console.log('[Magic] Creating custom provider that bypasses Magic RPC...');

  // Use direct RPC endpoints instead of Magic's RPC
  const rpcUrls = {
    '1': 'https://eth.drpc.org', // Ethereum mainnet
    '11155111': 'https://sepolia.drpc.org', // Ethereum Sepolia
    '42161': 'https://arbitrum.drpc.org', // Arbitrum
    '421614': 'https://sepolia-rollup.arbitrum.io/rpc', // Arbitrum Sepolia
    '10': 'https://optimism.drpc.org', // Optimism
    '11155420': 'https://sepolia.optimism.io', // Optimism Sepolia
    '8453': 'https://base.drpc.org', // Base
    '84532': 'https://sepolia.base.org', // Base Sepolia
    '137': 'https://polygon.drpc.org', // Polygon
    '80002': 'https://rpc-amoy.polygon.technology', // Polygon Amoy
  };

  const customProvider = {
    isMagic: true,
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    isCustom: true,
    
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
    
    // Get the current RPC URL based on chain ID
    async getRpcUrl() {
      const chainId = await this.getChainId();
      return rpcUrls[chainId.toString()] || rpcUrls['11155111'];
    },
    
    // Custom request method that uses direct RPC
    async request(args: any) {
      console.log('[Magic] Custom provider request:', args);
      
      try {
        // For account-related requests, use Magic
        if (args.method === 'eth_accounts' || args.method === 'eth_requestAccounts') {
          const result = await magic.rpcProvider.request(args);
          console.log('[Magic] Account request successful:', result);
          return result;
        }
        
        // For signing requests, use Magic
        if (args.method === 'eth_sign' || args.method === 'eth_signTransaction' || args.method === 'eth_sendTransaction') {
          const result = await magic.rpcProvider.request(args);
          console.log('[Magic] Signing request successful:', result);
          return result;
        }
        
        // For basic network info, use Magic first
        if (args.method === 'eth_chainId' || args.method === 'net_version' || args.method === 'eth_blockNumber') {
          try {
            const result = await magic.rpcProvider.request(args);
            console.log('[Magic] Basic network request successful:', result);
            return result;
          } catch (magicError) {
            console.log('[Magic] Magic RPC failed for basic request, trying direct RPC:', magicError);
            // Fall through to direct RPC
          }
        }
        
        // For methods that might not be supported by direct RPC, try Magic first
        const magicOnlyMethods = [
          'eth_getCode',
          'eth_getStorageAt',
          'eth_getTransactionCount',
          'eth_getBalance',
          'eth_call',
          'eth_estimateGas',
          'eth_getTransactionReceipt',
          'eth_getTransactionByHash',
          'eth_getBlockByNumber',
          'eth_getBlockByHash',
          'eth_getLogs',
          'eth_newFilter',
          'eth_getFilterChanges',
          'eth_uninstallFilter'
        ];
        
        if (magicOnlyMethods.includes(args.method)) {
          try {
            console.log('[Magic] Trying Magic RPC first for method:', args.method);
            const result = await magic.rpcProvider.request(args);
            console.log('[Magic] Magic RPC successful for method:', args.method, result);
            return result;
          } catch (magicError) {
            console.log('[Magic] Magic RPC failed for method:', args.method, magicError);
            // Fall through to direct RPC
          }
        }
        
        // For other requests, use direct RPC
        const rpcUrl = await this.getRpcUrl();
        console.log('[Magic] Using direct RPC:', rpcUrl, 'for method:', args.method);
        
        const requestBody = {
          jsonrpc: '2.0',
          method: args.method,
          params: args.params || [],
          id: Math.floor(Math.random() * 1000000), // Random ID to avoid conflicts
        };
        
        console.log('[Magic] RPC request body:', requestBody);
        
        try {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          console.log('[Magic] RPC response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Magic] RPC response error:', errorText);
            throw new Error(`RPC request failed: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('[Magic] RPC response data:', data);
          
          if (data.error) {
            console.error('[Magic] RPC error response:', data.error);
            throw new Error(`RPC error: ${data.error.message} (Code: ${data.error.code})`);
          }
          
          console.log('[Magic] Direct RPC request successful:', data.result);
          return data.result;
        } catch (rpcError) {
          console.error('[Magic] Direct RPC failed, falling back to Magic RPC:', rpcError);
          
          // Check if it's a "method not available" error
          if (rpcError.message.includes('method is not available') || rpcError.message.includes('-32601')) {
            console.log('[Magic] Method not available on direct RPC, trying Magic RPC...');
            try {
              const fallbackResult = await magic.rpcProvider.request(args);
              console.log('[Magic] Fallback to Magic RPC successful:', fallbackResult);
              return fallbackResult;
            } catch (fallbackError) {
              console.error('[Magic] Magic RPC also failed:', fallbackError);
              throw new Error(`Method ${args.method} not available on both RPC endpoints: ${fallbackError.message}`);
            }
          }
          
          // For other errors, try Magic RPC as fallback
          try {
            const fallbackResult = await magic.rpcProvider.request(args);
            console.log('[Magic] Fallback to Magic RPC successful:', fallbackResult);
            return fallbackResult;
          } catch (fallbackError) {
            console.error('[Magic] Both direct RPC and Magic RPC failed:', fallbackError);
            throw new Error(`Both direct RPC and Magic RPC failed: ${fallbackError.message}`);
          }
        }
        
      } catch (error) {
        console.error('[Magic] Custom provider request failed:', error);
        throw error;
      }
    },
    
    // Custom send method
    async send(method: string, params: any[]) {
      console.log('[Magic] Custom provider send:', method, params);
      return this.request({ method, params });
    },
    
    // Custom sendAsync method
    sendAsync(request: any, callback: any) {
      console.log('[Magic] Custom provider sendAsync:', request);
      this.request(request).then(result => {
        callback(null, { result });
      }).catch(error => {
        callback(error, null);
      });
    },
    
    // Event handling
    on(event: string, callback: any) {
      console.log('[Magic] Custom provider on:', event);
      if (magic.rpcProvider.on) {
        magic.rpcProvider.on(event, callback);
      }
    },
    
    removeListener(event: string, callback: any) {
      console.log('[Magic] Custom provider removeListener:', event);
      if (magic.rpcProvider.removeListener) {
        magic.rpcProvider.removeListener(event, callback);
      }
    },
    
    // Account management
    async requestAccounts() {
      console.log('[Magic] Custom provider requesting accounts...');
      try {
        const accounts = await this.request({ method: 'eth_accounts' });
        console.log('[Magic] Custom provider accounts:', accounts);
        return accounts;
      } catch (error) {
        console.error('[Magic] Custom provider failed to get accounts:', error);
        throw error;
      }
    },
    
    // Network detection
    async getNetwork() {
      console.log('[Magic] Custom provider getting network...');
      try {
        const chainId = await this.getChainId();
        console.log('[Magic] Custom provider chain ID:', chainId);
        return { chainId };
      } catch (error) {
        console.error('[Magic] Custom provider failed to get network:', error);
        throw error;
      }
    },
    
    // Add required properties for Nexus SDK
    selectedAddress: null,
    networkVersion: null,
    
    // Initialize the provider
    async initialize() {
      try {
        console.log('[Magic] Initializing custom provider...');
        const accounts = await this.requestAccounts();
        const network = await this.getNetwork();
        
        this.selectedAddress = accounts[0] || null;
        this.networkVersion = network.chainId.toString();
        
        console.log('[Magic] Custom provider initialized:', {
          selectedAddress: this.selectedAddress,
          networkVersion: this.networkVersion,
          chainId: network.chainId
        });
      } catch (error) {
        console.error('[Magic] Custom provider initialization failed:', error);
        throw error;
      }
    }
  };

  console.log('[Magic] Custom provider created');
  return customProvider;
}

// Hook to use the custom provider
export function useMagicCustomProvider() {
  const [provider, setProvider] = useState<any>(null);
  
  const createProvider = (magic: any) => {
    const newProvider = createMagicCustomProvider(magic);
    if (newProvider) {
      newProvider.initialize().then(() => {
        setProvider(newProvider);
      }).catch((error) => {
        console.error('[Magic] Failed to initialize custom provider:', error);
      });
    }
    return newProvider;
  };
  
  return { provider, createProvider };
}
