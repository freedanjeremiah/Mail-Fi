'use client'

import { useWallet } from '@solana/wallet-adapter-react'

export function WalletDebug() {
  const wallet = useWallet()

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-md border border-purple-500">
      <div className="font-bold mb-2 text-purple-400">🔍 Wallet Debug Info</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Connected:</span>{' '}
          <span className={wallet.connected ? 'text-green-400' : 'text-red-400'}>
            {wallet.connected ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Connecting:</span>{' '}
          <span className={wallet.connecting ? 'text-yellow-400' : 'text-gray-500'}>
            {wallet.connecting ? '⏳ Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">PublicKey:</span>{' '}
          <span className={wallet.publicKey ? 'text-green-400' : 'text-red-400'}>
            {wallet.publicKey ? '✅ Exists' : '❌ Null'}
          </span>
        </div>
        {wallet.publicKey && (
          <div className="mt-2 p-2 bg-gray-900 rounded break-all">
            <div className="text-gray-400 text-[10px]">Address:</div>
            <div className="text-purple-300">{wallet.publicKey.toBase58()}</div>
          </div>
        )}
        <div className="mt-2">
          <span className="text-gray-400">Wallet Name:</span>{' '}
          <span className="text-blue-400">{wallet.wallet?.adapter?.name || 'None'}</span>
        </div>
      </div>
    </div>
  )
}
