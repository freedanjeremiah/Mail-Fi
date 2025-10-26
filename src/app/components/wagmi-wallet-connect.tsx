"use client";

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

interface WagmiWalletConnectProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WagmiWalletConnect({ 
  className = '', 
  size = 'md' 
}: WagmiWalletConnectProps) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-800">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className={`${getButtonSize()} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
        return (
          <button
            onClick={show}
            className={`${getButtonSize()} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
          >
            <div className="flex items-center gap-2">
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Connect Wallet</span>
                </>
              )}
            </div>
          </button>
        );
      }}
    </ConnectKitButton.Custom>
  );
}

// Status indicator component
export function WagmiWalletStatus({ className = '' }: { className?: string }) {
  const { address, isConnected, isConnecting } = useAccount();

  if (isConnecting) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-yellow-600">Connecting...</span>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-600">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span className="text-sm text-red-600">Not connected</span>
    </div>
  );
}
