'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import {
  createMultisig,
  proposeTransaction,
  approveTransaction,
  executeTransaction,
  rejectTransaction,
  getAllUserMultisigs
} from '@/lib/contracts/multisig'

interface Multisig {
  publicKey: PublicKey
  creator: PublicKey
  owners: PublicKey[]
  threshold: number
  transactionCount: number
  createdAt: number
}

interface MultisigTransaction {
  publicKey: PublicKey
  multisig: PublicKey
  recipient: PublicKey
  amount: number
  transactionIndex: number
  approvals: PublicKey[]
  executed: boolean
  proposer: PublicKey
  createdAt: number
  description: string
}

export default function MultisigPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  const [owners, setOwners] = useState(['', ''])
  const [threshold, setThreshold] = useState('2')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [multisigs, setMultisigs] = useState<Multisig[]>([])
  const [loadingMultisigs, setLoadingMultisigs] = useState(false)
  const [selectedMultisig, setSelectedMultisig] = useState<PublicKey | null>(null)
  const [txRecipient, setTxRecipient] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txDescription, setTxDescription] = useState('')

  useEffect(() => {
    if (!publicKey || !wallet.connected) {
      return
    }

    const timer = setTimeout(() => {
      loadMultisigs()
    }, 150)

    return () => clearTimeout(timer)
  }, [publicKey, wallet.connected, connection])

  const loadMultisigs = async () => {
    if (!publicKey || !wallet.connected) return

    setLoadingMultisigs(true)
    try {
      const userMultisigs = await getAllUserMultisigs(connection, wallet)
      setMultisigs(userMultisigs)
    } catch (error) {
      console.error('Error loading multisigs:', error)
    } finally {
      setLoadingMultisigs(false)
    }
  }

  const addOwner = () => {
    if (owners.length < 10) {
      setOwners([...owners, ''])
    }
  }

  const removeOwner = (index: number) => {
    setOwners(owners.filter((_, i) => i !== index))
  }

  const updateOwner = (index: number, value: string) => {
    const newOwners = [...owners]
    newOwners[index] = value
    setOwners(newOwners)
  }

  const handleCreateMultisig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !wallet) return

    setLoading(true)
    setStatus({ message: 'Creating multisig wallet...', type: 'info' })

    try {
      const ownerPubkeys = owners.map(owner => new PublicKey(owner))
      const thresholdNum = parseInt(threshold)

      const { multisigPDA, signature } = await createMultisig(
        connection,
        wallet,
        ownerPubkeys,
        thresholdNum
      )

      setStatus({
        message: `Multisig wallet created! View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setOwners(['', ''])
      setThreshold('2')
      setTimeout(loadMultisigs, 2000)
    } catch (error: any) {
      console.error('Error creating multisig:', error)
      setStatus({ message: error.message || 'Failed to create multisig', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleProposeTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !wallet || !selectedMultisig) return

    setLoading(true)
    setStatus({ message: 'Proposing transaction...', type: 'info' })

    try {
      const recipientPubkey = new PublicKey(txRecipient)
      const amountNum = parseFloat(txAmount)

      const { transactionPDA, signature } = await proposeTransaction(
        connection,
        wallet,
        selectedMultisig,
        amountNum,
        recipientPubkey,
        txDescription
      )

      setStatus({
        message: `Transaction proposed! View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setTxRecipient('')
      setTxAmount('')
      setTxDescription('')
    } catch (error: any) {
      console.error('Error proposing transaction:', error)
      setStatus({ message: error.message || 'Failed to propose transaction', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">PYUSD Manifesto - Multisig Wallet</h1>
          <p className="text-xl text-purple-200">Create multi-signature wallets for secure transactions</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Send PYUSD
            </Link>
            <Link href="/escrow" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Escrow
            </Link>
            <Link href="/recurring" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Recurring
            </Link>
            <Link href="/multisig" className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Multisig
            </Link>
            <Link href="/yield-farming" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Yield Farming
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>

        {publicKey && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Create Multisig Wallet</h2>
            <p className="text-gray-600 mb-6">
              Create a wallet that requires multiple signatures to approve transactions. Perfect for businesses and shared accounts.
            </p>

            <form onSubmit={handleCreateMultisig}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Wallet Owners</label>
                  <button
                    type="button"
                    onClick={addOwner}
                    disabled={owners.length >= 10}
                    className="text-sm text-purple-600 hover:text-purple-700 disabled:text-gray-400"
                  >
                    + Add Owner
                  </button>
                </div>

                {owners.map((owner, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={owner}
                      onChange={(e) => updateOwner(index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder={`Owner ${index + 1} wallet address`}
                      required
                    />
                    {owners.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOwner(index)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Approval Threshold (Number of signatures required)
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  min="1"
                  max={owners.length}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Requires {threshold} out of {owners.length} signatures to approve transactions
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating...' : 'Create Multisig Wallet'}
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

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">How Multisig Works:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Create a multisig wallet with multiple owners</li>
                <li>Set threshold for required approvals (e.g., 2 of 3)</li>
                <li>Any owner can propose a transaction</li>
                <li>Transaction executes only after enough approvals</li>
                <li>Enhanced security for business and shared accounts</li>
              </ol>
            </div>
          </div>
        )}

        {publicKey && multisigs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6">
            <h2 className="text-2xl font-bold mb-6">Your Multisig Wallets</h2>

            {loadingMultisigs ? (
              <p className="text-center text-gray-500 py-8">Loading multisig wallets...</p>
            ) : (
              <div className="space-y-4">
                {multisigs.map((multisig, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">Multisig Wallet #{index + 1}</h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {multisig.publicKey.toString().substring(0, 40)}...
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Owners:</span>
                        <span className="font-semibold ml-2">{multisig.owners.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Threshold:</span>
                        <span className="font-semibold ml-2">{multisig.threshold}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-semibold ml-2">{multisig.transactionCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="font-semibold ml-2">{formatDate(multisig.createdAt)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMultisig(selectedMultisig === multisig.publicKey ? null : multisig.publicKey)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      {selectedMultisig === multisig.publicKey ? 'Hide Details' : 'Propose Transaction'}
                    </button>

                    {selectedMultisig && selectedMultisig.equals(multisig.publicKey) && (
                      <form onSubmit={handleProposeTransaction} className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-200">
                        <h4 className="font-semibold mb-4">Propose New Transaction</h4>

                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-2">Recipient Address</label>
                          <input
                            type="text"
                            value={txRecipient}
                            onChange={(e) => setTxRecipient(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="Enter recipient wallet address"
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-2">Amount (PYUSD)</label>
                          <input
                            type="number"
                            value={txAmount}
                            onChange={(e) => setTxAmount(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="0.00"
                            step="0.01"
                            min="0.01"
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-2">Description</label>
                          <textarea
                            value={txDescription}
                            onChange={(e) => setTxDescription(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="Payment for..."
                            rows={2}
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {loading ? 'Proposing...' : 'Propose Transaction'}
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
