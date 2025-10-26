"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface TransactionHistoryProps {
  chainId?: string;
  address?: string;
  className?: string;
}

export function BlockscoutTransactionHistorySimple({ 
  chainId = '84532',
  address,
  className = ''
}: TransactionHistoryProps) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!targetAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use Blockscout API directly like intent-wars
      const response = await fetch(`https://eth-sepolia.blockscout.com/api/v2/addresses/${targetAddress}/transactions?page=1&limit=10`);
      const data = await response.json();
      
      if (data.items) {
        setTransactions(data.items);
      } else {
        setError('No transactions found');
      }
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetAddress) {
      fetchTransactions();
    }
  }, [targetAddress]);

  if (!targetAddress) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">🔌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view transaction history.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">
              {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
            </p>
          </div>
          <button 
            onClick={fetchTransactions}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="p-6">
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
