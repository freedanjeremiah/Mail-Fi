// Blockscout API Service for Mail-Fi
// Professional transaction history and blockchain data integration

export interface BlockscoutTransaction {
  hash: string;
  block: number;
  timestamp: string;
  from: {
    hash: string;
    name?: string;
    is_contract: boolean;
  };
  to: {
    hash: string;
    name?: string;
    is_contract: boolean;
  };
  value: string;
  fee: {
    value: string;
    type: string;
  };
  gas_used: string;
  gas_price: string;
  status: 'success' | 'failed';
  method?: string;
  decoded_input?: any;
  token_transfers?: Array<{
    token: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    from: {
      hash: string;
    };
    to: {
      hash: string;
    };
    value: string;
  }>;
}

export interface BlockscoutAddress {
  hash: string;
  name?: string;
  is_contract: boolean;
  token?: {
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
  };
  balance: string;
  tx_count: number;
}

export interface BlockscoutTokenBalance {
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  value: string;
  token_id?: string;
}

export interface BlockscoutApiResponse<T> {
  items: T[];
  next_page_params?: {
    block_number?: number;
    index?: number;
    items_count?: number;
  };
}

// Chain configuration for Blockscout endpoints
export const BLOCKSCOUT_ENDPOINTS = {
  // Mainnet chains
  '1': 'https://eth.blockscout.com/api/v2', // Ethereum
  '10': 'https://optimism.blockscout.com/api/v2', // Optimism
  '137': 'https://polygon.blockscout.com/api/v2', // Polygon
  '42161': 'https://arbitrum.blockscout.com/api/v2', // Arbitrum
  '8453': 'https://base.blockscout.com/api/v2', // Base
  '43114': 'https://avalanche.blockscout.com/api/v2', // Avalanche
  '56': 'https://bsc.blockscout.com/api/v2', // BSC
  
  // Testnet chains
  '11155111': 'https://eth-sepolia.blockscout.com/api/v2', // Ethereum Sepolia
  '11155420': 'https://optimism-sepolia.blockscout.com/api/v2', // Optimism Sepolia
  '80002': 'https://polygon-amoy.blockscout.com/api/v2', // Polygon Amoy
  '421614': 'https://arbitrum-sepolia.blockscout.com/api/v2', // Arbitrum Sepolia
  '84532': 'https://base-sepolia.blockscout.com/api/v2', // Base Sepolia
} as const;

export type SupportedChainId = keyof typeof BLOCKSCOUT_ENDPOINTS;

export class BlockscoutApiService {
  private baseUrl: string;
  private chainId: SupportedChainId;

