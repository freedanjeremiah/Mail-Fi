"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionPopup } from '@blockscout/app-sdk';

interface BlockscoutSimpleProps {
  chainId?: string;
  address?: string;
  className?: string;
}

export function BlockscoutSimple({ 
  chainId = '84532',
  address,
  className = ''
}: BlockscoutSimpleProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { openPopup } = useTransactionPopup();
  const targetAddress = address || connectedAddress;
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInfo, setAddressInfo] = useState<any>(null);

  const fetchData = async () => {
    if (!targetAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch transactions from Blockscout API
      const txResponse = await fetch(`https://eth-sepolia.blockscout.com/api/v2/addresses/${targetAddress}/transactions?page=1&limit=10`);
      const txData = await txResponse.json();
      
      // Fetch address info
      const addrResponse = await fetch(`https://eth-sepolia.blockscout.com/api/v2/addresses/${targetAddress}`);
      const addrData = await addrResponse.json();
      
      if (txData.items) {
        setTransactions(txData.items);
      }
      
      if (addrData) {
        setAddressInfo(addrData);
      }
      
    } catch (err) {
      setError('Failed to fetch data from Blockscout');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetAddress) {
      fetchData();
    }
  }, [targetAddress]);

  const showFullHistory = () => {
    if (targetAddress) {
      openPopup({
        chainId: chainId,
        address: targetAddress
      });
    }
  };

  if (!targetAddress) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">🔌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view Blockscout transaction data.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Blockscout data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Blockscout Dashboard</h3>
            <p className="text-sm text-gray-500">
              {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchData}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
            <button 
              onClick={showFullHistory}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              📊 Full History
            </button>
          </div>
        </div>
      </div>

      {/* Address Info */}
      {addressInfo && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Balance</p>
                  <p className="text-lg font-bold text-blue-900">
                    {addressInfo.balance ? `${(parseInt(addressInfo.balance) / 1e18).toFixed(4)} ETH` : '0 ETH'}
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
                    {addressInfo.tx_count?.toLocaleString() || '0'}
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
                    {addressInfo.is_contract ? 'Contract' : 'EOA'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-600">
              This address doesn't have any transactions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
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
                      {tx.from?.hash ? `${tx.from.hash.slice(0, 8)}...${tx.from.hash.slice(-6)}` : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <p className="font-mono text-xs">
                      {tx.to?.hash ? `${tx.to.hash.slice(0, 8)}...${tx.to.hash.slice(-6)}` : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {tx.value ? `${(parseInt(tx.value) / 1e18).toFixed(4)} ETH` : 'Contract Call'}
                  </span>
                  <a 
                    href={`https://eth-sepolia.blockscout.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
