'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import Link from 'next/link'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createTransferCheckedWithTransferHookInstruction,
  getTransferHook,
  resolveExtraAccountMeta,
  ExtraAccountMetaAccountDataLayout
} from '@solana/spl-token'

// PYUSD Testnet/Devnet mint address
const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

interface Contact {
  name: string
  wallet: string
}

export default function Home() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [solBalance, setSolBalance] = useState<number>(0)
  const [pyusdBalance, setPyusdBalance] = useState<number>(0)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [newContactName, setNewContactName] = useState('')
  const [newContactWallet, setNewContactWallet] = useState('')

  useEffect(() => {
    const savedContacts = localStorage.getItem('contacts')
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts))
    }
  }, [])

  useEffect(() => {
    if (publicKey) {
      updateBalances()
    }
  }, [publicKey, connection])

  const updateBalances = async () => {
    if (!publicKey) return

    try {
      const sol = await connection.getBalance(publicKey)
      setSolBalance(sol / LAMPORTS_PER_SOL)

      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: PYUSD_MINT,
          programId: TOKEN_2022_PROGRAM_ID
        })

        if (tokenAccounts.value.length > 0) {
          const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
          setPyusdBalance(balance || 0)
        } else {
          setPyusdBalance(0)
        }
      } catch (tokenError) {
        console.warn('Could not fetch PYUSD balance:', tokenError)
        setPyusdBalance(0)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !recipientAddress || !amount) return

    setLoading(true)
    setStatus({ message: 'Creating transaction...', type: 'info' })

    try {
      // Validate recipient address
      let recipientPubkey: PublicKey
      try {
        recipientPubkey = new PublicKey(recipientAddress)
      } catch {
        throw new Error('Invalid recipient address')
      }

      // Get mint info
      setStatus({ message: 'Fetching token information...', type: 'info' })
      const mintInfo = await getMint(connection, PYUSD_MINT, undefined, TOKEN_2022_PROGRAM_ID)

      // Get token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(PYUSD_MINT, publicKey, false, TOKEN_2022_PROGRAM_ID)
      const toTokenAccount = await getAssociatedTokenAddress(PYUSD_MINT, recipientPubkey, false, TOKEN_2022_PROGRAM_ID)

      // Check if sender has a token account
      const fromAccountInfo = await connection.getAccountInfo(fromTokenAccount)
      if (!fromAccountInfo) {
        throw new Error('You do not have a PYUSD token account. Please get some devnet PYUSD first.')
      }

      // Build transaction
      setStatus({ message: 'Building transaction...', type: 'info' })
      const transaction = new Transaction()

      // Create recipient token account if needed
      const toAccountInfo = await connection.getAccountInfo(toTokenAccount)
      if (!toAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            toTokenAccount,
            recipientPubkey,
            PYUSD_MINT,
            TOKEN_2022_PROGRAM_ID
          )
        )
      }

      // Add transfer instruction - use TransferChecked for Token-2022
      const transferAmount = Math.floor(parseFloat(amount) * Math.pow(10, mintInfo.decimals))

      // Check if the mint has a transfer hook
      const transferHook = getTransferHook(mintInfo)

      if (transferHook) {
        console.log('Token has transfer hook, resolving extra accounts...')
        // For tokens with transfer hooks, we need to add extra accounts
        try {
          transaction.add(
            await createTransferCheckedWithTransferHookInstruction(
              connection,
              fromTokenAccount,
              PYUSD_MINT,
              toTokenAccount,
              publicKey,
              transferAmount,
              mintInfo.decimals,
              [],
              'confirmed',
              TOKEN_2022_PROGRAM_ID
            )
          )
        } catch (hookError) {
          console.warn('Transfer hook instruction failed, falling back to regular transfer:', hookError)
          transaction.add(
            createTransferCheckedInstruction(
              fromTokenAccount,
              PYUSD_MINT,
              toTokenAccount,
              publicKey,
              transferAmount,
              mintInfo.decimals,
              [],
              TOKEN_2022_PROGRAM_ID
            )
          )
        }
      } else {
        transaction.add(
          createTransferCheckedInstruction(
            fromTokenAccount,
            PYUSD_MINT,
            toTokenAccount,
            publicKey,
            transferAmount,
            mintInfo.decimals,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        )
      }

      // Send transaction
      setStatus({ message: 'Please approve transaction in your wallet...', type: 'info' })

      let signature: string
      try {
        signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3
        })
        console.log('Transaction sent:', signature)
      } catch (sendError: any) {
        console.error('Send transaction error:', sendError)
        throw new Error(`Failed to send transaction: ${sendError?.message || sendError}`)
      }

      // Confirm transaction
      setStatus({ message: 'Confirming transaction...', type: 'info' })
      try {
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        console.log('Transaction confirmed:', confirmation)

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
        }
      } catch (confirmError: any) {
        console.error('Confirmation error:', confirmError)
        throw new Error(`Failed to confirm transaction: ${confirmError?.message || confirmError}`)
      }

      setStatus({
        message: `Transaction successful! View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        type: 'success'
      })

      setRecipientAddress('')
      setAmount('')
      setTimeout(updateBalances, 2000)
    } catch (error: any) {
      console.error('=== Transaction Error Details ===')
      console.error('Error:', error)
      console.error('Error name:', error?.name)
      console.error('Error message:', error?.message)
      console.error('Error cause:', error?.cause)
      console.error('Error stack:', error?.stack)
      console.error('================================')

      let errorMessage = 'Transaction failed'

      if (error?.message) {
        errorMessage = error.message
      } else if (error?.toString()) {
        errorMessage = error.toString()
      }

      setStatus({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const addContact = () => {
    if (!newContactName || !newContactWallet) {
      setStatus({ message: 'Please enter contact name and wallet address', type: 'error' })
      return
    }

    try {
      new PublicKey(newContactWallet)
    } catch {
      setStatus({ message: 'Invalid wallet address', type: 'error' })
      return
    }

    if (contacts.find(c => c.wallet === newContactWallet)) {
      setStatus({ message: 'Contact already exists', type: 'error' })
      return
    }

    const updatedContacts = [...contacts, { name: newContactName, wallet: newContactWallet }]
    setContacts(updatedContacts)
    localStorage.setItem('contacts', JSON.stringify(updatedContacts))

    setNewContactName('')
    setNewContactWallet('')
    setStatus({ message: 'Contact added successfully!', type: 'success' })
  }

  const deleteContact = (index: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      const updatedContacts = contacts.filter((_, i) => i !== index)
      setContacts(updatedContacts)
      localStorage.setItem('contacts', JSON.stringify(updatedContacts))
    }
  }

  const quickSend = (wallet: string) => {
    setRecipientAddress(wallet)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">💸 PYUSD Manifesto</h1>
          <p className="text-xl text-purple-200">Send PYUSD on Solana with ease</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/" className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Send PYUSD
            </Link>
            <Link href="/escrow" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
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

        {/* Wallet Connection Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center mb-6">
            <WalletMultiButton />
          </div>

          {publicKey && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Address:</span>
                  <span className="font-mono text-sm">
                    {publicKey.toString().substring(0, 8)}...{publicKey.toString().substring(publicKey.toString().length - 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">SOL Balance:</span>
                  <span className="font-mono">{solBalance.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">PYUSD Balance:</span>
                  <span className="font-mono">{pyusdBalance.toFixed(2)} PYUSD</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {publicKey && (
          <>
            {/* Transaction Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6">Send PYUSD</h2>

              <form onSubmit={handleSendTransaction}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Recipient Wallet Address</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter Solana wallet address"
                    required
                  />
                </div>

                <div className="mb-6">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Send PYUSD'}
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
            </div>

            {/* Contacts Management */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Quick Send to Contacts</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Add New Contact</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-3"
                  placeholder="Contact name"
                />
                <input
                  type="text"
                  value={newContactWallet}
                  onChange={(e) => setNewContactWallet(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none mb-3"
                  placeholder="Wallet address"
                />
                <button
                  onClick={addContact}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700"
                >
                  Add Contact
                </button>
              </div>

              <h3 className="text-lg font-semibold mb-4">Your Contacts</h3>
              {contacts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No contacts yet</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{contact.name}</div>
                        <div className="text-sm text-gray-600 font-mono">
                          {contact.wallet.substring(0, 20)}...{contact.wallet.substring(contact.wallet.length - 10)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => quickSend(contact.wallet)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => deleteContact(index)}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
