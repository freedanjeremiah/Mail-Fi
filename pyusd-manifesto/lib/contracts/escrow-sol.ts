import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'
import { PROGRAM_ID } from './anchor-setup'

const DISCRIMINATORS = {
  createEscrow: Buffer.from([0xfd, 0xd7, 0xa5, 0x74, 0x24, 0x6c, 0x44, 0x50]),
  claimEscrow: Buffer.from([0xc8, 0x50, 0xb6, 0x9f, 0x3d, 0x4b, 0x09, 0xcd]),
  cancelEscrow: Buffer.from([0x9c, 0xcb, 0x36, 0xb3, 0x26, 0x48, 0x21, 0x15])
}

export async function createEscrowSOL(
  connection: Connection,
  wallet: any,
  amountSOL: number,
  recipient: PublicKey,
  expiryDays: number
): Promise<{ escrowPDA: PublicKey; signature: string }> {
  try {
    console.log('=== CREATE ESCROW (SOL) ===')
    console.log('Amount (SOL):', amountSOL)
    console.log('Recipient:', recipient.toBase58())
    console.log('Expiry days:', expiryDays)

    // Convert SOL to lamports
    const amountLamports = Math.floor(amountSOL * LAMPORTS_PER_SOL)

    // Calculate expiry time
    const currentTime = Math.floor(Date.now() / 1000)
    const expiryTime = currentTime + (expiryDays * 24 * 60 * 60)

    // Derive escrow PDA
    const [escrowPDA, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        wallet.publicKey.toBuffer(),
        Buffer.from(new BN(currentTime).toArray('le', 8))
      ],
      PROGRAM_ID
    )

    console.log('Escrow PDA:', escrowPDA.toBase58())

    // Build instruction data: discriminator + amount + recipient + expiry_time
    const instructionData = Buffer.concat([
      DISCRIMINATORS.createEscrow,
      Buffer.from(new BN(amountLamports).toArray('le', 8)),
      recipient.toBuffer(),
      Buffer.from(new BN(expiryTime).toArray('le', 8))
    ])

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)

    console.log('Sending transaction...')
    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })

    console.log('Transaction signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
    }

    console.log('✓ Escrow created successfully!')

    return { escrowPDA, signature }
  } catch (error: any) {
    console.error('=== CREATE ESCROW ERROR ===')
    console.error('Error:', error)
    if (error.logs) {
      console.error('Program logs:', error.logs)
    }
    throw new Error(`Failed to create escrow: ${error?.message || String(error)}`)
  }
}

export async function claimEscrowSOL(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  try {
    console.log('=== CLAIM ESCROW (SOL) ===')
    console.log('Escrow PDA:', escrowPDA.toBase58())

    const instructionData = DISCRIMINATORS.claimEscrow

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)

    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })

    console.log('Transaction signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    const confirmation = await connection.confirmTransaction(signature, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
    }

    console.log('✓ Escrow claimed successfully!')

    return signature
  } catch (error: any) {
    console.error('=== CLAIM ESCROW ERROR ===')
    console.error('Error:', error)
    if (error.logs) {
      console.error('Program logs:', error.logs)
    }
    throw new Error(`Failed to claim escrow: ${error?.message || String(error)}`)
  }
}

export async function cancelEscrowSOL(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  try {
    console.log('=== CANCEL ESCROW (SOL) ===')
    console.log('Escrow PDA:', escrowPDA.toBase58())

    const instructionData = DISCRIMINATORS.cancelEscrow

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)

    const signature = await wallet.sendTransaction(transaction, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    })

    console.log('Transaction signature:', signature)
    console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    const confirmation = await connection.confirmTransaction(signature, 'confirmed')

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
    }

    console.log('✓ Escrow cancelled successfully!')

    return signature
  } catch (error: any) {
    console.error('=== CANCEL ESCROW ERROR ===')
    console.error('Error:', error)
    if (error.logs) {
      console.error('Program logs:', error.logs)
    }
    throw new Error(`Failed to cancel escrow: ${error?.message || String(error)}`)
  }
}
