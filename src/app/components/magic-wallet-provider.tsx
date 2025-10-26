'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface MagicWalletContextType {
  magic: any;
  isLoggedIn: boolean;
  user: any;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getProvider: () => any;
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

  useEffect(() => {
    // Initialize Magic SDK
    if (typeof window !== 'undefined') {
      // Dynamically import Magic to avoid SSR issues
      import('magic-sdk').then(({ Magic }) => {
        const magicInstance = new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_F7EEF952E3688610', {
          network: {
            rpcUrl: 'https://sepolia.drpc.org', // Default to Ethereum Sepolia
            chainId: 11155111,
          },
        });
        setMagic(magicInstance);

        // Check if user is already logged in
        magicInstance.user.isLoggedIn().then((loggedIn) => {
          setIsLoggedIn(loggedIn);
          if (loggedIn) {
            magicInstance.user.getInfo().then((userInfo) => {
              setUser(userInfo);
            });
          }
        });
      }).catch((error) => {
        console.error('[Magic] Failed to initialize:', error);
      });
    }
  }, []);

  const login = async (email: string) => {
    if (!magic) {
      throw new Error('Magic SDK not initialized');
    }

    try {
      const didToken = await magic.auth.loginWithMagicLink({ email });
      const userInfo = await magic.user.getInfo();
      
      setUser(userInfo);
      setIsLoggedIn(true);
      
      console.log('[Magic] User logged in:', userInfo);
    } catch (error: any) {
      console.error('[Magic] Login failed:', error);
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    if (!magic) {
      throw new Error('Magic SDK not initialized');
    }

    try {
      await magic.user.logout();
      setUser(null);
      setIsLoggedIn(false);
      
      console.log('[Magic] User logged out');
    } catch (error: any) {
      console.error('[Magic] Logout failed:', error);
      throw new Error(error.message || 'Logout failed. Please try again.');
    }
  };

  const getProvider = () => {
    if (!magic) return null;
    return magic.rpcProvider;
  };

  const value: MagicWalletContextType = {
    magic,
    isLoggedIn,
    user,
    login,
    logout,
    getProvider,
  };

  return (
    <MagicWalletContext.Provider value={value}>
      {children}
    </MagicWalletContext.Provider>
  );
}
