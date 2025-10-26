"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionPopup } from '@blockscout/app-sdk';

export default function BlockscoutTestPage() {
  const { address, isConnected } = useAccount();
  const { openPopup } = useTransactionPopup();
  
  const [showMockData, setShowMockData] = useState(false);

  const mockTransactions = [
    {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: { hash: '0xabcdef1234567890abcdef1234567890abcdef12' },
      to: { hash: '0x1234567890abcdef1234567890abcdef12345678' },
      value: '1000000000000000000', // 1 ETH
      timestamp: new Date().toISOString(),
      status: 'ok'
    },
    {
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: { hash: '0x1234567890abcdef1234567890abcdef12345678' },
      to: { hash: '0xabcdef1234567890abcdef1234567890abcdef12' },
      value: '500000000000000000', // 0.5 ETH
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'ok'
    }
  ];

  const mockAddressInfo = {
    hash: address || '0x1234567890abcdef1234567890abcdef12345678',
    balance: '1500000000000000000', // 1.5 ETH
    tx_count: 42,
    is_contract: false
  };

  const showFullHistory = () => {
    if (address) {
      openPopup({
        chainId: "84532",
        address: address
      });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div className="bg-white rounded-lg shadow border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Blockscout Test Dashboard</h3>
                <p className="text-sm text-gray-500">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowMockData(!showMockData)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  {showMockData ? 'Hide' : 'Show'} Mock Data
                </button>
                {address && (
                  <button 
                    onClick={showFullHistory}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    📊 Full History
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="p-6 border-b border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Connection Status</h4>
              <p className="text-blue-700">
                Wallet Connected: {isConnected ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-blue-700">
                Address: {address || 'Not available'}
              </p>
            </div>
          </div>

          {/* Mock Data Section */}
          {showMockData && (
            <>
              {/* Address Info */}
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Mock Address Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Balance</p>
                        <p className="text-lg font-bold text-blue-900">
                          {(parseInt(mockAddressInfo.balance) / 1e18).toFixed(4)} ETH
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Transactions</p>
                        <p className="text-lg font-bold text-green-900">
                          {mockAddressInfo.tx_count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏷️</span>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Type</p>
                        <p className="text-lg font-bold text-purple-900">
                          {mockAddressInfo.is_contract ? 'Contract' : 'EOA'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Transactions */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Mock Transactions</h4>
                <div className="space-y-4">
                  {mockTransactions.map((tx, index) => (
                    <div key={tx.hash || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">↔️</span>
                          <span className="font-mono text-sm text-gray-600">
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">From:</span>
                          <p className="font-mono text-xs">
                            {tx.from.hash.slice(0, 8)}...{tx.from.hash.slice(-6)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">To:</span>
                          <p className="font-mono text-xs">
                            {tx.to.hash.slice(0, 8)}...{tx.to.hash.slice(-6)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {(parseInt(tx.value) / 1e18).toFixed(4)} ETH
                        </span>
                        <span className="text-green-600 text-sm">
                          ✅ Success
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Instructions */}
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Instructions</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Connect your wallet to see real Blockscout data</li>
                <li>• Click "Show Mock Data" to see sample data</li>
                <li>• Click "Full History" to open Blockscout popup</li>
                <li>• Visit <a href="/blockscout-dashboard" className="underline">/blockscout-dashboard</a> for the main dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
