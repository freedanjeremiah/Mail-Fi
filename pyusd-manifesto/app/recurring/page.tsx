'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { PublicKey } from '@solana/web3.js'
import Link from 'next/link'
import {
  createRecurringPayment,
  executeRecurringPayment,
  cancelRecurringPayment,
  getAllUserRecurringPayments
} from '@/lib/contracts/recurring'

interface RecurringPayment {
  publicKey: PublicKey
  payer: PublicKey
  recipient: PublicKey
  amount: number
  intervalSeconds: number
  totalPayments: number
  paymentsMade: number
  createdAt: number
  lastPaymentAt: number
  isActive: boolean
  description: string
}

export default function RecurringPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState('month')
  const [totalPayments, setTotalPayments] = useState('12')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)

  useEffect(() => {
    if (!publicKey || !wallet.connected) {
      return
    }

    const timer = setTimeout(() => {
      loadRecurringPayments()
    }, 150)

    return () => clearTimeout(timer)
  }, [publicKey, wallet.connected, connection])

  const loadRecurringPayments = async () => {
    if (!publicKey || !wallet.connected) return

    setLoadingPayments(true)
    try {
      const payments = await getAllUserRecurringPayments(connection, wallet)
      setRecurringPayments(payments)
    } catch (error) {
      console.error('Error loading recurring payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const getIntervalSeconds = (interval: string): number => {
    switch (interval) {
      case 'day': return 86400 // 24 hours
      case 'week': return 604800 // 7 days
      case 'month': return 2592000 // 30 days
      default: return 2592000
    }
  }

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !wallet.connected) {
      setStatus({ message: '❌ Please connect your wallet', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ message: 'Creating recurring payment...', type: 'info' })

    try {
      const recipientPubkey = new PublicKey(recipient)
      const intervalSeconds = getIntervalSeconds(interval)
      const amountNum = parseFloat(amount)

      const { recurringPDA, signature } = await createRecurringPayment(
        connection,
        wallet,
        amountNum,
        recipientPubkey,
        intervalSeconds,
        parseInt(totalPayments),
        description
      )

      setStatus({
        message: `Recurring payment created! View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setRecipient('')
      setAmount('')
      setDescription('')
      setTimeout(loadRecurringPayments, 2000)
    } catch (error: any) {
      console.error('Error creating recurring payment:', error)
      setStatus({ message: error.message || 'Failed to create recurring payment', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleExecutePayment = async (recurringPDA: PublicKey, recipientPubkey: PublicKey) => {
    if (!publicKey || !wallet.connected) {
      setStatus({ message: '❌ Please connect your wallet', type: 'error' })
      return
    }

    setStatus({ message: 'Executing payment...', type: 'info' })

    try {
      const signature = await executeRecurringPayment(
        connection,
        wallet,
        recurringPDA,
        recipientPubkey
      )

      setStatus({
        message: `Payment executed! View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setTimeout(loadRecurringPayments, 2000)
    } catch (error: any) {
      console.error('Error executing payment:', error)
      setStatus({ message: error.message || 'Failed to execute payment', type: 'error' })
    }
  }

  const handleCancelPayment = async (recurringPDA: PublicKey) => {
    if (!publicKey || !wallet.connected) {
      setStatus({ message: '❌ Please connect your wallet', type: 'error' })
      return
    }
    if (!confirm('Are you sure you want to cancel this recurring payment?')) return

    setStatus({ message: 'Canceling payment...', type: 'info' })

    try {
      const signature = await cancelRecurringPayment(
        connection,
        wallet,
        recurringPDA
      )

      setStatus({
        message: `Recurring payment cancelled! View transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setTimeout(loadRecurringPayments, 2000)
    } catch (error: any) {
      console.error('Error cancelling payment:', error)
      setStatus({ message: error.message || 'Failed to cancel payment', type: 'error' })
    }
  }

  const formatInterval = (seconds: number): string => {
    if (seconds === 86400) return 'Daily'
    if (seconds === 604800) return 'Weekly'
    if (seconds === 2592000) return 'Monthly'
    return `${seconds}s`
  }

  const formatDate = (timestamp: number): string => {
    if (timestamp === 0) return 'Never'
    return new Date(timestamp * 1000).toLocaleString()
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

        {publicKey && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mt-6">
            <h2 className="text-2xl font-bold mb-6">Your Recurring Payments</h2>

            {loadingPayments ? (
              <p className="text-center text-gray-500 py-8">Loading payments...</p>
            ) : recurringPayments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recurring payments yet</p>
            ) : (
              <div className="space-y-4">
                {recurringPayments.map((payment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{payment.description}</h3>
                        <p className="text-sm text-gray-600 font-mono">
                          To: {payment.recipient.toString().substring(0, 20)}...
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        payment.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.isActive ? 'Active' : 'Completed'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold ml-2">{payment.amount} PYUSD</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interval:</span>
                        <span className="font-semibold ml-2">{formatInterval(payment.intervalSeconds)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-semibold ml-2">
                          {payment.paymentsMade} / {payment.totalPayments} payments
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Payment:</span>
                        <span className="font-semibold ml-2">{formatDate(payment.lastPaymentAt)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(payment.paymentsMade / payment.totalPayments) * 100}%` }}
                      />
                    </div>

                    {payment.isActive && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExecutePayment(payment.publicKey, payment.recipient)}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Execute Payment
                        </button>
                        <button
                          onClick={() => handleCancelPayment(payment.publicKey)}
                          className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
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
