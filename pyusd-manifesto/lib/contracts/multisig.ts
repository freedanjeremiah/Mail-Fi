import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA, PROGRAM_ID } from './anchor-setup'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { sendAndConfirmTransactionWithLogs } from './transaction-utils'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

const DISCRIMINATORS = {
  createMultisig: Buffer.from([0x9c, 0x32, 0x7e, 0x9b, 0x5d, 0x4f, 0x8a, 0x12]),
  proposeTransaction: Buffer.from([0x7a, 0x3d, 0x8e, 0x6f, 0x1c, 0x9b, 0x4a, 0x5d]),
  approveTransaction: Buffer.from([0x3b, 0x8f, 0x2d, 0x6a, 0x7e, 0x1c, 0x9d, 0x4f]),
  executeTransaction: Buffer.from([0x5c, 0x9a, 0x3f, 0x7b, 0x2e, 0x6d, 0x1a, 0x8c]),
  rejectTransaction: Buffer.from([0x4d, 0x7e, 0x2b, 0x9f, 0x3c, 0x8a, 0x5d, 0x1e])
}

export async function createMultisig(
  connection: Connection,
  wallet: any,
  owners: PublicKey[],
  threshold: number
): Promise<{ multisigPDA: PublicKey; signature: string }> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const [multisigPDA] = getPDA([
      Buffer.from('multisig'),
      wallet.publicKey.toBuffer(),
      Buffer.from(new BN(timestamp).toArray('le', 8))
    ])

    const ownersBuffer = Buffer.concat([
      Buffer.from([owners.length]),
      ...owners.map(o => o.toBuffer())
    ])

    const instructionData = Buffer.concat([
      DISCRIMINATORS.createMultisig,
      ownersBuffer,
      new BN(threshold).toArrayLike(Buffer, 'le', 8)
    ])

    const keys = [
      { pubkey: multisigPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return { multisigPDA, signature }
  } catch (error: any) {
    console.error('=== CREATE MULTISIG ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to create multisig: ${error?.message || String(error)}`)
  }
}

export async function proposeTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  amount: number,
  recipient: PublicKey,
  description: string
): Promise<{ transactionPDA: PublicKey; signature: string }> {
  try {
    const accountInfo = await connection.getAccountInfo(multisigPDA)
    if (!accountInfo) throw new Error('Multisig account not found')

    const transactionCount = accountInfo.data.readBigUInt64LE(8 + 32 * 10 + 8)

    const [transactionPDA] = getPDA([
      Buffer.from('transaction'),
      multisigPDA.toBuffer(),
      Buffer.from(new BN(Number(transactionCount)).toArray('le', 8))
    ])

    const instructionData = Buffer.concat([
      DISCRIMINATORS.proposeTransaction,
      new BN(amount * 1e6).toArrayLike(Buffer, 'le', 8),
      recipient.toBuffer(),
      Buffer.from([description.length]),
      Buffer.from(description)
    ])

    const keys = [
      { pubkey: multisigPDA, isSigner: false, isWritable: true },
      { pubkey: transactionPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return { transactionPDA, signature }
  } catch (error: any) {
    console.error('=== PROPOSE TRANSACTION ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to propose transaction: ${error?.message || String(error)}`)
  }
}

export async function approveTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey
): Promise<string> {
  try {
    const keys = [
      { pubkey: multisigPDA, isSigner: false, isWritable: true },
      { pubkey: transactionPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.approveTransaction
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== APPROVE TRANSACTION ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to approve transaction: ${error?.message || String(error)}`)
  }
}

export async function executeTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey,
  recipientAddress: PublicKey
): Promise<string> {
  try {
    const multisigTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      multisigPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const recipientTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      recipientAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: multisigPDA, isSigner: false, isWritable: true },
      { pubkey: transactionPDA, isSigner: false, isWritable: true },
      { pubkey: multisigTokenAccount, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: recipientAddress, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.executeTransaction
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== EXECUTE TRANSACTION ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to execute transaction: ${error?.message || String(error)}`)
  }
}

export async function rejectTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey,
  proposer: PublicKey
): Promise<string> {
  try {
    const keys = [
      { pubkey: transactionPDA, isSigner: false, isWritable: true },
      { pubkey: multisigPDA, isSigner: false, isWritable: true },
      { pubkey: proposer, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.rejectTransaction
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== REJECT TRANSACTION ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to reject transaction: ${error?.message || String(error)}`)
  }
}

export async function getMultisig(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey
): Promise<any | null> {
  try {
    const accountInfo = await connection.getAccountInfo(multisigPDA)
    if (!accountInfo) return null
    return accountInfo
  } catch (error) {
    return null
  }
}

export async function getMultisigTransaction(
  connection: Connection,
  wallet: any,
  transactionPDA: PublicKey
): Promise<any | null> {
  try {
    const accountInfo = await connection.getAccountInfo(transactionPDA)
    if (!accountInfo) return null
    return accountInfo
  } catch (error) {
    return null
  }
}

export async function getAllUserMultisigs(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          dataSize: 400
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
    console.error('Error fetching multisigs:', error)
    return []
  }
}

export async function getAllMultisigTransactions(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey
): Promise<any[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          dataSize: 300
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
    console.error('Error fetching transactions:', error)
    return []
  }
}

export async function getMultisigPDA(
  creator: PublicKey,
  createdAt: number
): Promise<[PublicKey, number]> {
  return getPDA([
    Buffer.from('multisig'),
    creator.toBuffer(),
    Buffer.from(new BN(createdAt).toArray('le', 8))
  ])
}

export async function getTransactionPDA(
  multisigPDA: PublicKey,
  transactionIndex: number
): Promise<[PublicKey, number]> {
  return getPDA([
    Buffer.from('transaction'),
    multisigPDA.toBuffer(),
    Buffer.from(new BN(transactionIndex).toArray('le', 8))
  ])
}
