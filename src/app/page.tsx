'use client';

import React, { useState, useEffect } from 'react';
import { useHybridWallet } from './components/hybrid-wallet-provider';

export default function SetupGuide() {
  const [isClient, setIsClient] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { 
    isLoggedIn, 
    user, 
    logout, 
    error
  } = useHybridWallet();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsLoading(true);
      setMessage('');
      
      try {
        // Simulate sending magic link
        console.log('[Mail-Fi] Sending magic link to:', email);
        
        // Show success message
        setMessage(`Magic link sent to ${email}! Check your inbox and click the link to complete setup.`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        setMessage('Failed to send magic link. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Prevent hydration mismatch by not rendering until client
  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ fontSize: '18px', color: '#666666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#000000',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        padding: '40px 0'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#000000',
            letterSpacing: '-0.02em'
          }}>
            ChainInbox Setup Guide
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#333333',
            margin: '0',
            fontWeight: '500'
          }}>
            Transform your Gmail into a crypto wallet in 2 simple steps
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Overview */}
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: '#000000'
          }}>
            What is ChainInbox?
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#000000',
            margin: '0 0 20px 0',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            Mail-Fi is a Chrome extension that enables crypto payments directly in Gmail. 
            Send USDC, ETH, and other tokens to anyone with just their email address.
          </p>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            padding: '20px',
            fontSize: '14px',
            color: '#000000',
            fontWeight: '600'
          }}>
            <strong>How it works:</strong> Add recipient's Ethereum address to the "To" field, 
            specify amount and token in the subject line, click "Pay with Avail" button, 
            and complete the cross-chain payment using Avail Nexus.
          </div>
        </div>

        {/* Step 1: Email Setup */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '32px',
          display: 'flex',
          gap: '40px',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '500',
                marginRight: '16px'
              }}>
                1
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                margin: '0',
                color: '#000000'
              }}>
                Create Email Wallet
              </h3>
            </div>
            
            <p style={{
              fontSize: '16px',
              color: '#333333',
              margin: '0 0 24px 0',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              Enter your email address to create a crypto wallet. We'll send you a magic link to authenticate.
            </p>

            {!isLoggedIn ? (
              <form onSubmit={handleEmailSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      opacity: isLoading ? 0.6 : 1,
                      color: '#000000',
                      backgroundColor: '#ffffff',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#000000';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#9ca3af' : '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = '#333333';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = '#000000';
                    }
                  }}
                >
                  {isLoading ? 'Sending Magic Link...' : 'Create Email Wallet'}
                </button>
                
                {message && (
                  <div style={{
                    background: message.includes('sent') ? '#f0f9ff' : '#fef2f2',
                    border: `1px solid ${message.includes('sent') ? '#0ea5e9' : '#fca5a5'}`,
                    borderRadius: '6px',
                    padding: '16px',
                    fontSize: '14px',
                    color: message.includes('sent') ? '#0c4a6e' : '#dc2626',
                    marginBottom: '20px'
                  }}>
                    {message}
                  </div>
                )}
                
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  padding: '16px',
                  fontSize: '14px',
                  color: '#333333',
                  fontWeight: '500'
                }}>
                  <strong>Note:</strong> You'll receive a magic link in your email to complete the setup.
                </div>
              </form>
            ) : (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#0c4a6e',
                      marginBottom: '4px'
                    }}>
                      ✓ Email Wallet Created
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#0c4a6e'
                    }}>
                      {user?.email}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Extension Installation */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '40px',
          display: 'flex',
          gap: '40px',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#000000',
                color: '#ffffff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '500',
                marginRight: '16px'
              }}>
                2
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                margin: '0',
                color: '#000000'
              }}>
                Install Gmail Extension
              </h3>
            </div>
            
            <p style={{
              fontSize: '16px',
              color: '#333333',
              margin: '0 0 24px 0',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              Add the Mail-Fi extension to Chrome to enable crypto payments directly in Gmail.
            </p>

            <button
              onClick={() => {
                // Show instructions for manual installation
                const instructions = `To install the Mail-Fi extension:\n\n1. Open Chrome and go to chrome://extensions/\n2. Enable "Developer mode" in the top right\n3. Click "Load unpacked"\n4. Navigate to the project folder and select the "dist/extension" directory\n5. The Mail-Fi extension will be installed!\n\nNote: The extension files are located in the dist/extension folder of this project.`;
                
                alert(instructions);
              }}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '14px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#333333';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#000000';
              }}
            >
              📋 Install Extension Instructions
            </button>

            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '6px',
              padding: '16px',
              fontSize: '14px',
              color: '#333333',
              fontWeight: '500'
            }}>
              <strong>Quick Setup:</strong> Click the button above to get installation instructions, 
              then follow the simple process to add Mail-Fi to Chrome.
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '40px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 20px 0',
            color: '#000000'
          }}>
            How to Use Mail-Fi
          </h3>
          
          <div style={{
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  color: '#000000'
                }}>
                  1. Compose Email
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#333333',
                  margin: '0 0 12px 0',
                  fontWeight: '500'
                }}>
                  In Gmail, add the recipient's Ethereum address to the "To" field
                </p>
                <div style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: '400'
                }}>
                  0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  color: '#000000'
                }}>
                  2. Add Subject Line
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#333333',
                  margin: '0 0 12px 0',
                  fontWeight: '500'
                }}>
                  Include amount, token, and chain information in the subject
                </p>
                <div style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: '400'
                }}>
                  0.001 USDC from ethereum sepolia to optimism sepolia
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                padding: '20px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  color: '#000000'
                }}>
                  3. Click "Pay with Avail"
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#333333',
                  margin: '0',
                  fontWeight: '500'
                }}>
                  The extension will show a "Pay with Avail" button. Click it to complete the payment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Chains */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '32px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: '#000000'
          }}>
            Available for All Supported Chains Through Avail
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#333333',
            margin: '0 0 32px 0',
            fontWeight: '500',
            lineHeight: '1.6'
          }}>
            Mail-Fi supports cross-chain transactions across multiple networks, enabling seamless crypto payments 
            through Gmail with the power of Avail's Nexus protocol.
          </p>
          
          {/* Transaction Examples - Images */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Image 1 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 19.52.12_36588b70.jpg"
                alt="Cross-chain investment transaction"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 2 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 19.53.51_381e14d8.jpg"
                alt="Transferring complete transaction"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 3 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 19.58.55_70bf88f8.jpg"
                alt="Nexus widget transaction"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 4 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 20.03.53_5d9b874b.jpg"
                alt="Transferring complete to Base Sepolia"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 5 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 20.38.35_8b184d80.jpg"
                alt="Insufficient balance error"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 6 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-25 at 20.47.59_4e634f8a.jpg"
                alt="USDC to BNB Smart Chain transaction"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image 7 */}
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <img 
                src="/images/WhatsApp Image 2025-10-26 at 14.50.54_6dd09277.jpg"
                alt="USDC to Base Sepolia transaction"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          {/* Supported Networks */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: '#0c4a6e'
            }}>
              Supported Networks
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {['Ethereum Sepolia', 'Base Sepolia', 'Optimism Sepolia', 'Polygon', 'BNB Smart Chain', 'Avalanche'].map((chain) => (
                <div key={chain} style={{
                  background: '#ffffff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#0c4a6e'
                }}>
                  {chain}
                </div>
              ))}
            </div>
          </div>

          {/* Powered by Avail */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '16px',
            fontWeight: '500',
            color: '#333333'
          }}>
            <span>Powered by</span>
            <div style={{
              background: '#000000',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '700'
            }}>
              Avail Nexus
            </div>
          </div>
        </div>

        {/* Ready to Use */}
        {isLoggedIn && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 12px 0',
              color: '#0c4a6e'
            }}>
              Setup Complete!
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#0c4a6e',
              margin: '0 0 24px 0',
              fontWeight: '500'
            }}>
              Your Gmail wallet is ready. Start making crypto payments!
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => window.open('/nexus-panel', '_blank')}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#333333';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#000000';
                }}
              >
                Test Payment
              </button>
              <button
                onClick={() => window.open('https://gmail.com', '_blank')}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                Go to Gmail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}