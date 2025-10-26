'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface HybridWalletContextType {
  // Magic.link for identity
  magic: any;
  isLoggedIn: boolean;
  user: any;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  
  // MetaMask for transactions
  isMetaMaskConnected: boolean;
  metaMaskAddress: string | null;
  connectMetaMask: () => Promise<void>;
  disconnectMetaMask: () => void;
  metaMaskProvider: any;
}

const HybridWalletContext = createContext<HybridWalletContextType | undefined>(undefined);

export function useHybridWallet() {
  const context = useContext(HybridWalletContext);
  if (!context) {
    throw new Error('useHybridWallet must be used within a HybridWalletProvider');
  }
  return context;
}

interface HybridWalletProviderProps {
  children: React.ReactNode;
}

export function HybridWalletProvider({ children }: HybridWalletProviderProps) {
  // Magic.link state
  const [magic, setMagic] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // MetaMask state
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [metaMaskProvider, setMetaMaskProvider] = useState<any>(null);

  // Initialize Magic.link
  useEffect(() => {
    const initializeMagic = async () => {
      if (typeof window === 'undefined') return;

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[Hybrid] Initializing Magic.link for identity...');
        const { Magic } = await import('magic-sdk');
        const apiKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_DD04037B973BCFFA';
        
        const magicInstance = new Magic(apiKey, {
          network: {
            rpcUrl: 'https://sepolia.drpc.org',
            chainId: 11155111,
          },
        });
        
        setMagic(magicInstance);
        console.log('[Hybrid] Magic.link initialized for identity');
        
        // Check if user is already logged in
        const loggedIn = await magicInstance.user.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
          const userInfo = await magicInstance.user.getInfo();
          setUser(userInfo);
          console.log('[Hybrid] User already logged in:', userInfo);
        }
        
      } catch (err: any) {
        console.error('[Hybrid] Magic.link initialization failed:', err);
        setError(err.message || 'Failed to initialize Magic.link');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMagic();
  }, []);

  // Check for MetaMask
  useEffect(() => {
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        setMetaMaskProvider(ethereum);
        
        // Check if already connected
        ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts.length > 0) {
            setIsMetaMaskConnected(true);
            setMetaMaskAddress(accounts[0]);
            console.log('[Hybrid] MetaMask already connected:', accounts[0]);
          }
        });
      }
    };

    checkMetaMask();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsMetaMaskConnected(true);
          setMetaMaskAddress(accounts[0]);
          console.log('[Hybrid] MetaMask account changed:', accounts[0]);
        } else {
          setIsMetaMaskConnected(false);
          setMetaMaskAddress(null);
          console.log('[Hybrid] MetaMask disconnected');
        }
      });
    }
  }, []);

  // Magic.link login
  const login = async (email: string) => {
    if (!magic) {
      throw new Error('Magic.link not initialized');
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('[Hybrid] Logging in with Magic.link:', email);
      await magic.auth.loginWithMagicLink({ email });
      const userInfo = await magic.user.getInfo();
      
      setUser(userInfo);
      setIsLoggedIn(true);
      
      console.log('[Hybrid] Magic.link login successful:', userInfo);
    } catch (err: any) {
      console.error('[Hybrid] Magic.link login failed:', err);
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Magic.link logout
  const logout = async () => {
    if (!magic) {
      throw new Error('Magic.link not initialized');
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      await magic.user.logout();
      setUser(null);
      setIsLoggedIn(false);
      
      console.log('[Hybrid] Magic.link logout successful');
    } catch (err: any) {
      console.error('[Hybrid] Magic.link logout failed:', err);
      const errorMsg = err.message || 'Logout failed. Please try again.';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // MetaMask connection
  const connectMetaMask = async () => {
    if (!metaMaskProvider) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }
    
    try {
      console.log('[Hybrid] Connecting to MetaMask...');
      const accounts = await metaMaskProvider.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setIsMetaMaskConnected(true);
        setMetaMaskAddress(accounts[0]);
        console.log('[Hybrid] MetaMask connected:', accounts[0]);
      }
    } catch (err: any) {
      console.error('[Hybrid] MetaMask connection failed:', err);
      throw new Error('Failed to connect to MetaMask: ' + err.message);
    }
  };

  // MetaMask disconnection
  const disconnectMetaMask = () => {
    setIsMetaMaskConnected(false);
    setMetaMaskAddress(null);
    console.log('[Hybrid] MetaMask disconnected');
  };

  const contextValue = {
    // Magic.link
    magic,
    isLoggedIn,
    user,
    login,
    logout,
    isLoading,
    error,
    
    // MetaMask
    isMetaMaskConnected,
    metaMaskAddress,
    connectMetaMask,
    disconnectMetaMask,
    metaMaskProvider,
  };

  return (
    <HybridWalletContext.Provider value={contextValue}>
      {children}
    </HybridWalletContext.Provider>
  );
}
