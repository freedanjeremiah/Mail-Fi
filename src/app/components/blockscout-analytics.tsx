"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useTransactionAnalytics, useAddressInfo, useTokenBalances } from '../../lib/blockscout-hooks';
import { SupportedChainId } from '../../lib/blockscout-api';

interface AnalyticsProps {
  chainId?: SupportedChainId;
  address?: string;
  className?: string;
}

export function BlockscoutAnalytics({ 
  chainId = '84532', // Default to Base Sepolia
  address,
  className = ''
}: AnalyticsProps) {
  const { address: connectedAddress } = useAccount();
  
  // Use provided address or connected address
  const targetAddress = address || connectedAddress;
  
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  
  const { analytics, loading, error } = useTransactionAnalytics(
    chainId, 
    targetAddress, 
    timeRange
  );
  
  const { addressInfo } = useAddressInfo(chainId, targetAddress);
  const { balances } = useTokenBalances(chainId, targetAddress);

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num === 0) return '0 ETH';
    if (num < 0.001) return '< 0.001 ETH';
    if (num < 1) return `${num.toFixed(4)} ETH`;
    if (num < 1000) return `${num.toFixed(2)} ETH`;
    return `${(num / 1000).toFixed(1)}K ETH`;
  };

  const getSuccessRate = () => {
    if (analytics.totalTransactions === 0) return 0;
    return ((analytics.successfulTransactions / analytics.totalTransactions) * 100).toFixed(1);
  };

  const getMostActiveHourText = () => {
    const hour = analytics.mostActiveHour;
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  if (!targetAddress) {
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔌</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Connect Wallet</h3>
            <p className="text-sm text-yellow-600">
              Connect your wallet to view transaction analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
            <p className="text-sm text-red-600">{error}</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📈</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction Analytics</h2>
              <p className="text-sm text-gray-500">
                {chainId === '84532' ? 'Base Sepolia' : `Chain ${chainId}`} • {timeRange}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Total
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatNumber(analytics.totalTransactions)}
            </div>
            <div className="text-sm text-blue-700">
              transactions
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">✅</span>
              </div>
              <span className="text-xs text-green-600 font-medium uppercase tracking-wide">
                Success Rate
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {getSuccessRate()}%
            </div>
            <div className="text-sm text-green-700">
              {analytics.successfulTransactions} successful
            </div>
          </div>

          {/* Total Volume */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
              <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">
                Volume
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {formatVolume(analytics.totalVolume)}
            </div>
            <div className="text-sm text-purple-700">
              {timeRange} period
            </div>
          </div>

          {/* Average Gas */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">⛽</span>
              </div>
              <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">
                Avg Gas
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {formatNumber(parseInt(analytics.averageGasUsed))}
            </div>
            <div className="text-sm text-orange-700">
              gas units
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Types */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Types</h3>
            <div className="space-y-3">
              {Object.entries(analytics.transactionTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      type === 'contract' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium text-gray-700 capitalize">
                      {type} Transactions
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatNumber(count)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Insights */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Most Active Hour</span>
                <span className="font-bold text-gray-900">{getMostActiveHourText()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Failed Transactions</span>
                <span className="font-bold text-red-600">
                  {formatNumber(analytics.failedTransactions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Daily Average</span>
                <span className="font-bold text-gray-900">
                  {timeRange === 'all' 
                    ? 'N/A' 
                    : formatNumber(Math.round(analytics.totalTransactions / (
                        timeRange === '24h' ? 1 : 
                        timeRange === '7d' ? 7 : 30
                      )))
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address Summary */}
        {addressInfo && (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Address Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {formatNumber(addressInfo.tx_count)}
                </div>
                <div className="text-sm text-indigo-700">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {parseFloat(addressInfo.balance).toFixed(4)}
                </div>
                <div className="text-sm text-indigo-700">ETH Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {balances.length}
                </div>
                <div className="text-sm text-indigo-700">Token Holdings</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
