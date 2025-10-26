"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { SupportedChainId, isChainSupported } from '../../lib/blockscout-api';

interface TransactionHistoryProps {
  chainId?: SupportedChainId;
  address?: string;
  className?: string;
}

export function BlockscoutTransactionHistory({ 
  chainId = '84532', // Default to Base Sepolia
  address,
  className = ''
}: TransactionHistoryProps) {
  const { address: connectedAddress, chainId: connectedChainId } = useAccount();
  
  // Use provided address or connected address
  const targetAddress = address || connectedAddress;
  const targetChainId = chainId || (connectedChainId?.toString() as SupportedChainId) || '84532';

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'from' | 'to'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'native' | 'token'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    transactions, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = useTransactionHistory(targetChainId, targetAddress, {
    filter: selectedFilter,
    type: selectedType,
    limit: 20,
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const { addressInfo, loading: addressLoading } = useAddressInfo(targetChainId, targetAddress);
  const { balances, loading: balancesLoading } = useTokenBalances(targetChainId, targetAddress);

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter(tx => 
      tx.hash.toLowerCase().includes(query) ||
      tx.from.hash.toLowerCase().includes(query) ||
      tx.to.hash.toLowerCase().includes(query) ||
      tx.method?.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Format transaction for display
  const formatTransaction = (tx: any) => {
    const isTokenTransfer = tx.token_transfers && tx.token_transfers.length > 0;
    const isContract = tx.to.is_contract;
    
    let type = 'Transfer';
    let amount = '0';
    let token = 'ETH';
    let icon = '↔️';
    
    if (isTokenTransfer) {
      type = 'Token Transfer';
      const transfer = tx.token_transfers[0];
      amount = transfer.value;
      token = transfer.token.symbol;
      icon = '🪙';
    } else if (isContract) {
      type = 'Contract Interaction';
      amount = tx.value;
      icon = '📄';
    } else {
      type = parseFloat(tx.value) > 0 ? 'Send' : 'Receive';
      amount = tx.value;
      icon = parseFloat(tx.value) > 0 ? '📤' : '📥';
    }
    
    return {
      ...tx,
      displayType: type,
      displayAmount: amount,
      displayToken: token,
      displayIcon: icon,
    };
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: string, token: string) => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString();
  };

  if (!isChainSupported(targetChainId)) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">Unsupported Chain</h3>
            <p className="text-sm text-red-600">
              Chain ID {targetChainId} is not supported by Blockscout.
            </p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-500">
                {targetChainId === '84532' ? 'Base Sepolia' : `Chain ${targetChainId}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Address Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
            <p className="font-mono text-sm font-medium">
              {formatAddress(targetAddress)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
            <p className="font-semibold">
              {addressInfo ? formatAmount(addressInfo.balance || '0', 'ETH') : 'Loading...'} ETH
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Transactions</p>
            <p className="font-semibold">
              {addressInfo ? (addressInfo.tx_count ? addressInfo.tx_count.toLocaleString() : '0') : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('from')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'from'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setSelectedFilter('to')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'to'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Received
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('native')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === 'native'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Native
            </button>
            <button
              onClick={() => setSelectedType('token')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === 'token'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tokens
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Search transactions by hash, address, or method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium">Failed to load transactions</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📭</div>
            <p className="text-gray-500">No transactions found</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((tx) => {
              const formatted = formatTransaction(tx);
              return (
                <div key={tx.hash} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{formatted.displayIcon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {formatted.displayType}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(tx.timestamp)}
                        </p>
                        {formatted.displayMethod && (
                          <p className="text-xs text-gray-400 font-mono">
                            {formatted.displayMethod}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatAmount(formatted.displayAmount, formatted.displayToken)} {formatted.displayToken}
                      </div>
                      <div className="text-xs text-gray-500">
                        Gas: {parseInt(tx.gas_used).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>
                        From: <span className="font-mono">{formatAddress(tx.from.hash)}</span>
                      </span>
                      <span>
                        To: <span className="font-mono">{formatAddress(tx.to.hash)}</span>
                      </span>
                    </div>
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View on Explorer →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="p-4 text-center border-t border-gray-200">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Load More Transactions
            </button>
          </div>
        )}

        {loading && transactions.length > 0 && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
