'use client';

// Create a provider that bypasses Magic.link RPC for network calls but uses Magic for signing
export function createMagicDirectProvider(magic: any) {
  if (!magic) return null;

  console.log('[Magic] Creating direct RPC provider that bypasses Magic.link RPC...');

  // Use direct RPC endpoints instead of Magic.link RPC
  const directRpcUrl = 'https://sepolia.drpc.org';
  
  const directProvider = {
    // Standard Ethereum provider interface
    request: async (args: any) => {
      console.log('[Magic] Direct provider request:', args);
      
      // For signing methods, use Magic.link
      if (args.method === 'eth_sendTransaction' || 
          args.method === 'eth_sign' || 
          args.method === 'personal_sign' ||
          args.method === 'eth_signTypedData' ||
          args.method === 'eth_signTypedData_v4') {
        console.log('[Magic] Using Magic.link for signing method:', args.method);
        try {
          const result = await magic.rpcProvider.request(args);
          console.log('[Magic] Magic signing result:', result);
          return result;
        } catch (error) {
          console.error('[Magic] Magic signing failed:', error);
          throw error;
        }
      }
      
      // For all other methods, use direct RPC
      console.log('[Magic] Using direct RPC for method:', args.method);
      try {
        const response = await fetch(directRpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: args.method,
            params: args.params || [],
            id: Math.floor(Math.random() * 1000000)
          })
        });
        
        if (!response.ok) {
          throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(`RPC error: ${data.error.message}`);
        }
        
        console.log('[Magic] Direct RPC result:', data.result);
        return data.result;
      } catch (error) {
        console.error('[Magic] Direct RPC failed:', error);
        throw error;
      }
    },
    
    // Event emitter methods
    on: (event: string, callback: any) => {
      console.log('[Magic] Direct provider on:', event);
      // No-op for direct RPC
    },
    
    removeListener: (event: string, callback: any) => {
      console.log('[Magic] Direct provider removeListener:', event);
      // No-op for direct RPC
    },
    
    // Add event emitter methods
    emit: (event: string, ...args: any[]) => {
      console.log('[Magic] Direct provider emit:', event, args);
    },
    
    // Standard provider properties
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true,
    
    // Add required methods for viem compatibility
    async send(method: string, params: any[]) {
      console.log('[Magic] Direct provider send:', method, params);
      return this.request({ method, params });
    },
    
    async sendAsync(request: any, callback: any) {
      console.log('[Magic] Direct provider sendAsync:', request);
      this.request(request).then(result => {
        callback(null, { result });
      }).catch(error => {
        callback(error, null);
      });
    }
  };

  console.log('[Magic] Direct provider created');
  return directProvider;
}