  constructor(chainId: SupportedChainId) {
    this.chainId = chainId;
    this.baseUrl = BLOCKSCOUT_ENDPOINTS[chainId];
    
    if (!this.baseUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(txHash: string): Promise<BlockscoutTransaction> {
    const response = await fetch(`${this.baseUrl}/transactions/${txHash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get transaction list for an address
   */
  async getAddressTransactions(
    address: string,
    options: {
      page?: number;
      limit?: number;
      filter?: 'from' | 'to' | 'all';
      type?: 'native' | 'token' | 'all';
    } = {}
  ): Promise<BlockscoutApiResponse<BlockscoutTransaction>> {
    const { page = 1, limit = 50, filter = 'all', type = 'all' } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      filter,
      type,
    });

    const response = await fetch(`${this.baseUrl}/addresses/${address}/transactions?${params}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty result for new addresses
        return {
          items: [],
          next_page_params: null
        };
      }
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure items is always an array
    return {
      items: Array.isArray(data.items) ? data.items : [],
      next_page_params: data.next_page_params || null
    };
  }

  /**
   * Get address information
   */
  async getAddress(address: string): Promise<BlockscoutAddress> {
    const response = await fetch(`${this.baseUrl}/addresses/${address}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return fallback data for new addresses
        return {
          hash: address,
          balance: '0',
          tx_count: 0,
          is_contract: false,
          name: null,
          token: null
        };
      }
      throw new Error(`Failed to fetch address: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Ensure all required fields exist
    return {
      hash: data.hash || address,
      balance: data.balance || '0',
      tx_count: data.tx_count || 0,
      is_contract: data.is_contract || false,
      name: data.name || null,
      token: data.token || null,
      ...data
    };
  }

  /**
   * Get token balances for an address
   */
  async getTokenBalances(address: string): Promise<BlockscoutApiResponse<BlockscoutTokenBalance>> {
    const response = await fetch(`${this.baseUrl}/addresses/${address}/token-balances`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token balances: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get transaction logs
   */
  async getTransactionLogs(txHash: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/transactions/${txHash}/logs`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction logs: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get internal transactions for a transaction
   */
  async getInternalTransactions(txHash: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/transactions/${txHash}/internal-transactions`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch internal transactions: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Search for addresses or transactions
   */
  async search(query: string): Promise<{
    items: Array<{
      type: 'address' | 'transaction' | 'token' | 'block';
      address?: string;
      tx_hash?: string;
      name?: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get chain statistics
   */
  async getChainStats(): Promise<{
    total_blocks: number;
    total_addresses: number;
    total_transactions: number;
    average_block_time: number;
    coin_price: string;
    total_gas_used: string;
  }> {
    const response = await fetch(`${this.baseUrl}/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chain stats: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
    holders: number;
    price?: string;
    market_cap?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token info: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get block information
   */
  async getBlock(blockNumber: number): Promise<{
    hash: string;
    height: number;
    timestamp: string;
    tx_count: number;
    size: number;
    gas_used: string;
    gas_limit: string;
    base_fee_per_gas?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/blocks/${blockNumber}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch block: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Format transaction for display
   */
  formatTransaction(tx: BlockscoutTransaction): {
    hash: string;
    type: 'send' | 'receive' | 'contract' | 'token_transfer';
    amount: string;
    token: string;
    from: string;
    to: string;
    timestamp: Date;
    status: 'success' | 'failed';
    gasUsed: string;
    gasPrice: string;
    method?: string;
  } {
    const isTokenTransfer = tx.token_transfers && tx.token_transfers.length > 0;
    const isContract = tx.to.is_contract;
    
    let type: 'send' | 'receive' | 'contract' | 'token_transfer' = 'send';
    let amount = '0';
    let token = 'ETH';
    
    if (isTokenTransfer) {
      type = 'token_transfer';
      const transfer = tx.token_transfers[0];
      amount = transfer.value;
      token = transfer.token.symbol;
    } else if (isContract) {
      type = 'contract';
      amount = tx.value;
    } else {
      type = parseFloat(tx.value) > 0 ? 'send' : 'receive';
      amount = tx.value;
    }
    
    return {
      hash: tx.hash,
      type,
      amount,
      token,
      from: tx.from.hash,
      to: tx.to.hash,
      timestamp: new Date(tx.timestamp),
      status: tx.status,
      gasUsed: tx.gas_used,
      gasPrice: tx.gas_price,
      method: tx.method,
    };
  }

  /**
   * Get chain name from chain ID
   */
  getChainName(): string {
    const chainNames: Record<SupportedChainId, string> = {
      '1': 'Ethereum',
      '10': 'Optimism',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '8453': 'Base',
      '43114': 'Avalanche',
      '56': 'BSC',
      '11155111': 'Ethereum Sepolia',
      '11155420': 'Optimism Sepolia',
      '80002': 'Polygon Amoy',
      '421614': 'Arbitrum Sepolia',
      '84532': 'Base Sepolia',
    };
    
    return chainNames[this.chainId] || `Chain ${this.chainId}`;
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(type: 'tx' | 'address' | 'block', hash: string): string {
    const baseExplorerUrl = this.baseUrl.replace('/api/v2', '');
    return `${baseExplorerUrl}/${type}s/${hash}`;
  }
}

// Factory function to create API service instances
export function createBlockscoutApi(chainId: SupportedChainId): BlockscoutApiService {
  return new BlockscoutApiService(chainId);
}

// Utility function to get all supported chain IDs
export function getSupportedChainIds(): SupportedChainId[] {
  return Object.keys(BLOCKSCOUT_ENDPOINTS) as SupportedChainId[];
}

// Utility function to check if chain is supported
export function isChainSupported(chainId: string): chainId is SupportedChainId {
  return chainId in BLOCKSCOUT_ENDPOINTS;
}
