# Avail Nexus SDK + Magic.link Integration Technical Guide

## Overview
This guide provides technical implementation details for integrating Avail Nexus SDK with Magic.link for email-based authentication in web applications.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Magic.link    │    │  Direct RPC      │    │  Avail Nexus     │
│   (Signing)     │    │  (Network)       │    │     SDK          │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • eth_sign      │    │ • eth_accounts   │    │ • initializeSdk │
│ • personal_sign │    │ • eth_chainId    │    │ • requestAddresses│
│ • sendTransaction│   │ • eth_call       │    │ • createWalletClient│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Problem Analysis

### 1. Magic.link RPC Limitations
```typescript
// ❌ This fails with "Failed to fetch" errors
const magicProvider = magic.rpcProvider;
await nexusSDK.initializeSdk(magicProvider);
```

**Error**: `Magic RPC Error: [-32603] Failed to fetch`

**Root Cause**: Magic.link RPC provider has network reliability issues for certain methods.

### 2. Provider Interface Requirements
```typescript
// ✅ Nexus SDK expects this interface
interface EthereumProvider {
  request(args: RequestArguments): Promise<unknown>;
  on(event: string, callback: Function): void;
  removeListener(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
  isConnected(): boolean;
  isMetaMask: boolean;
  isMagicLink: boolean;
}
```

## Solution Implementation

### 1. Direct RPC Provider
```typescript
export function createMagicDirectProvider(magic: any) {
  return {
    request: async (args: any) => {
      // For signing methods, use Magic.link
      if (args.method === 'eth_sendTransaction' || 
          args.method === 'eth_sign' || 
          args.method === 'personal_sign') {
        return await magic.rpcProvider.request(args);
      }
      
      // For network calls, use direct RPC
      const response = await fetch('https://sepolia.drpc.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: args.method,
          params: args.params || [],
          id: Math.floor(Math.random() * 1000000)
        })
      });
      
      const data = await response.json();
      return data.result;
    },
    
    // Standard Ethereum provider interface
    on: (event: string, callback: any) => { /* no-op */ },
    removeListener: (event: string, callback: any) => { /* no-op */ },
    emit: (event: string, ...args: any[]) => { /* no-op */ },
    
    // Required properties
    isConnected: () => true,
    isMetaMask: false,
    isMagicLink: true
  };
}
```

### 2. Integration with Nexus SDK
```typescript
import { useNexus } from '@avail-project/nexus-widgets';

function MagicWalletBridge() {
  const { setProvider, initializeSdk } = useNexus();
  const { magic, isLoggedIn } = useMagicWallet();
  
  useEffect(() => {
    if (isLoggedIn && magic) {
      const directProvider = createMagicDirectProvider(magic);
      setProvider(directProvider);
      initializeSdk(directProvider);
    }
  }, [isLoggedIn, magic]);
}
```

## Error Handling Patterns

### 1. RPC Method Routing
```typescript
request: async (args: any) => {
  const signingMethods = [
    'eth_sendTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4'
  ];
  
  if (signingMethods.includes(args.method)) {
    // Use Magic.link for signing
    return await magic.rpcProvider.request(args);
  } else {
    // Use direct RPC for network calls
    return await directRpcRequest(args);
  }
}
```

### 2. Address Array Handling
```typescript
// ✅ Ensure addresses always return arrays
async requestAddresses() {
  try {
    const accounts = await this.request({ method: 'eth_accounts' });
    return Array.isArray(accounts) ? accounts : [accounts];
  } catch (error) {
    return ['0x0000000000000000000000000000000000000000'];
  }
}
```

### 3. Error Logging
```typescript
request: async (args: any) => {
  try {
    console.log('[Magic] Provider request:', args.method);
    const result = await this.handleRequest(args);
    console.log('[Magic] Provider success:', args.method, result);
    return result;
  } catch (error) {
    console.error('[Magic] Provider error:', args.method, error);
    throw error;
  }
}
```

## Testing Strategy

### 1. Provider Validation
```typescript
// Test provider before SDK initialization
const testProvider = async (provider: any) => {
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    const chainId = await provider.request({ method: 'eth_chainId' });
    console.log('Provider test successful:', { accounts, chainId });
    return true;
  } catch (error) {
    console.error('Provider test failed:', error);
    return false;
  }
};
```

### 2. SDK Initialization Validation
```typescript
// Test SDK initialization
const testSDKInit = async (provider: any) => {
  try {
    await initializeSdk(provider);
    console.log('SDK initialization successful');
    return true;
  } catch (error) {
    console.error('SDK initialization failed:', error);
    return false;
  }
};
```

## Performance Considerations

### 1. RPC Endpoint Selection
```typescript
// Use reliable RPC endpoints
const RPC_ENDPOINTS = {
  sepolia: 'https://sepolia.drpc.org',
  mainnet: 'https://eth.drpc.org',
  arbitrum: 'https://arbitrum.drpc.org',
  optimism: 'https://optimism.drpc.org'
};
```

### 2. Error Recovery
```typescript
// Implement retry logic for network calls
const requestWithRetry = async (args: any, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.directRpcRequest(args);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Best Practices

### 1. Provider Lifecycle Management
```typescript
// Clean up providers on component unmount
useEffect(() => {
  return () => {
    if (provider) {
      provider.removeListener('accountsChanged', handleAccountsChanged);
    }
  };
}, [provider]);
```

### 2. Error Boundaries
```typescript
// Wrap SDK operations in error boundaries
const SafeNexusProvider = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div>SDK Error</div>}>
      <NexusProvider config={{ network: 'testnet' }}>
        {children}
      </NexusProvider>
    </ErrorBoundary>
  );
};
```

### 3. Type Safety
```typescript
// Define proper types for provider
interface MagicDirectProvider extends EthereumProvider {
  isMagicLink: true;
  isMetaMask: false;
  isConnected(): boolean;
}
```

## Troubleshooting Guide

### Common Issues

1. **"Failed to fetch" errors**
   - Solution: Use direct RPC for network calls
   - Check: RPC endpoint availability

2. **"addresses.map is not a function"**
   - Solution: Ensure address methods return arrays
   - Check: Provider implementation

3. **"false == true" errors**
   - Solution: Set all required boolean properties
   - Check: Provider interface compliance

4. **SDK initialization failures**
   - Solution: Test provider before SDK init
   - Check: Provider method implementations

## Conclusion

The Avail Nexus SDK + Magic.link integration requires:
1. **Proper provider interface implementation**
2. **Strategic RPC method routing**
3. **Comprehensive error handling**
4. **Type safety and validation**

This approach successfully bypasses Magic.link RPC limitations while maintaining email-based authentication for transaction signing.
