"use client";

import React from "react";
import {
  NexusProvider,
  useNexus,
  TransferButton,
  BridgeButton,
  BridgeAndExecuteButton,
} from "@avail-project/nexus-widgets";
import { parseUnits } from "viem";

function WalletBridge() {
  const { setProvider } = useNexus();
  React.useEffect(() => {
    const eth = (typeof window !== "undefined" && (window as any).ethereum) || null;
    if (eth) setProvider(eth);
  }, [setProvider]);
  return null;
}

function NexusPanelContent() {
  const [recipient, setRecipient] = React.useState<string>('');
  const [amount, setAmount] = React.useState<string>('0.001');
  const [token, setToken] = React.useState<string>('USDC');
  const [sourceChain, setSourceChain] = React.useState<string>('ethereum');
  const [destinationChain, setDestinationChain] = React.useState<string>('optimism');
  const [chainId, setChainId] = React.useState<number>(11155420);
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const transferOpenRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    setIsClient(true);
    
    // Get params from URL
    const params = new URLSearchParams(window.location.search);
    const recipientParam = params.get('recipient');
    const amountParam = params.get('amount');
    const tokenParam = params.get('token');
    const chainIdParam = params.get('chainId');
    const sourceChainParam = params.get('sourceChain');
    const destinationChainParam = params.get('destinationChain');
    
    if (recipientParam && /^0x[0-9a-fA-F]{40}$/.test(recipientParam)) {
      setRecipient(recipientParam);
    }
    
    if (amountParam) {
      setAmount(amountParam);
    }
    
    if (tokenParam) {
      setToken(tokenParam);
    }
    
    if (sourceChainParam) {
      setSourceChain(sourceChainParam);
    }
    
    if (destinationChainParam) {
      setDestinationChain(destinationChainParam);
    }
    
    if (chainIdParam) {
      setChainId(parseInt(chainIdParam));
    }
    
    console.log('[Mail-Fi] URL params:', { recipientParam, amountParam, tokenParam, chainIdParam, sourceChainParam, destinationChainParam });
    
    // Auto-open transfer modal if params provided
    if (recipientParam && amountParam) {
      setAutoOpen(true);
      // Trigger after component mounts
      setTimeout(() => {
        transferOpenRef.current?.();
      }, 500);
    }
  }, []);
  
  return (
    <div style={{ 
      padding: 24, 
      fontFamily: "system-ui, -apple-system, sans-serif", 
      maxWidth: 500,
      margin: '0 auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        color: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Pay with Avail</h2>
        <p style={{ margin: '8px 0 0 0', fontSize: 14, opacity: 0.9 }}>Cross-chain USDC payment</p>
      </div>

      {recipient && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#1e40af', fontWeight: 600, marginBottom: 6 }}>
            SENDING TO
          </p>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'monospace', color: '#3b82f6', wordBreak: 'break-all' }}>
            {recipient}
          </p>
        </div>
      )}

      <div style={{
        background: '#f9fafb',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Amount</p>
        <p style={{ margin: 0, fontSize: 36, fontWeight: 700, color: '#111827' }}>{amount}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 600, color: '#7c3aed' }}>
          {isClient ? token : 'USDC'}
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#6b7280' }}>
          {isClient ? (() => {
            const sourceNames = {
              // Testnet
              'ethereum-sepolia': 'Ethereum Sepolia',
              'arbitrum-sepolia': 'Arbitrum Sepolia',
              'optimism-sepolia': 'Optimism Sepolia',
              'base-sepolia': 'Base Sepolia',
              'polygon-amoy': 'Polygon Amoy',
              // Mainnet
              'ethereum': 'Ethereum',
              'arbitrum': 'Arbitrum',
              'optimism': 'Optimism',
              'base': 'Base',
              'polygon': 'Polygon',
              'avalanche': 'Avalanche',
              'bsc': 'BSC'
            };
            
            const destNames = {
              // Testnet
              'ethereum-sepolia': 'Ethereum Sepolia',
              'arbitrum-sepolia': 'Arbitrum Sepolia',
              'optimism-sepolia': 'Optimism Sepolia',
              'base-sepolia': 'Base Sepolia',
              'polygon-amoy': 'Polygon Amoy',
              // Mainnet
              'ethereum': 'Ethereum',
              'arbitrum': 'Arbitrum',
              'optimism': 'Optimism',
              'base': 'Base',
              'polygon': 'Polygon',
              'avalanche': 'Avalanche',
              'bsc': 'BSC'
            };
            
            return `${sourceNames[sourceChain]} → ${destNames[destinationChain]}`;
          })() : 'Ethereum Sepolia → Optimism Sepolia'}
        </p>
      </div>

      <TransferButton
        prefill={{
          chainId: chainId,
          token: token,
          amount: amount || undefined,
          recipient: (recipient && /^0x[0-9a-fA-F]{40}$/.test(recipient)
            ? (recipient as `0x${string}`)
            : undefined),
        }}
        onSuccess={(result: any) => {
          console.log('[Mail-Fi] Transfer success:', result);
          
          // Extract transaction details for email snippet
          const transactionData = {
            txHash: result?.txHash || result?.transactionHash || result?.hash,
            intentId: result?.intentId || result?.intent?.id,
            explorerUrl: result?.explorerUrl || result?.intent?.explorerUrl,
            status: 'completed',
            timestamp: new Date().toISOString()
          };
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'MAILFI_PAYMENT_SUCCESS',
              data: transactionData
            }, '*');
            setTimeout(() => window.close(), 2000);
          }
        }}
      >
        {({ onClick, isLoading }) => {
          transferOpenRef.current = onClick;
          return (
            <button 
              onClick={onClick} 
              disabled={isLoading || !recipient}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: isLoading || !recipient ? 'not-allowed' : 'pointer',
                opacity: isLoading || !recipient ? 0.6 : 1
              }}
            >
              {isLoading ? "Processing…" : "Send Payment"}
            </button>
          );
        }}
      </TransferButton>
        <hr style={{ margin: "12px 0" }} />

        <div style={{ marginBottom: 8 }}>
          <h4 style={{ margin: "8px 0" }}>Bridge</h4>
          <BridgeButton
            prefill={{
              // Example prefill values; you can change these or accept from postMessage
              chainId: 421614,
              token: "USDC",
              amount: "1",
            }}
          >
            {({ onClick, isLoading }) => (
              <button
                onClick={onClick}
                disabled={isLoading}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                {isLoading ? "Bridging…" : "Bridge 1 USDC to Arbitrum Sepolia"}
              </button>
            )}
          </BridgeButton>
        </div>

        <div style={{ marginTop: 8 }}>
          <BridgeAndExecuteButton
            contractAddress="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"
            contractAbi={
              [
                {
                  name: "supply",
                  type: "function",
                  stateMutability: "nonpayable",
                  inputs: [
                    { name: "asset", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "onBehalfOf", type: "address" },
                    { name: "referralCode", type: "uint16" },
                  ],
                  outputs: [],
                },
              ] as const
            }
            functionName="supply"
            buildFunctionParams={(token, amount, chainId, userAddress) => {
              const decimals = (window as any).TOKEN_METADATA?.[token]?.decimals ?? 6;
              const amountWei = parseUnits(amount, decimals);
              const tokenAddress = (window as any).TOKEN_CONTRACT_ADDRESSES?.[token]?.[chainId];
              return {
                functionParams: [tokenAddress, amountWei, userAddress, 0],
              };
            }}
            prefill={{ toChainId: 421614, token: "USDC" }}
          >
            {({ onClick, isLoading, disabled }) => (
              <button
                onClick={onClick}
                disabled={isLoading || disabled}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                {isLoading ? "Processing…" : "Bridge & Supply to Aave"}
              </button>
            )}
          </BridgeAndExecuteButton>
        </div>
      </div>
  );
}

