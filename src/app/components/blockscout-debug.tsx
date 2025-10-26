"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { useHybridWallet } from './hybrid-wallet-provider';

export function BlockscoutDebug() {
  const { address: wagmiAddress, chainId: wagmiChainId, isConnected: wagmiConnected } = useAccount();
  const { 
    isLoggedIn, 
    isMetaMaskConnected, 
    metaMaskAddress, 
    isLoading,
    error 
  } = useHybridWallet();

  return (
    <div style={{
      background: '#f3f4f6',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontWeight: '600' }}>🔍 Debug Information</h3>
      
      <div style={{ display: 'grid', gap: '8px' }}>
        <div>
          <strong>Wagmi Status:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>Connected: {wagmiConnected ? '✅' : '❌'}</li>
            <li>Address: {wagmiAddress || 'None'}</li>
            <li>Chain ID: {wagmiChainId || 'None'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Hybrid Wallet Status:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            <li>Loading: {isLoading ? '✅' : '❌'}</li>
            <li>Email Logged In: {isLoggedIn ? '✅' : '❌'}</li>
            <li>MetaMask Connected: {isMetaMaskConnected ? '✅' : '❌'}</li>
            <li>MetaMask Address: {metaMaskAddress || 'None'}</li>
          </ul>
        </div>
        
        <div>
          <strong>Final Address Used:</strong>
          <span style={{ 
            fontFamily: 'monospace', 
            background: '#e5e7eb', 
            padding: '2px 6px', 
            borderRadius: '4px',
            marginLeft: '8px'
          }}>
            {metaMaskAddress || wagmiAddress || 'None'}
          </span>
        </div>
        
        {error && (
          <div style={{ color: '#dc2626', marginTop: '8px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
