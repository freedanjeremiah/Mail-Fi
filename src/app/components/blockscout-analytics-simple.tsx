"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface AnalyticsProps {
  chainId?: string;
  address?: string;
  className?: string;
}

export function BlockscoutAnalyticsSimple({ 
  chainId = '84532',
  address,
  className = ''
}: AnalyticsProps) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!targetAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch address info from Blockscout API
      const response = await fetch(`https://eth-sepolia.blockscout.com/api/v2/addresses/${targetAddress}`);
      const data = await response.json();
      
      if (data) {
        setStats({
          balance: data.balance || '0',
          txCount: data.tx_count || 0,
          isContract: data.is_contract || false,
          name: data.name || null
        });
      } else {
        setError('Failed to fetch address stats');
      }
    } catch (err) {
      setError('Failed to fetch address stats');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetAddress) {
      fetchStats();
    }
  }, [targetAddress]);

  if (!targetAddress) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">📈</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to view analytics.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-red-500 mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={fetchStats}
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
            <h3 className="text-lg font-semibold text-gray-900">Address Analytics</h3>
            <p className="text-sm text-gray-500">
              {targetAddress.slice(0, 6)}...{targetAddress.slice(-4)}
            </p>
          </div>
          <button 
            onClick={fetchStats}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Balance</p>
                  <p className="text-lg font-bold text-blue-900">
                    {stats.balance ? `${(parseInt(stats.balance) / 1e18).toFixed(4)} ETH` : '0 ETH'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Transactions</p>
                  <p className="text-lg font-bold text-green-900">
                    {stats.txCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🏷️</span>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Type</p>
                  <p className="text-lg font-bold text-purple-900">
                    {stats.isContract ? 'Contract' : 'EOA'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🌐</span>
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Network</p>
                  <p className="text-lg font-bold text-orange-900">
                    {chainId === '84532' ? 'Base Sepolia' : `Chain ${chainId}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-600">
              Unable to load analytics for this address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
