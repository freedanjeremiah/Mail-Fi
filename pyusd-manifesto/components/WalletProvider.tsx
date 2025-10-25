'use client'

import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(
    () => [
      // Phantom wallet adapter with explicit configuration
      new PhantomWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={(error) => {
          console.error('Wallet error:', error)
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
