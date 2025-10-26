'use client'

import { WalletButton } from '@/components/WalletButton'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-end mb-8">
            <WalletButton />
          </div>

          <div className="mb-8">
            <h1 className="text-7xl font-bold text-white mb-4">Mail-Fi</h1>
            <p className="text-2xl text-purple-400 mb-8 font-semibold">
              Send & Request PYUSD Payments via Email
            </p>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              The easiest way to send cryptocurrency payments. Just like email, but with money.
              Powered by Solana blockchain and PYUSD stablecoin.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/mail"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition shadow-2xl shadow-purple-500/50"
            >
              Launch Mail-Fi
            </Link>
            <Link
              href="/escrow"
              className="px-8 py-4 bg-gray-800 text-white rounded-xl font-semibold text-lg hover:bg-gray-700 transition border border-gray-700"
            >
              Advanced Features
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3 text-white">Instant Transfers</h3>
            <p className="text-gray-400">
              Send PYUSD instantly to anyone with just their email address. No waiting, no delays.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3 text-white">Secure & Safe</h3>
            <p className="text-gray-400">
              Built on Solana blockchain with enterprise-grade security. Your funds are always safe.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-3 text-white">Request Payments</h3>
            <p className="text-gray-400">
              Send payment requests via email. Recipients get a beautiful notification and can pay instantly.
            </p>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-8 text-center text-white">Advanced DeFi Features</h2>

          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/escrow" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-purple-500 transition">
              <h4 className="font-bold text-lg mb-2 text-white">Escrow</h4>
              <p className="text-sm text-gray-400">
                Secure payments with built-in escrow protection
              </p>
            </Link>

            <Link href="/recurring" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-purple-500 transition">
              <h4 className="font-bold text-lg mb-2 text-white">Recurring</h4>
              <p className="text-sm text-gray-400">
                Set up automatic recurring payments
              </p>
            </Link>

            <Link href="/multisig" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-purple-500 transition">
              <h4 className="font-bold text-lg mb-2 text-white">Multisig</h4>
              <p className="text-sm text-gray-400">
                Multi-signature wallets for teams
              </p>
            </Link>

            <Link href="/yield-farming" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 hover:border-purple-500 transition">
              <h4 className="font-bold text-lg mb-2 text-white">Yield Farming</h4>
              <p className="text-sm text-gray-400">
                Earn rewards on your PYUSD
              </p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Powered by Solana × PYUSD × Decentralization
          </p>
        </div>
      </div>
    </div>
  )
}
