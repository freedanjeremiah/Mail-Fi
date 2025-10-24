'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import { escrowManager, EscrowData } from '@/lib/escrow-manager'

export default function EscrowPage() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [userEscrows, setUserEscrows] = useState<EscrowData[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create')

  useEffect(() => {
    if (publicKey) {
      loadUserEscrows()
    }
  }, [publicKey])

  const loadUserEscrows = () => {
    if (!publicKey) return
    const escrows = escrowManager.getUserEscrows(publicKey)
    setUserEscrows(escrows)
  }

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) return

    setLoading(true)
    setStatus({ message: 'Creating escrow...', type: 'info' })

    try {
      const escrowId = await escrowManager.createEscrow(
        publicKey,
        recipient,
        parseFloat(amount),
        parseInt(expiryDays),
        description
      )

      setStatus({
        message: `Escrow created successfully! ID: ${escrowId.substring(0, 16)}...`,
        type: 'success'
      })

      setRecipient('')
      setAmount('')
      setDescription('')
      loadUserEscrows()
      setActiveTab('manage')
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFundEscrow = async (escrowId: string) => {
    if (!publicKey) return

    setLoading(true)
    setStatus({ message: 'Funding escrow...', type: 'info' })

    try {
      const signature = await escrowManager.fundEscrow(
        connection,
        escrowId,
        { publicKey },
        sendTransaction
      )

      setStatus({
        message: `Escrow funded successfully! TX: ${signature.substring(0, 16)}...`,
        type: 'success'
      })

      loadUserEscrows()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEscrow = (escrowId: string) => {
    if (!publicKey) return

    try {
      escrowManager.cancelEscrow(escrowId, publicKey)
      setStatus({ message: 'Escrow cancelled successfully!', type: 'success' })
      loadUserEscrows()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    }
  }

  const handleMarkClaimed = (escrowId: string) => {
    if (!publicKey) return

    try {
      escrowManager.markClaimed(escrowId, publicKey)
      setStatus({ message: 'Escrow marked as claimed!', type: 'success' })
      loadUserEscrows()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">💸 PYUSD Manifesto - Escrow</h1>
          <p className="text-xl text-purple-200">Create payment requests with escrow protection</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center">
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
            <Link href="/staking" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Staking
            </Link>
              Multisig
            </Link>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>

        {publicKey && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('create')}
                className={`pb-3 px-4 font-semibold ${activeTab === 'create' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              >
                Create Escrow
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`pb-3 px-4 font-semibold ${activeTab === 'manage' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
              >
                Manage Escrows ({userEscrows.length})
              </button>
            </div>

            {activeTab === 'create' ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Create Payment Request (Escrow)</h2>
                <p className="text-gray-600 mb-6">
                  Create a payment request with escrow protection. Funds are transferred directly once you fund the escrow.
                </p>

                <form onSubmit={handleCreateEscrow}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Recipient Wallet Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Enter recipient's wallet address"
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
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="7"
                  min="1"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Payment for services..."
                  rows={3}
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

            {status && (
              <div className={`mt-6 p-4 rounded-lg ${
                status.type === 'success' ? 'bg-green-100 text-green-800' :
                status.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {status.message}
              </div>
            )}

                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">How Escrow Works:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Create an escrow with recipient address, amount, and expiry date</li>
                    <li>Fund the escrow - PYUSD is sent directly to recipient</li>
                    <li>Track status in "Manage Escrows" tab</li>
                    <li>After expiry, unfunded escrows can be cancelled</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Your Escrows</h2>

                {userEscrows.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No escrows yet. Create one to get started!</p>
                ) : (
                  <div className="space-y-4">
                    {userEscrows.map((escrow) => (
                      <div key={escrow.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-lg">{escrow.amount} PYUSD</div>
                            <div className="text-sm text-gray-600">{escrow.description}</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            escrow.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                            escrow.status === 'funded' ? 'bg-green-100 text-green-800' :
                            escrow.status === 'claimed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {escrow.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Recipient:</span><br/>
                            {escrow.recipient.substring(0, 8)}...{escrow.recipient.substring(escrow.recipient.length - 8)}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span><br/>
                            {new Date(escrow.expiryTime).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {escrow.status === 'created' && escrow.creator === publicKey.toString() && (
                            <>
                              <button
                                onClick={() => handleFundEscrow(escrow.id)}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                              >
                                Fund Escrow
                              </button>
                              {Date.now() > escrow.expiryTime && (
                                <button
                                  onClick={() => handleCancelEscrow(escrow.id)}
                                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          )}
                          {escrow.status === 'funded' && escrow.recipient === publicKey.toString() && Date.now() < escrow.expiryTime && (
                            <button
                              onClick={() => handleMarkClaimed(escrow.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Mark as Claimed
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
