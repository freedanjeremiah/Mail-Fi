"use client";

import React, { useState } from 'react';
import { useHybridWallet } from './hybrid-wallet-provider';
import { HybridLoginModal } from './hybrid-login-modal';

interface WalletConnectButtonProps {
  className?: string;
  showAddress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function WalletConnectButton({ 
  className = '', 
  showAddress = true,
  size = 'md'
}: WalletConnectButtonProps) {
  const { 
    isLoggedIn, 
    user, 
    isMetaMaskConnected, 
    metaMaskAddress, 
    logout, 
    disconnectMetaMask,
    isLoading 
  } = useHybridWallet();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFullyConnected = isLoggedIn && isMetaMaskConnected;

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const handleConnect = () => {
    setIsModalOpen(true);
  };

  const handleDisconnect = async () => {
    try {
      if (isLoggedIn) {
        await logout();
      }
      if (isMetaMaskConnected) {
        disconnectMetaMask();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`${getButtonSize()} bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </button>
    );
  }

  if (isFullyConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showAddress && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              {metaMaskAddress?.slice(0, 6)}...{metaMaskAddress?.slice(-4)}
            </span>
          </div>
        )}
        <button
          onClick={handleDisconnect}
          className={`${getButtonSize()} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className={`${getButtonSize()} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <span>Connect Wallet</span>
        </div>
      </button>

      <HybridLoginModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

// Compact version for smaller spaces
export function WalletConnectButtonCompact({ className = '' }: { className?: string }) {
  return (
    <WalletConnectButton 
      className={className}
      showAddress={false}
      size="sm"
    />
  );
}

// Status indicator component
export function WalletStatusIndicator({ className = '' }: { className?: string }) {
  const { isLoggedIn, isMetaMaskConnected, metaMaskAddress, isLoading } = useHybridWallet();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-yellow-600">Connecting...</span>
      </div>
    );
  }

  if (isLoggedIn && isMetaMaskConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-600">
          Connected: {metaMaskAddress?.slice(0, 6)}...{metaMaskAddress?.slice(-4)}
        </span>
      </div>
    );
  }

  if (isLoggedIn && !isMetaMaskConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-yellow-600">Email connected, MetaMask needed</span>
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
