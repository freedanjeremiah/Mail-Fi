import { NextRequest, NextResponse } from 'next/server';
import { createBlockscoutApi, isChainSupported, SupportedChainId } from '../../../lib/blockscout-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId') as SupportedChainId;
    const action = searchParams.get('action');
    const address = searchParams.get('address');
    const txHash = searchParams.get('txHash');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!chainId || !isChainSupported(chainId)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported chain ID' },
        { status: 400 }
      );
    }

    const api = createBlockscoutApi(chainId);

    switch (action) {
      case 'transactions':
        if (!address) {
          return NextResponse.json(
            { error: 'Address is required for transactions' },
            { status: 400 }
          );
        }
        const transactions = await api.getAddressTransactions(address, {
          page,
          limit,
          filter: (searchParams.get('filter') as any) || 'all',
          type: (searchParams.get('type') as any) || 'all',
        });
        return NextResponse.json(transactions);

      case 'address':
        if (!address) {
          return NextResponse.json(
            { error: 'Address is required' },
            { status: 400 }
          );
        }
        const addressInfo = await api.getAddress(address);
        return NextResponse.json(addressInfo);

      case 'token-balances':
        if (!address) {
          return NextResponse.json(
            { error: 'Address is required for token balances' },
            { status: 400 }
          );
        }
        const balances = await api.getTokenBalances(address);
        return NextResponse.json(balances);

      case 'transaction':
        if (!txHash) {
          return NextResponse.json(
            { error: 'Transaction hash is required' },
            { status: 400 }
          );
        }
        const transaction = await api.getTransaction(txHash);
        return NextResponse.json(transaction);

      case 'transaction-logs':
        if (!txHash) {
          return NextResponse.json(
            { error: 'Transaction hash is required' },
            { status: 400 }
          );
        }
        const logs = await api.getTransactionLogs(txHash);
        return NextResponse.json(logs);

      case 'internal-transactions':
        if (!txHash) {
          return NextResponse.json(
            { error: 'Transaction hash is required' },
            { status: 400 }
          );
        }
        const internalTxs = await api.getInternalTransactions(txHash);
        return NextResponse.json(internalTxs);

      case 'search':
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json(
            { error: 'Search query is required' },
            { status: 400 }
          );
        }
        const searchResults = await api.search(query);
        return NextResponse.json(searchResults);

      case 'stats':
        const stats = await api.getChainStats();
        return NextResponse.json(stats);

      case 'token-info':
        const tokenAddress = searchParams.get('tokenAddress');
        if (!tokenAddress) {
          return NextResponse.json(
            { error: 'Token address is required' },
            { status: 400 }
          );
        }
        const tokenInfo = await api.getTokenInfo(tokenAddress);
        return NextResponse.json(tokenInfo);

      case 'block':
        const blockNumber = searchParams.get('blockNumber');
        if (!blockNumber) {
          return NextResponse.json(
            { error: 'Block number is required' },
            { status: 400 }
          );
        }
        const block = await api.getBlock(parseInt(blockNumber));
        return NextResponse.json(block);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: transactions, address, token-balances, transaction, transaction-logs, internal-transactions, search, stats, token-info, block' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blockscout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chainId, action, data } = body;

    if (!chainId || !isChainSupported(chainId)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported chain ID' },
        { status: 400 }
      );
    }

    const api = createBlockscoutApi(chainId);

    switch (action) {
      case 'format-transaction':
        if (!data.transaction) {
          return NextResponse.json(
            { error: 'Transaction data is required' },
            { status: 400 }
          );
        }
        const formatted = api.formatTransaction(data.transaction);
        return NextResponse.json(formatted);

      case 'get-explorer-url':
        if (!data.type || !data.hash) {
          return NextResponse.json(
            { error: 'Type and hash are required' },
            { status: 400 }
          );
        }
        const explorerUrl = api.getExplorerUrl(data.type, data.hash);
        return NextResponse.json({ url: explorerUrl });

      default:
        return NextResponse.json(
          { error: 'Invalid action for POST request' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blockscout API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
