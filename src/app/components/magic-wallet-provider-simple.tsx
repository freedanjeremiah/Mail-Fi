'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MagicWalletContextType {
  magic: any;
  isLoggedIn: boolean;
  user: any;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getProvider: () => any;
  isLoading: boolean;
  error: string | null;
}

const MagicWalletContext = createContext<MagicWalletContextType | undefined>(undefined);

export function useMagicWallet() {
  const context = useContext(MagicWalletContext);
  if (!context) {
    throw new Error('useMagicWallet must be used within a MagicWalletProvider');
  }
  return context;
}

interface MagicWalletProviderProps {
  children: React.ReactNode;
}

export function MagicWalletProvider({ children }: MagicWalletProviderProps) {
  const [magic, setMagic] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMagic = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Dynamic import to avoid SSR issues
        console.log('[Magic] Starting Magic SDK initialization...');
        const { Magic } = await import('magic-sdk');
        const apiKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_F7EEF952E3688610';
        console.log('[Magic] Using API key:', apiKey.substring(0, 10) + '...');
        
        const magicInstance = new Magic(apiKey, {
          network: {
            rpcUrl: 'https://sepolia.drpc.org',
            chainId: 11155111,
          },
        });
        
        setMagic(magicInstance);
        console.log('[Magic] Magic SDK instance created');
        
        // Check if user is already logged in
        console.log('[Magic] Checking if user is already logged in...');
        const loggedIn = await magicInstance.user.isLoggedIn();
        setIsLoggedIn(loggedIn);
        console.log('[Magic] Login status:', loggedIn);
        
        if (loggedIn) {
          console.log('[Magic] Getting user info...');
          const userInfo = await magicInstance.user.getInfo();
          setUser(userInfo);
          console.log('[Magic] User info:', userInfo);
        }
        
        console.log('[Magic] Initialized successfully');
      } catch (err: any) {
        console.error('[Magic] Initialization failed:', err);
        setError(err.message || 'Failed to initialize Magic SDK');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMagic();
  }, []);

  const login = async (email: string) => {
    if (!magic) {
      console.error('[Magic] Magic SDK not initialized');
      throw new Error('Magic SDK not initialized');
    }

    try {
      setError(null);
      console.log('[Magic] Starting login process for:', email);
      const didToken = await magic.auth.loginWithMagicLink({ email });
      console.log('[Magic] Magic link sent, getting user info...');
      const userInfo = await magic.user.getInfo();
      
      setUser(userInfo);
      setIsLoggedIn(true);
      
      console.log('[Magic] User logged in successfully:', userInfo);
    } catch (err: any) {
      console.error('[Magic] Login failed:', err);
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    if (!magic) {
      throw new Error('Magic SDK not initialized');
    }

    try {
      setError(null);
      await magic.user.logout();
      setUser(null);
      setIsLoggedIn(false);
      
      console.log('[Magic] User logged out');
    } catch (err: any) {
      console.error('[Magic] Logout failed:', err);
      const errorMsg = err.message || 'Logout failed. Please try again.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getProvider = () => {
    if (!magic) return null;
    
    // Return the Magic RPC provider directly for basic operations
    // The custom provider will be created in the bridge component
    console.log('[Magic] Returning Magic RPC provider for basic operations');
    return magic.rpcProvider;
  };

  const value: MagicWalletContextType = {
    magic,
    isLoggedIn,
    user,
    login,
    logout,
    getProvider,
    isLoading,
    error,
  };

  return (
    <MagicWalletContext.Provider value={value}>
      {children}
    </MagicWalletContext.Provider>
  );
}
