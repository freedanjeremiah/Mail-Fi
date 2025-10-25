'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { PublicKey, Transaction as SolanaTransaction, SystemProgram } from '@solana/web3.js'
import { sendPaymentEmail } from '@/lib/email-service'
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  getAccount
} from '@solana/spl-token'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

type MailTab = 'send' | 'request' | 'history'

interface Transaction {
  type: 'sent' | 'received'
  amount: number
  address: string
  email?: string
  description: string
  timestamp: number
  signature?: string
}

export default function MailPage() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  const [activeTab, setActiveTab] = useState<MailTab>('send')
  const [pyusdBalance, setPyusdBalance] = useState<number>(0)

  // Send Money State
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientWallet, setRecipientWallet] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendDescription, setSendDescription] = useState('')

  // Request Money State
  const [requestEmail, setRequestEmail] = useState('')
  const [requestAmount, setRequestAmount] = useState('')
  const [requestDescription, setRequestDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    if (!publicKey || !wallet.connected) {
      return
    }

    const timer = setTimeout(() => {
      loadBalance()
      loadTransactions()
    }, 150)

    return () => clearTimeout(timer)
  }, [publicKey, wallet.connected])

  const loadBalance = async () => {
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
      console.error('Error loading balance:', error)
    }
  }

  const loadTransactions = () => {
    const saved = localStorage.getItem('mail-fi-transactions')
    if (saved) {
      setTransactions(JSON.parse(saved))
    }
  }

  const saveTransaction = (tx: Transaction) => {
    const updated = [tx, ...transactions]
    setTransactions(updated)
    localStorage.setItem('mail-fi-transactions', JSON.stringify(updated))
  }

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !wallet.connected || !wallet.signTransaction) {
      setStatus({ message: '❌ Please connect your wallet', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ message: 'Creating PYUSD transfer...', type: 'info' })

    try {
      const recipientPubkey = new PublicKey(recipientWallet)
      const amount = parseFloat(sendAmount)

      // Get token accounts
      const senderTokenAccount = await getAssociatedTokenAddress(
        PYUSD_MINT,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      )

      const recipientTokenAccount = await getAssociatedTokenAddress(
        PYUSD_MINT,
        recipientPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      )

      console.log('💸 Sending PYUSD:', {
        from: senderTokenAccount.toBase58(),
        to: recipientTokenAccount.toBase58(),
        amount
      })

      // Create transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        senderTokenAccount,
        PYUSD_MINT,
        recipientTokenAccount,
        publicKey,
        amount * 1e6, // PYUSD has 6 decimals
        6,
        [],
        TOKEN_2022_PROGRAM_ID
      )

      // Create and send transaction
      const transaction = new SolanaTransaction().add(transferInstruction)
      transaction.feePayer = publicKey
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

      setStatus({ message: 'Please approve transaction in Phantom...', type: 'info' })

      // Sign and send
      const signed = await wallet.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signed.serialize())

      setStatus({ message: 'Confirming transaction...', type: 'info' })

      await connection.confirmTransaction(signature, 'confirmed')

      console.log('✅ Transaction confirmed:', signature)

      // Send email notification
      try {
        await sendPaymentEmail({
          recipientEmail,
          amount,
          description: sendDescription,
          requestType: 'send',
          senderWallet: publicKey.toString(),
          recipientWallet: recipientWallet,
          txSignature: signature
        })
      } catch (emailError) {
        console.warn('Email failed but transaction succeeded:', emailError)
      }

      // Save to local history
      saveTransaction({
        type: 'sent',
        amount,
        address: recipientWallet,
        email: recipientEmail,
        description: sendDescription,
        timestamp: Date.now(),
        signature
      })

      setStatus({ 
        message: `✅ ${amount} PYUSD sent! View: https://explorer.solana.com/tx/${signature}?cluster=devnet`, 
        type: 'success' 
      })
      
      setRecipientEmail('')
      setRecipientWallet('')
      setSendAmount('')
      setSendDescription('')
      
      // Reload balance
      await loadBalance()
    } catch (error: any) {
      console.error('Send error:', error)
      setStatus({ message: `❌ ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !wallet.connected) {
      setStatus({ message: '❌ Please connect your wallet', type: 'error' })
      return
    }

    setLoading(true)
    setStatus({ message: 'Sending payment request...', type: 'info' })

    try {
      await sendPaymentEmail({
        recipientEmail: requestEmail,
        amount: parseFloat(requestAmount),
        description: requestDescription,
        requestType: 'request',
        recipientWallet: publicKey.toString(),
      })

      setStatus({ message: '✅ Payment request sent successfully!', type: 'success' })
      setRequestEmail('')
      setRequestAmount('')
      setRequestDescription('')
    } catch (error: any) {
      setStatus({ message: `❌ ${error.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-6">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Mail-Fi</h1>
                <p className="text-sm text-gray-400">Decentralized Payments via Email</p>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>

        {publicKey ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="col-span-3">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="mb-6">
                  <div className="text-sm text-gray-400 mb-1">PYUSD Balance</div>
                  <div className="text-3xl font-bold text-white">${pyusdBalance.toFixed(2)}</div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('send')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      activeTab === 'send'
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">💸</span> Send Money
                  </button>
                  <button
                    onClick={() => setActiveTab('request')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      activeTab === 'request'
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">💰</span> Request Money
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      activeTab === 'history'
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">📜</span> Transaction History
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800">
                  <div className="text-xs text-gray-400 mb-2">Your Wallet</div>
                  <div className="text-xs font-mono bg-gray-800 p-2 rounded break-all text-gray-300">
                    {publicKey.toString().substring(0, 12)}...{publicKey.toString().substring(publicKey.toString().length - 8)}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-9">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
                {activeTab === 'send' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Send Money</h2>
                    <p className="text-gray-400 mb-6">Send PYUSD via email notification</p>

                    <form onSubmit={handleSendMoney} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Recipient Email
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="recipient@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Recipient Wallet Address
                        </label>
                        <input
                          type="text"
                          value={recipientWallet}
                          onChange={(e) => setRecipientWallet(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Solana wallet address"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Amount (PYUSD)
                        </label>
                        <input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={sendDescription}
                          onChange={(e) => setSendDescription(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="What's this payment for?"
                          rows={3}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition"
                      >
                        {loading ? 'Processing...' : 'Send Money'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'request' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Request Money</h2>
                    <p className="text-gray-400 mb-6">Request PYUSD payment via email</p>

                    <form onSubmit={handleRequestMoney} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Recipient Email
                        </label>
                        <input
                          type="email"
                          value={requestEmail}
                          onChange={(e) => setRequestEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="recipient@example.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Amount (PYUSD)
                        </label>
                        <input
                          type="number"
                          value={requestAmount}
                          onChange={(e) => setRequestAmount(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={requestDescription}
                          onChange={(e) => setRequestDescription(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="What's this request for?"
                          rows={3}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-4 rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition"
                      >
                        {loading ? 'Sending Request...' : 'Request Money'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>

                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-600">No transactions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx, index) => (
                          <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                tx.type === 'sent' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                              }`}>
                                {tx.type === 'sent' ? '↑' : '↓'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{tx.description}</div>
                                <div className="text-sm text-gray-600">
                                  {tx.email || `${tx.address.substring(0, 8)}...${tx.address.substring(tx.address.length - 6)}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className={`text-lg font-semibold ${
                              tx.type === 'sent' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {tx.type === 'sent' ? '-' : '+'} ${tx.amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {status && (
                  <div className={`mt-6 p-4 rounded-lg ${
                    status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {status.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your Solana wallet to start sending and requesting PYUSD payments</p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
