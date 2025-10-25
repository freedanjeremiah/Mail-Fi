'use client';

import React, { useState } from 'react';
import { useHybridWallet } from './hybrid-wallet-provider';

interface HybridLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function HybridLoginModal({ isOpen, onClose, onSuccess }: HybridLoginModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, connectMetaMask, isMetaMaskConnected, metaMaskAddress } = useHybridWallet();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('[Hybrid] Attempting Magic.link login with email:', email);
      await login(email);
      console.log('[Hybrid] Magic.link login successful');
      
      // If MetaMask is already connected, we're ready
      if (isMetaMaskConnected) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('[Hybrid] Magic.link login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetaMaskConnect = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      console.log('[Hybrid] Connecting to MetaMask...');
      await connectMetaMask();
      console.log('[Hybrid] MetaMask connection successful');
      onSuccess();
    } catch (err: any) {
      console.error('[Hybrid] MetaMask connection failed:', err);
      setError(err.message || 'MetaMask connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    console.log('[Hybrid] Modal not open');
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
          Connect Hybrid Wallet
        </h2>
        <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
          Login with email for identity, connect MetaMask for transactions
        </p>

        {/* Email Login Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>
            1. Login with Email (Identity)
          </h3>
          <form onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Sending Magic Link...' : 'Send Magic Link'}
            </button>
          </form>
        </div>

        {/* MetaMask Connection Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '500' }}>
            2. Connect MetaMask (Transactions)
          </h3>
          {isMetaMaskConnected ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              ✓ MetaMask Connected: {metaMaskAddress?.slice(0, 6)}...{metaMaskAddress?.slice(-4)}
            </div>
          ) : (
            <button
              onClick={handleMetaMaskConnect}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
