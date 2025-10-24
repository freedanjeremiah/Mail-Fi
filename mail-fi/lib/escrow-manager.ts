import { PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getMint
} from '@solana/spl-token'

export interface EscrowData {
  id: string
  creator: string
  recipient: string
  amount: number
  expiryTime: number
  description: string
  status: 'created' | 'funded' | 'claimed' | 'cancelled'
  createdAt: number
  fundedAt?: number
  claimedAt?: number
  cancelledAt?: number
  mint: string
}

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export class EscrowManager {
  private STORAGE_KEY = 'mail_fi_escrows'

  private getEscrows(): EscrowData[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveEscrows(escrows: EscrowData[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(escrows))
  }

  async createEscrow(
    creator: PublicKey,
    recipient: string,
    amount: number,
    expiryDays: number,
    description: string
  ): Promise<string> {
    // Validate recipient address
    try {
      new PublicKey(recipient)
    } catch {
      throw new Error('Invalid recipient address')
    }

    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const escrow: EscrowData = {
      id: escrowId,
      creator: creator.toString(),
      recipient,
      amount,
      expiryTime: Date.now() + (expiryDays * 24 * 60 * 60 * 1000),
      description,
      status: 'created',
      createdAt: Date.now(),
      mint: PYUSD_MINT.toString()
    }

    const escrows = this.getEscrows()
    escrows.push(escrow)
    this.saveEscrows(escrows)

    return escrowId
  }

  async fundEscrow(
    connection: Connection,
    escrowId: string,
    wallet: any,
    sendTransaction: any
  ): Promise<string> {
    const escrows = this.getEscrows()
    const escrow = escrows.find(e => e.id === escrowId)

    if (!escrow) throw new Error('Escrow not found')
    if (escrow.status !== 'created') throw new Error('Escrow already funded or completed')
    if (wallet.publicKey.toString() !== escrow.creator) throw new Error('Only creator can fund')

    // Create transaction to transfer funds to recipient's token account
    const recipientPubkey = new PublicKey(escrow.recipient)
    const mintInfo = await getMint(connection, PYUSD_MINT, undefined, TOKEN_2022_PROGRAM_ID)

    const fromTokenAccount = await getAssociatedTokenAddress(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const toTokenAccount = await getAssociatedTokenAddress(
      PYUSD_MINT,
      recipientPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const transaction = new Transaction()

    // Create recipient token account if needed
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount)
    if (!toAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          toTokenAccount,
          recipientPubkey,
          PYUSD_MINT,
          TOKEN_2022_PROGRAM_ID
        )
      )
    }

    // Add transfer instruction
    const transferAmount = Math.floor(escrow.amount * Math.pow(10, mintInfo.decimals))
    transaction.add(
      createTransferCheckedInstruction(
        fromTokenAccount,
        PYUSD_MINT,
        toTokenAccount,
        wallet.publicKey,
        transferAmount,
        mintInfo.decimals,
        [],
        TOKEN_2022_PROGRAM_ID
      )
    )

    // Send transaction
    const signature = await sendTransaction(transaction, connection)
    await connection.confirmTransaction(signature, 'confirmed')

    // Update escrow status
    escrow.status = 'funded'
    escrow.fundedAt = Date.now()
    this.saveEscrows(escrows)

    return signature
  }

  getUserEscrows(userPubkey: PublicKey): EscrowData[] {
    const escrows = this.getEscrows()
    const userAddress = userPubkey.toString()
    return escrows.filter(e =>
      e.creator === userAddress || e.recipient === userAddress
    )
  }

  getEscrow(escrowId: string): EscrowData | null {
    const escrows = this.getEscrows()
    return escrows.find(e => e.id === escrowId) || null
  }

  cancelEscrow(escrowId: string, userPubkey: PublicKey): void {
    const escrows = this.getEscrows()
    const escrow = escrows.find(e => e.id === escrowId)

    if (!escrow) throw new Error('Escrow not found')
    if (escrow.creator !== userPubkey.toString()) throw new Error('Only creator can cancel')
    if (Date.now() < escrow.expiryTime) throw new Error('Cannot cancel before expiry')
    if (escrow.status === 'claimed') throw new Error('Escrow already claimed')

    escrow.status = 'cancelled'
    escrow.cancelledAt = Date.now()
    this.saveEscrows(escrows)
  }

  markClaimed(escrowId: string, userPubkey: PublicKey): void {
    const escrows = this.getEscrows()
    const escrow = escrows.find(e => e.id === escrowId)

    if (!escrow) throw new Error('Escrow not found')
    if (escrow.recipient !== userPubkey.toString()) throw new Error('Only recipient can claim')
    if (escrow.status !== 'funded') throw new Error('Escrow not funded')
    if (Date.now() > escrow.expiryTime) throw new Error('Escrow expired')

    escrow.status = 'claimed'
    escrow.claimedAt = Date.now()
    this.saveEscrows(escrows)
  }
}

export const escrowManager = new EscrowManager()
