import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '../components/WalletProvider'

export const metadata: Metadata = {
  title: 'Mail-Fi - PYUSD Transactions',
  description: 'Send PYUSD on Solana with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
