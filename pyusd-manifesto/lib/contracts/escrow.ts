import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA, PROGRAM_ID } from './anchor-setup'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { sendAndConfirmTransactionWithLogs } from './transaction-utils'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

// Instruction discriminators (first 8 bytes of SHA256 hash of "global:instruction_name")
const DISCRIMINATORS = {
  createEscrow: Buffer.from([0xfd, 0xd7, 0xa5, 0x74, 0x24, 0x6c, 0x44, 0x50]),
  fundEscrow: Buffer.from([0x9b, 0x12, 0xda, 0x8d, 0xb6, 0xd5, 0x45, 0xc9]),
  claimEscrow: Buffer.from([0xc8, 0x50, 0xb6, 0x9f, 0x3d, 0x4b, 0x09, 0xcd]),
  cancelEscrow: Buffer.from([0x9c, 0xcb, 0x36, 0xb3, 0x26, 0x48, 0x21, 0x15])
}

export async function createEscrow(
  connection: Connection,
  wallet: any,
  amount: number,
  recipient: PublicKey,
  expiryDays: number,
  description: string
): Promise<{ escrowPDA: PublicKey; signature: string }> {
  try {
    const program = getProgram(connection, wallet)

    const escrowId = Date.now().toString()
    const [escrowPDA] = getPDA([
      Buffer.from('escrow'),
      wallet.publicKey.toBuffer(),
      Buffer.from(escrowId)
    ])

    const expiryTime = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)

    const escrowTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      escrowPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    // Manually build instruction data
    const instructionData = Buffer.concat([
      DISCRIMINATORS.createEscrow,
      new BN(amount * 1e6).toArrayLike(Buffer, 'le', 8),
      recipient.toBuffer(),
      new BN(expiryTime).toArrayLike(Buffer, 'le', 8),
      Buffer.from([description.length]),
      Buffer.from(description)
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

    console.log('Creating escrow with:', {
      amount: amount * 1e6,
      recipient: recipient.toString(),
      expiryDays,
      expiryTime,
      description,
      escrowPDA: escrowPDA.toString(),
      instructionDataLength: instructionData.length,
      instructionData: instructionData.toString('hex'),
    })

    const transaction = new Transaction().add(instruction)

    console.log('Sending transaction...')
    let signature: string
    try {
      // Try with simulation first
      signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })
      console.log('Transaction sent successfully:', signature)
    } catch (sendError: any) {
      console.error('=== SEND TRANSACTION ERROR (with preflight) ===')
      console.error('Send error:', sendError)
      console.error('Send error message:', sendError?.message)
      console.error('Send error logs:', sendError?.logs)
      console.error('Send error code:', sendError?.code)
      console.error('Send error name:', sendError?.name)

      // If simulation failed, try to simulate manually to get better error
      console.log('Attempting manual simulation...')
      try {
        const simulation = await connection.simulateTransaction(transaction)
        console.error('Simulation result:', simulation)
        console.error('Simulation logs:', simulation.value.logs)
        console.error('Simulation error:', simulation.value.err)
      } catch (simError) {
        console.error('Manual simulation also failed:', simError)
      }

      // Try without preflight to see actual on-chain error
      console.log('Attempting to send without preflight...')
      try {
        signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: true,
        })
        console.log('Transaction sent WITHOUT preflight:', signature)
      } catch (noPrefightError: any) {
        console.error('Failed even without preflight:', noPrefightError)
        throw sendError // Throw original error
      }
    }

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return { escrowPDA, signature }
  } catch (error: any) {
    console.error('=== CREATE ESCROW ERROR ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error:', error)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error logs:', error?.logs)

    const errorMsg = error?.message || error?.code || String(error)
    throw new Error(`Failed to create escrow: ${errorMsg}`)
  }
}

export async function fundEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  try {
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      escrowPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const creatorTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.fundEscrow
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection)

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== FUND ESCROW ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to fund escrow: ${error?.message || String(error)}`)
  }
}

export async function claimEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  try {
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      escrowPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const recipientTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.claimEscrow
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection)
    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== CLAIM ESCROW ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to claim escrow: ${error?.message || String(error)}`)
  }
}

export async function cancelEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  try {
    const escrowTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      escrowPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const creatorTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.cancelEscrow
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection)
    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== CANCEL ESCROW ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to cancel escrow: ${error?.message || String(error)}`)
  }
}

export async function getEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<any | null> {
  try {
    const accountInfo = await connection.getAccountInfo(escrowPDA)
    if (!accountInfo) return null

    // Parse account data manually if needed
    return accountInfo
  } catch (error) {
    return null
  }
}

export async function getAllUserEscrows(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  try {
    // Use getProgramAccounts to fetch all escrows
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          dataSize: 200 // Approximate size of Escrow account
        }
      ]
    })

    return accounts.map(({ pubkey, account }) => ({
      publicKey: pubkey,
      account: {
        data: account.data
      }
    }))
  } catch (error) {
    console.error('Error fetching escrows:', error)
    return []
  }
}
