'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Link from 'next/link'

export default function MultisigPage() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const [owners, setOwners] = useState(['', ''])
  const [threshold, setThreshold] = useState('2')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()

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
    if (!publicKey) return

    setLoading(true)
    setStatus({ message: 'Creating multisig wallet...', type: 'info' })

    try {
      // TODO: Implement multisig creation
      setStatus({
        message: 'Multisig wallet created successfully! (Feature coming soon)',
        type: 'success'
      })
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">💸 PYUSD Manifesto - Multisig Wallet</h1>
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
            <Link href="/staking" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Staking
            </Link>
              Multisig
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center">
            <WalletMultiButton />
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
      </div>
    </div>
  )
}
