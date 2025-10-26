"use client";

import React from 'react';
import { WalletConnectButton, WalletStatusIndicator } from '../components/wallet-connect-button';
import { useHybridWallet } from '../components/hybrid-wallet-provider';

export default function WalletTestPage() {
  const { 
    isLoggedIn, 
    user, 
    isMetaMaskConnected, 
    metaMaskAddress, 
    isLoading,
    error 
  } = useHybridWallet();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#1f2937'
        }}>
          Wallet Connection Test
        </h1>

        {/* Wallet Connect Button */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <WalletConnectButton size="lg" />
        </div>

        {/* Status Indicator */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <WalletStatusIndicator />
        </div>

        {/* Detailed Status */}
        <div style={{
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#374151'
          }}>
            Connection Status
          </h2>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Loading:</span>
              <span style={{ color: isLoading ? '#f59e0b' : '#10b981' }}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Email Logged In:</span>
              <span style={{ color: isLoggedIn ? '#10b981' : '#ef4444' }}>
                {isLoggedIn ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>MetaMask Connected:</span>
              <span style={{ color: isMetaMaskConnected ? '#10b981' : '#ef4444' }}>
                {isMetaMaskConnected ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '500' }}>Fully Connected:</span>
              <span style={{ color: (isLoggedIn && isMetaMaskConnected) ? '#10b981' : '#ef4444' }}>
                {(isLoggedIn && isMetaMaskConnected) ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#065f46'
            }}>
              User Information
            </h3>
            <div style={{ fontSize: '14px', color: '#047857' }}>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Public Address:</strong> {user.publicAddress}</p>
            </div>
          </div>
        )}

        {/* MetaMask Info */}
        {metaMaskAddress && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#92400e'
            }}>
              MetaMask Information
            </h3>
            <div style={{ fontSize: '14px', color: '#b45309' }}>
              <p><strong>Address:</strong> {metaMaskAddress}</p>
              <p><strong>Short Address:</strong> {metaMaskAddress.slice(0, 6)}...{metaMaskAddress.slice(-4)}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#dc2626'
            }}>
              Error
            </h3>
            <p style={{ fontSize: '14px', color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#1e40af'
          }}>
            How to Connect
          </h3>
          <ol style={{ fontSize: '14px', color: '#1e3a8a', paddingLeft: '20px' }}>
            <li>Click "Connect Wallet" button above</li>
            <li>Enter your email address and click "Send Magic Link"</li>
            <li>Check your email and click the magic link</li>
            <li>Connect your MetaMask wallet</li>
            <li>You should see "Fully Connected: Yes" above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
