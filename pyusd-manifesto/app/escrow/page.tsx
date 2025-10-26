'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import {
  createEscrow,
  fundEscrow,
  claimEscrow,
  cancelEscrow,
  getAllUserEscrows
} from '@/lib/contracts/escrow'
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { WalletDebug } from '@/components/WalletDebug'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export default function EscrowPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [userEscrows, setUserEscrows] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')
  const [pyusdBalance, setPyusdBalance] = useState<number>(0)

  useEffect(() => {
    if (!publicKey || !wallet.connected) {
      return
    }

    const timer = setTimeout(() => {
      loadUserEscrows()
      loadPYUSDBalance()
    }, 200)

    return () => clearTimeout(timer)
  }, [publicKey, wallet.connected, connection])

  const loadPYUSDBalance = async () => {
    if (!publicKey || !wallet.connected) return
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: PYUSD_MINT,
        programId: TOKEN_2022_PROGRAM_ID
      })
      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
        setPyusdBalance(balance || 0)
      }
    } catch (error) {
      console.error('Error loading PYUSD balance:', error)
    }
  }

  const loadUserEscrows = async () => {
    // This is only called when publicKey exists (from useEffect check)
    if (!publicKey || !wallet.connected) {
      console.log('Wallet not connected, skipping escrow load')
      return
    }
    
    console.log('Loading escrows for wallet:', publicKey.toBase58())

    setLoading(true)
    try {
      const escrows = await getAllUserEscrows(connection, wallet)
      setUserEscrows(escrows)
    } catch (error: any) {
      console.error('Error loading escrows:', error)
      // Silently fail if wallet not ready, otherwise show error
      if (!error.message?.includes('Wallet is not connected')) {
        setStatus({ message: `Error: ${error.message}`, type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if wallet is connected
    if (!publicKey || !wallet.connected) {
      setStatus({ message: 'Please connect your wallet first', type: 'error' })
      return
    }
    
    console.log('Creating escrow with wallet:', publicKey.toBase58())

    if (!recipient || !amount) {
      setStatus({ message: 'Please fill in all fields', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ message: 'Creating escrow on-chain...', type: 'info' })

    try {
      const recipientPubkey = new PublicKey(recipient)

      const { escrowPDA, signature } = await createEscrow(
        connection,
        wallet,
        parseFloat(amount),
        recipientPubkey,
        parseInt(expiryDays),
        description
      )

      await connection.confirmTransaction(signature, 'confirmed')

      setStatus({
        message: `Escrow created! View: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setRecipient('')
      setAmount('')
      setDescription('')
      await loadUserEscrows()
      setActiveTab('manage')
    } catch (error: any) {
      console.error('Create escrow error:', error)
      setStatus({ message: `${error.message || 'Failed to create escrow'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFundEscrow = async (escrowPDA: string) => {
    if (!publicKey || !wallet.connected) {
      setStatus({ message: 'Wallet not connected', type: 'error' })
      return
    }
    
    console.log('Funding escrow with wallet:', publicKey.toBase58())

    setLoading(true)
    setStatus({ message: 'Funding escrow...', type: 'info' })

    try {
      const signature = await fundEscrow(connection, wallet, new PublicKey(escrowPDA))

      await connection.confirmTransaction(signature, 'confirmed')

      setStatus({
        message: `Escrow funded! View: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      await loadUserEscrows()
      await loadPYUSDBalance()
    } catch (error: any) {
      console.error('Fund escrow error:', error)
      setStatus({ message: `${error.message || 'Failed to fund escrow'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimEscrow = async (escrowPDA: string) => {
    if (!publicKey) {
      setStatus({ message: 'Wallet not connected', type: 'error' })
      return
    }
    
    console.log('Claiming escrow with wallet:', publicKey.toBase58())

    setLoading(true)
    setStatus({ message: 'Claiming escrow...', type: 'info' })

    try {
      const signature = await claimEscrow(connection, wallet, new PublicKey(escrowPDA))

      await connection.confirmTransaction(signature, 'confirmed')

      setStatus({
        message: `Escrow claimed! View: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      await loadUserEscrows()
      await loadPYUSDBalance()
    } catch (error: any) {
      console.error('Claim escrow error:', error)
      setStatus({ message: `${error.message || 'Failed to claim escrow'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEscrow = async (escrowPDA: string) => {
    if (!publicKey) {
      setStatus({ message: 'Wallet not connected', type: 'error' })
      return
    }
    
    console.log('Cancelling escrow with wallet:', publicKey.toBase58())
    
    if (!confirm('Cancel this escrow and get refund?')) return

    setLoading(true)
    setStatus({ message: 'Cancelling escrow...', type: 'info' })

    try {
      const signature = await cancelEscrow(connection, wallet, new PublicKey(escrowPDA))

      await connection.confirmTransaction(signature, 'confirmed')

      setStatus({
        message: `Escrow cancelled! View: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      await loadUserEscrows()
      await loadPYUSDBalance()
    } catch (error: any) {
      console.error('Cancel escrow error:', error)
      setStatus({ message: `${error.message || 'Failed to cancel escrow'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-black">
      <WalletDebug />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Escrow Payments</h1>
          <p className="text-xl text-purple-200">Secure PYUSD payments with time locks</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Send PYUSD
            </Link>
            <Link href="/escrow" className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Escrow
            </Link>
            <Link href="/recurring" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Recurring
            </Link>
            <Link href="/multisig" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Multisig
            </Link>
            <Link href="/yield-farming" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Yield Farming
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center mb-4">
            <WalletButton />
          </div>
          {publicKey && (
            <div className="text-center text-sm text-gray-600">
              PYUSD Balance: {pyusdBalance.toFixed(2)} PYUSD
            </div>
          )}
        </div>

        {publicKey && (
          <>
            <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    activeTab === 'create'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Create Escrow
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${
                    activeTab === 'manage'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Manage Escrows ({userEscrows.length})
                </button>
              </div>

              {activeTab === 'create' ? (
                <form onSubmit={handleCreateEscrow}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Recipient Address</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Enter recipient wallet address"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Amount (PYUSD)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Expiry (Days)</label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Payment for services..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Creating...' : 'Create Escrow'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {userEscrows.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No escrows found</p>
                  ) : (
                    userEscrows.map((escrow, idx) => {
                      const isCreator = escrow.account.creator.equals(publicKey)
                      const isRecipient = escrow.account.recipient.equals(publicKey)
                      const isFunded = escrow.account.funded
                      const isClaimed = escrow.account.claimed
                      const isExpired = Date.now() / 1000 > escrow.account.expiryTime.toNumber()

                      return (
                        <div key={idx} className="bg-gray-50 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{escrow.account.description}</h3>
                              <p className="text-sm text-gray-600">
                                Amount: {escrow.account.amount.toNumber() / 1e6} PYUSD
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {isFunded && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Funded</span>}
                              {isClaimed && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Claimed</span>}
                              {isExpired && <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">Expired</span>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Creator:</span>
                              <p className="font-mono text-xs">{escrow.account.creator.toBase58().substring(0, 16)}...</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Recipient:</span>
                              <p className="font-mono text-xs">{escrow.account.recipient.toBase58().substring(0, 16)}...</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Expires:</span>
                              <p>{new Date(escrow.account.expiryTime.toNumber() * 1000).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <p>{isClaimed ? 'Claimed' : isFunded ? 'Funded' : 'Pending'}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {isCreator && !isFunded && !isClaimed && (
                              <button
                                onClick={() => handleFundEscrow(escrow.publicKey.toBase58())}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                Fund Escrow
                              </button>
                            )}
                            {isRecipient && isFunded && !isClaimed && !isExpired && (
                              <button
                                onClick={() => handleClaimEscrow(escrow.publicKey.toBase58())}
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                Claim Escrow
                              </button>
                            )}
                            {isCreator && isExpired && isFunded && !isClaimed && (
                              <button
                                onClick={() => handleCancelEscrow(escrow.publicKey.toBase58())}
                                disabled={loading}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel & Refund
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {status && (
              <div className={`p-4 rounded-lg ${
                status.type === 'success' ? 'bg-green-100 text-green-800' :
                status.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {status.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