export default function NexusPanelPage() {
  return (
    <NexusProvider config={{ 
      network: "testnet", 
      debug: true,
      rpcUrls: {
        // Testnet chains - using the same RPC URLs as Nexus SDK
        11155111: "https://sepolia.drpc.org", // Ethereum Sepolia
        11155420: "https://opt-sepolia.g.alchemy.com/v2/PfaswrKq0rjOrfYWHfE9uLQKhiD4JCdq", // Optimism Sepolia
        421614: "https://arb-sepolia.g.alchemy.com/v2/PfaswrKq0rjOrfYWHfE9uLQKhiD4JCdq", // Arbitrum Sepolia
        84532: "https://base-sepolia.g.alchemy.com/v2/PfaswrKq0rjOrfYWHfE9uLQKhiD4JCdq", // Base Sepolia
        80002: "https://polygon-amoy.g.alchemy.com/v2/PfaswrKq0rjOrfYWHfE9uLQKhiD4JCdq", // Polygon Amoy
        // Mainnet chains - using the same RPC URLs as Nexus SDK
        1: "https://lb.drpc.org/ethereum/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Ethereum
        10: "https://lb.drpc.org/optimism/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Optimism
        42161: "https://lb.drpc.org/arbitrum/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Arbitrum
        8453: "https://lb.drpc.org/base/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Base
        137: "https://lb.drpc.org/polygon/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Polygon
        43114: "https://lb.drpc.org/avalanche/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE", // Avalanche
        56: "https://lb.drpc.org/bsc/Am5nENoJmEuovqui8_LMxzp4ChJzW7kR8JfPrqRhf0fE" // BSC
      }
    }}>
      <div className="min-h-screen bg-gray-50">
        <WalletBridge />
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <NexusPanelContent />
        </React.Suspense>
      </div>
    </NexusProvider>
  );
}