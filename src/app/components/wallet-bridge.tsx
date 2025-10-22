'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';

export function WalletBridge() {
  const { connector, isConnected } = useAccount();
  const { setProvider, initializeSdk, isSdkInitialized } = useNexus();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeNexus = async () => {
      if (isConnected && connector?.getProvider && !isSdkInitialized && !isInitializing) {
        try {
          setIsInitializing(true);
          console.log('Getting wallet provider...');
          const provider = await connector.getProvider();
          console.log('Provider obtained:', provider);
          
          console.log('Setting provider...');
          setProvider(provider as any);
          
          // Small delay to ensure provider is set
          await new Promise(resolve => setTimeout(resolve, 100));
        
          console.log('Initializing SDK...');
          await initializeSdk(provider as any);
          
          console.log('Nexus SDK initialized successfully');
        } catch (error: any) {
          console.error('Failed to initialize Nexus SDK:', error);
          console.error('Error details:', {
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
  }, [isConnected, connector, isSdkInitialized, setProvider, initializeSdk, isInitializing]);

  if (isInitializing) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50">
        Initializing Nexus SDK...
      </div>
    );
  }

  if (isSdkInitialized) {
    return (
      <div className="fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50">
        Nexus SDK Ready ✓
      </div>
    );
  }

  return null;
}
