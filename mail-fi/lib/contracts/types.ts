import { PublicKey } from '@solana/web3.js'

export interface EscrowAccount {
  creator: PublicKey
  recipient: PublicKey
  amount: number
  createdAt: number
  expiryTime: number
  isFunded: boolean
  description: string
  bump: number
}

export interface RecurringPayment {
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
  bump: number
}

export interface Multisig {
  creator: PublicKey
  owners: PublicKey[]
  threshold: number
  transactionCount: number
  createdAt: number
  bump: number
}

export interface MultisigTransaction {
  multisig: PublicKey
  recipient: PublicKey
  amount: number
  transactionIndex: number
  approvals: PublicKey[]
  executed: boolean
  proposer: PublicKey
  createdAt: number
  description: string
  bump: number
}
