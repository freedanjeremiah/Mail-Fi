"use client";

import React, { useState, useEffect } from 'react';
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk';
import { useAccount } from 'wagmi';
import { SupportedChainId } from '../../lib/blockscout-api';

interface TransactionToastProps {
  chainId?: SupportedChainId;
  className?: string;
}

export function BlockscoutTransactionToast({ 
  chainId = '84532', // Default to Base Sepolia
  className = ''
}: TransactionToastProps) {
  const { address } = useAccount();
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(!!address);
  }, [address]);

  const showTransactionHistory = () => {
    if (address) {
      openPopup({
        chainId: chainId.toString(),
        address: address
      });
    }
  };

  const showTransactionToast = (txHash: string) => {
    openTxToast(chainId.toString(), txHash);
  };

  // Example function to show a transaction toast (can be called from other components)
  const handleTransactionSuccess = (txHash: string) => {
    showTransactionToast(txHash);
  };

  if (!isConnected) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔌</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Connect Wallet</h3>
            <p className="text-sm text-yellow-600">
              Connect your wallet to view transaction history and receive notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🔔</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transaction Notifications</h2>
            <p className="text-sm text-gray-500">
              Real-time transaction updates and history
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-green-800">Blockscout Integration Active</h3>
                <p className="text-sm text-green-600">
                  Transaction notifications and history are enabled for {chainId === '84532' ? 'Base Sepolia' : `Chain ${chainId}`}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={showTransactionHistory}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800">View History</h3>
                  <p className="text-sm text-blue-600">
                    Open transaction history popup
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => showTransactionToast('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">🔔</span>
                <div className="text-left">
                  <h3 className="font-semibold text-purple-800">Test Toast</h3>
                  <p className="text-sm text-purple-600">
                    Show example transaction toast
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Real-time transaction notifications
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Interactive transaction history popup
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Multi-chain support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Automatic transaction tracking
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy integration with other components
export function useBlockscoutNotifications(chainId: SupportedChainId = '84532') {
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  const { address } = useAccount();

  const showTransactionToast = (txHash: string) => {
    openTxToast(chainId.toString(), txHash);
  };

  const showTransactionHistory = () => {
    if (address) {
      openPopup({
        chainId: chainId.toString(),
        address: address
      });
    }
  };

  return {
    showTransactionToast,
    showTransactionHistory,
    isConnected: !!address,
  };
}
