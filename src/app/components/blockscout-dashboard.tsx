"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionPopup } from '@blockscout/app-sdk';
import { BlockscoutTransactionHistorySimple } from './blockscout-transaction-history-simple';
import { BlockscoutTransactionToast } from './blockscout-transaction-toast';
import { BlockscoutAnalyticsSimple } from './blockscout-analytics-simple';
import { WalletConnectButton, WalletStatusIndicator } from './wallet-connect-button';
import { BlockscoutDebug } from './blockscout-debug';
import { SupportedChainId } from '../../lib/blockscout-api';

interface DashboardProps {
  chainId?: SupportedChainId;
  address?: string;
  className?: string;
}

export function BlockscoutDashboard({ 
  chainId = '84532', // Default to Base Sepolia
  address,
  className = ''
}: DashboardProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { openPopup } = useTransactionPopup();
  
  // Use provided address or connected address
  const targetAddress = address || connectedAddress;
  
  const [activeTab, setActiveTab] = useState<'history' | 'analytics' | 'notifications'>('history');

  const tabs = [
    { id: 'history', label: 'Transaction History', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ] as const;

  if (!targetAddress) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">🔌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access comprehensive transaction history, analytics, and real-time notifications powered by Blockscout.
          </p>
          
          {/* Wallet Connect Button */}
          <div className="mb-6">
            <WalletConnectButton size="lg" />
          </div>
          
          {/* Wallet Status */}
          <div className="mb-6">
            <WalletStatusIndicator />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Features Available After Connection:</h3>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Real-time transaction history</li>
              <li>• Advanced analytics and insights</li>
              <li>• Transaction notifications</li>
              <li>• Multi-chain support</li>
              <li>• Token balance tracking</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blockscout Dashboard</h1>
              <p className="text-sm text-gray-500">
                Professional transaction monitoring for {chainId === '84532' ? 'Base Sepolia' : `Chain ${chainId}`}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="mb-2">
              <WalletConnectButton size="sm" />
            </div>
            <p className="text-sm text-gray-500">Connected Address</p>
            <p className="font-mono text-sm font-medium">
              {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
            </p>
            {targetAddress && (
              <button 
                onClick={() => openPopup({
                  chainId: chainId,
                  address: targetAddress
                })}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                📊 View Full History
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Debug Information */}
      <BlockscoutDebug />

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'history' && (
          <BlockscoutTransactionHistorySimple 
            chainId={chainId} 
            address={targetAddress}
          />
        )}
        
        {activeTab === 'analytics' && (
          <BlockscoutAnalyticsSimple 
            chainId={chainId} 
            address={targetAddress}
          />
        )}
        
        {activeTab === 'notifications' && (
          <BlockscoutTransactionToast 
            chainId={chainId}
          />
        )}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function BlockscoutDashboardCompact({ 
  chainId = '84532',
  address,
  className = ''
}: DashboardProps) {
  const { address: connectedAddress } = useAccount();
  
  // Use provided address or connected address
  const targetAddress = address || connectedAddress;

  if (!targetAddress) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔌</span>
            <div>
              <h3 className="font-semibold text-yellow-800">Connect Wallet</h3>
              <p className="text-sm text-yellow-600">
                Connect to view transaction data
              </p>
            </div>
          </div>
          <WalletConnectButton size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold text-gray-900">Transaction Dashboard</h3>
          </div>
          <span className="text-xs text-gray-500">
            {chainId === '84532' ? 'Base Sepolia' : `Chain ${chainId}`}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <BlockscoutTransactionHistorySimple 
          chainId={chainId} 
          address={targetAddress}
          className="shadow-none border-0"
        />
      </div>
    </div>
  );
}
