'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Link from 'next/link'

export default function RecurringPage() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState('month')
  const [totalPayments, setTotalPayments] = useState('12')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) return

    setLoading(true)
    setStatus({ message: 'Creating recurring payment...', type: 'info' })

    try {
      // TODO: Implement recurring payment creation
      setStatus({
        message: 'Recurring payment created successfully! (Feature coming soon)',
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
          <h1 className="text-5xl font-bold text-white mb-2">💸 PYUSD Manifesto - Recurring Payments</h1>
          <p className="text-xl text-purple-200">Set up automatic recurring payments</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Send PYUSD
            </Link>
            <Link href="/escrow" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Escrow
            </Link>
            <Link href="/recurring" className="px-6 py-2 bg-purple-600 text-white rounded-lg">
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

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>

        {publicKey && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Create Recurring Payment</h2>
            <p className="text-gray-600 mb-6">
              Schedule automatic payments at regular intervals. Perfect for subscriptions, rent, or allowances.
            </p>

            <form onSubmit={handleCreateRecurring}>
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
                <label className="block text-sm font-medium mb-2">Payment Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Total Number of Payments</label>
                <input
                  type="number"
                  value={totalPayments}
                  onChange={(e) => setTotalPayments(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="12"
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
                  placeholder="Monthly rent payment..."
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating...' : 'Create Recurring Payment'}
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
              <h3 className="font-semibold mb-2">How Recurring Payments Work:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Set up recurring payment with amount and interval</li>
                <li>Payments execute automatically at scheduled times</li>
                <li>You can cancel anytime to stop future payments</li>
                <li>Track payment history and remaining payments</li>
                <li>No need to remember to make manual payments</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
