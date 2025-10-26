// React hooks for Blockscout integration
// Professional data fetching and state management

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { 
  BlockscoutApiService, 
  createBlockscoutApi, 
  BlockscoutTransaction, 
  BlockscoutAddress,
  BlockscoutTokenBalance,
  SupportedChainId,
  isChainSupported 
} from './blockscout-api';

// Hook for fetching transaction history
export function useTransactionHistory(
  chainId: SupportedChainId,
  address?: string,
  options: {
    page?: number;
    limit?: number;
    filter?: 'from' | 'to' | 'all';
    type?: 'native' | 'token' | 'all';
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  
  const [transactions, setTransactions] = useState<BlockscoutTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextPageParams, setNextPageParams] = useState<any>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const fetchTransactions = useCallback(async (
    page: number = 1,
    append: boolean = false
  ) => {
    if (!api || !targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getAddressTransactions(targetAddress, {
        page,
        limit: options.limit || 20,
        filter: options.filter || 'all',
        type: options.type || 'all',
      });

      // Ensure response.items is an array
      const transactions = Array.isArray(response.items) ? response.items : [];

      if (append) {
        setTransactions(prev => [...prev, ...transactions]);
      } else {
        setTransactions(transactions);
      }

      setNextPageParams(response.next_page_params);
      setHasMore(!!response.next_page_params);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      // Set empty array on error
      if (!append) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [api, targetAddress, options.limit, options.filter, options.type]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && nextPageParams) {
      fetchTransactions(nextPageParams.page || 1, true);
    }
  }, [hasMore, loading, nextPageParams, fetchTransactions]);

  const refresh = useCallback(() => {
    fetchTransactions(1, false);
  }, [fetchTransactions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(refresh, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.refreshInterval, refresh]);

  // Initial load
  useEffect(() => {
    if (api && targetAddress) {
      fetchTransactions(1, false);
    }
  }, [api, targetAddress, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    api,
  };
}

// Hook for fetching address information
export function useAddressInfo(chainId: SupportedChainId, address?: string) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const [addressInfo, setAddressInfo] = useState<BlockscoutAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const fetchAddressInfo = useCallback(async () => {
    if (!api || !targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const info = await api.getAddress(targetAddress);
      // Ensure all required fields have fallback values
      setAddressInfo({
        hash: info.hash || targetAddress,
        balance: info.balance || '0',
        tx_count: info.tx_count || 0,
        is_contract: info.is_contract || false,
        name: info.name || null,
        token: info.token || null,
        ...info
      });
    } catch (err) {
      console.error('Failed to fetch address info:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch address info');
      // Set fallback address info
      setAddressInfo({
        hash: targetAddress,
        balance: '0',
        tx_count: 0,
        is_contract: false,
        name: null,
        token: null
      });
    } finally {
      setLoading(false);
    }
  }, [api, targetAddress]);

  useEffect(() => {
    if (api && targetAddress) {
      fetchAddressInfo();
    }
  }, [api, targetAddress, fetchAddressInfo]);

  return {
    addressInfo,
    loading,
    error,
    refresh: fetchAddressInfo,
    api,
  };
}

// Hook for fetching token balances
export function useTokenBalances(chainId: SupportedChainId, address?: string) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const [balances, setBalances] = useState<BlockscoutTokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const fetchBalances = useCallback(async () => {
    if (!api || !targetAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getTokenBalances(targetAddress);
      setBalances(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
    } finally {
      setLoading(false);
    }
  }, [api, targetAddress]);

  useEffect(() => {
    if (api && targetAddress) {
      fetchBalances();
    }
  }, [api, targetAddress, fetchBalances]);

  return {
    balances,
    loading,
    error,
    refresh: fetchBalances,
    api,
  };
}

// Hook for fetching single transaction details
export function useTransaction(chainId: SupportedChainId, txHash: string) {
  const [transaction, setTransaction] = useState<BlockscoutTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const fetchTransaction = useCallback(async () => {
    if (!api || !txHash) return;

    setLoading(true);
    setError(null);

    try {
      const tx = await api.getTransaction(txHash);
      setTransaction(tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  }, [api, txHash]);

  useEffect(() => {
    if (api && txHash) {
      fetchTransaction();
    }
  }, [api, txHash, fetchTransaction]);

  return {
    transaction,
    loading,
    error,
    refresh: fetchTransaction,
    api,
  };
}

// Hook for chain statistics
export function useChainStats(chainId: SupportedChainId) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const fetchStats = useCallback(async () => {
    if (!api) return;

    setLoading(true);
    setError(null);

    try {
      const chainStats = await api.getChainStats();
      setStats(chainStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chain stats');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (api) {
      fetchStats();
    }
  }, [api, fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
    api,
  };
}

// Hook for search functionality
export function useBlockscoutSearch(chainId: SupportedChainId) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(() => {
    if (!isChainSupported(chainId.toString())) {
      return null;
    }
    return createBlockscoutApi(chainId);
  }, [chainId]);

  const search = useCallback(async (query: string) => {
    if (!api || !query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await api.search(query);
      setResults(searchResults.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    results,
    loading,
    error,
    search,
    api,
  };
}

// Hook for transaction analytics
export function useTransactionAnalytics(
  chainId: SupportedChainId,
  address?: string,
  timeRange: '24h' | '7d' | '30d' | 'all' = '7d'
) {
  const { transactions, loading, error } = useTransactionHistory(chainId, address, {
    limit: 1000, // Get more transactions for analytics
  });

  const analytics = useMemo(() => {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalVolume: '0',
        averageGasUsed: '0',
        mostActiveHour: 0,
        transactionTypes: {},
        dailyActivity: {},
      };
    }

    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    }[timeRange];

    const filteredTxs = transactions.filter(tx => {
      const txTime = new Date(tx.timestamp).getTime();
      return (now.getTime() - txTime) <= timeRangeMs;
    });

    const successfulTxs = filteredTxs.filter(tx => tx.status === 'success');
    const failedTxs = filteredTxs.filter(tx => tx.status === 'failed');

    const totalVolume = filteredTxs.reduce((sum, tx) => {
      return sum + parseFloat(tx.value || '0');
    }, 0);

    const totalGasUsed = filteredTxs.reduce((sum, tx) => {
      return sum + parseInt(tx.gas_used || '0');
    }, 0);

    const averageGasUsed = filteredTxs.length > 0 ? totalGasUsed / filteredTxs.length : 0;

    // Calculate most active hour
    const hourCounts: Record<number, number> = {};
    filteredTxs.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    // Transaction types
    const transactionTypes: Record<string, number> = {};
    filteredTxs.forEach(tx => {
      const type = tx.to.is_contract ? 'contract' : 'transfer';
      transactionTypes[type] = (transactionTypes[type] || 0) + 1;
    });

    // Daily activity
    const dailyActivity: Record<string, number> = {};
    filteredTxs.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    return {
      totalTransactions: filteredTxs.length,
      successfulTransactions: successfulTxs.length,
      failedTransactions: failedTxs.length,
      totalVolume: totalVolume.toString(),
      averageGasUsed: averageGasUsed.toString(),
      mostActiveHour: parseInt(mostActiveHour),
      transactionTypes,
      dailyActivity,
    };
  }, [transactions, timeRange]);

  return {
    analytics,
    loading,
    error,
  };
}
