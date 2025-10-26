"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getInvestmentEscrowAddress, getInvestmentEscrowABI, getUSDCAddress } from '../../lib/contract-config';
import {
  NexusProvider,
  useNexus,
  TransferButton,
} from "@avail-project/nexus-widgets";

interface InvestmentInterfaceProps {
  initialProjectId?: string;
  initialContractAddress?: string;
  initialProjectName?: string;
  initialEquityOffered?: string;
  initialValuation?: string;
  initialMinInvestment?: string;
  initialMaxInvestment?: string;
  initialDeadline?: string;
  initialCategory?: string;
  initialDescription?: string;
  initialCorrelationId?: string;
}

// Wallet Bridge Component for Nexus
function WalletBridge() {
  const { setProvider } = useNexus();
  React.useEffect(() => {
    const eth = (typeof window !== "undefined" && (window as any).ethereum) || null;
    if (eth) setProvider(eth);
  }, [setProvider]);
  return null;
}

export function InvestmentInterface({
  initialProjectId,
  initialContractAddress,
  initialProjectName,
  initialEquityOffered,
  initialValuation,
  initialMinInvestment,
  initialMaxInvestment,
  initialDeadline,
  initialCategory,
  initialDescription,
  initialCorrelationId
}: InvestmentInterfaceProps) {
  const { address: userAddress, chainId } = useAccount();
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [contractAddress, setContractAddress] = useState<`0x${string}` | undefined>(undefined);
  const [usdcAddress, setUsdcAddress] = useState<`0x${string}` | undefined>(undefined);
  const [projectDetails, setProjectDetails] = useState<any>(null);

  // Set contract address for Base Sepolia
  useEffect(() => {
    const network = 'base-sepolia';
    const escrowAddr = getInvestmentEscrowAddress(network);
    
    if (escrowAddr) {
      setContractAddress(escrowAddr as `0x${string}`);
    }
  }, []);

  // Fetch project details from contract
  const { data: fetchedProject, isLoading: isLoadingProjectData, refetch: refetchProject } = useReadContract({
    address: contractAddress,
    abi: getInvestmentEscrowABI(),
    functionName: 'getProject',
    args: projectId ? [BigInt(projectId)] : undefined,
    query: {
      enabled: !!contractAddress && !!projectId && projectId !== '',
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  useEffect(() => {
    if (fetchedProject) {
      setProjectDetails({
        founder: fetchedProject.founder,
        targetRaise: formatUnits(fetchedProject.targetRaise, 6), // USDC has 6 decimals
        totalInvested: formatUnits(fetchedProject.totalInvested, 6),
        deadline: Number(fetchedProject.deadline) * 1000, // Convert to milliseconds
        valuation: formatUnits(fetchedProject.valuation, 6),
        equityOffered: Number(fetchedProject.equityOffered),
        minInvestment: formatUnits(fetchedProject.minInvestment, 6),
        maxInvestment: formatUnits(fetchedProject.maxInvestment, 6),
        released: fetchedProject.released,
        status: Number(fetchedProject.status), // 0=Pending, 1=Approved, 2=Rejected, 3=Released, 4=Refunded
        name: fetchedProject.name,
        description: fetchedProject.description,
        category: fetchedProject.category,
        imageUrl: fetchedProject.imageUrl,
      });
    }
  }, [fetchedProject]);

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      case 3: return 'Released';
      case 4: return 'Refunded';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#f59e0b'; // Yellow for pending
      case 1: return '#10b981'; // Green for approved
      case 2: return '#ef4444'; // Red for rejected
      case 3: return '#3b82f6'; // Blue for released
      case 4: return '#6b7280'; // Gray for refunded
      default: return '#6b7280';
    }
  };

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
      <WalletBridge />
      <div style={{ 
        minHeight: '100vh',
        background: '#ffffff',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#000000',
        lineHeight: '1.6'
      }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        padding: '32px 0'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: '28px' }}>📈</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '400',
            margin: '0 0 8px 0',
            color: '#000000',
            letterSpacing: '-0.02em'
          }}>
            Investment Opportunity
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666666',
            margin: '0',
            fontWeight: '300'
          }}>
            Invest in promising startups through Mail-Fi
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{ 
          minHeight: '100vh',
          background: '#ffffff',
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#000000',
          lineHeight: '1.6'
        }}>

        {/* Project Details */}
        {projectDetails ? (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            animation: 'slideIn 0.5s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '500',
                margin: '0',
                color: '#000000'
              }}>
                {projectDetails.name || initialProjectName || 'Investment Project'}
              </h2>
              <div style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: getStatusColor(projectDetails.status),
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase'
              }}>
                {getStatusText(projectDetails.status)}
              </div>
            </div>

            <p style={{
              fontSize: '16px',
              color: '#666666',
              margin: '0 0 20px 0',
              lineHeight: '1.5'
            }}>
              {projectDetails.description || initialDescription || 'No description available.'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Target Raise
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {projectDetails.targetRaise} USDC
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Raised
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  {projectDetails.totalInvested} USDC
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Equity Offered
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {projectDetails.equityOffered}%
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Valuation
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {projectDetails.valuation} USDC
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Min Investment
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {projectDetails.minInvestment} USDC
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Max Investment
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {projectDetails.maxInvestment} USDC
                </p>
              </div>

              <div style={{
                background: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '12px',
                  color: '#666666',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  Deadline
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  {new Date(projectDetails.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : isLoadingProjectData ? (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e5e5',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ margin: '0', color: '#666666' }}>Loading project details...</p>
          </div>
        ) : (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '500',
              margin: '0 0 12px 0',
              color: '#000000'
            }}>
              {initialProjectName || 'Investment Project'}
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#666666',
              margin: '0 0 16px 0'
            }}>
              {initialDescription || 'No description available.'}
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {initialEquityOffered && (
                <span style={{
                  padding: '6px 12px',
                  background: '#e0f2fe',
                  color: '#0277bd',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {initialEquityOffered}% Equity
                </span>
              )}
              {initialValuation && (
                <span style={{
                  padding: '6px 12px',
                  background: '#f3e8ff',
                  color: '#7c3aed',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {initialValuation} Valuation
                </span>
              )}
              {initialCategory && (
                <span style={{
                  padding: '6px 12px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {initialCategory}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Investment Form with Nexus */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '500',
            margin: '0 0 20px 0',
            color: '#000000'
          }}>
            Make Investment
          </h3>

          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{
              margin: '0',
              color: '#1e40af',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              💡 You can invest from any chain! Avail Nexus will bridge your USDC to Base Sepolia automatically.
            </p>
          </div>

          <TransferButton
            prefill={{
              chainId: 84532, // Base Sepolia - where the investment contract is
              token: "USDC",
              amount: projectDetails?.minInvestment || "1", // Default to minimum investment
              recipient: contractAddress as `0x${string}`, // Investment contract address
            }}
            onSuccess={(result: any) => {
              console.log('[Mail-Fi] Investment success:', result);
              
              // Extract transaction details for email snippet
              const transactionData = {
                txHash: result?.txHash || result?.transactionHash || result?.hash,
                intentId: result?.intentId || result?.intent?.id,
                explorerUrl: result?.explorerUrl || result?.intent?.explorerUrl,
                status: 'completed',
                timestamp: new Date().toISOString(),
                projectId: projectId,
                amount: projectDetails?.minInvestment || "1"
              };
              
              if (window.opener) {
                window.opener.postMessage({
                  type: 'MAILFI_INVESTMENT_SUCCESS',
                  data: transactionData
                }, '*');
                setTimeout(() => window.close(), 2000);
              }
            }}
          >
            {({ onClick, isLoading }) => (
              <button 
                onClick={onClick} 
                disabled={isLoading || !contractAddress}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: isLoading 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isLoading || !contractAddress ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !contractAddress ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isLoading 
                    ? 'none' 
                    : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transform: isLoading ? 'scale(0.98)' : 'scale(1)',
                  animation: isLoading ? 'pulse 1.5s infinite' : 'none'
                }}
                onMouseOver={(e) => {
                  if (!isLoading && contractAddress) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading && contractAddress) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span>Processing Investment...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '18px' }}>📈</span>
                      <span>Invest with Avail Nexus</span>
                    </>
                  )}
                </div>
              </button>
            )}
          </TransferButton>

          {projectDetails && (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '16px'
            }}>
              <p style={{
                margin: '0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                💡 Investment will be sent to: {contractAddress?.slice(0, 10)}...{contractAddress?.slice(-8)} on Base Sepolia
                <br />
                Minimum: {projectDetails.minInvestment} USDC
                {projectDetails.maxInvestment !== '0' && ` • Maximum: ${projectDetails.maxInvestment} USDC`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          marginTop: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            <p style={{
              margin: '0',
              fontSize: '14px',
              color: '#666666',
              fontWeight: '500'
            }}>
              Powered by Mail-Fi Investment Escrow
            </p>
          </div>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            Secure investment platform with smart contract escrow
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </NexusProvider>
  );
}
