import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA, PROGRAM_ID } from './anchor-setup'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { sendAndConfirmTransactionWithLogs } from './transaction-utils'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

const DISCRIMINATORS = {
  createRecurringPayment: Buffer.from([0x6a, 0x4e, 0x8f, 0x3d, 0x9c, 0x7b, 0x2a, 0x5f]),
  executeRecurringPayment: Buffer.from([0x7b, 0x5f, 0x9e, 0x4c, 0x8d, 0x6a, 0x3b, 0x1e]),
  cancelRecurringPayment: Buffer.from([0x8c, 0x6d, 0x9f, 0x5b, 0x7e, 0x4a, 0x2c, 0x1d])
}

export async function createRecurringPayment(
  connection: Connection,
  wallet: any,
  amount: number,
  recipient: PublicKey,
  intervalSeconds: number,
  totalPayments: number,
  description: string
): Promise<{ recurringPDA: PublicKey; signature: string }> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const [recurringPDA] = getPDA([
      Buffer.from('recurring'),
      wallet.publicKey.toBuffer(),
      Buffer.from(new BN(timestamp).toArray('le', 8))
    ])

    const instructionData = Buffer.concat([
      DISCRIMINATORS.createRecurringPayment,
      new BN(amount * 1e6).toArrayLike(Buffer, 'le', 8),
      recipient.toBuffer(),
      new BN(intervalSeconds).toArrayLike(Buffer, 'le', 8),
      new BN(totalPayments).toArrayLike(Buffer, 'le', 8),
      Buffer.from([description.length]),
      Buffer.from(description)
    ])

    const keys = [
      { pubkey: recurringPDA, isSigner: false, isWritable: true },
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

    return { recurringPDA, signature }
  } catch (error: any) {
    console.error('=== CREATE RECURRING PAYMENT ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to create recurring payment: ${error?.message || String(error)}`)
  }
}

export async function executeRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey,
  recipientAddress: PublicKey
): Promise<string> {
  try {
    const payerTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const recipientTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      recipientAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: recurringPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: false, isWritable: true },
      { pubkey: recipientAddress, isSigner: false, isWritable: true },
      { pubkey: payerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.executeRecurringPayment
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== EXECUTE RECURRING PAYMENT ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to execute recurring payment: ${error?.message || String(error)}`)
  }
}

export async function cancelRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey
): Promise<string> {
  try {
    const keys = [
      { pubkey: recurringPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.cancelRecurringPayment
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== CANCEL RECURRING PAYMENT ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to cancel recurring payment: ${error?.message || String(error)}`)
  }
}

export async function getRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey
): Promise<any | null> {
  try {
    const accountInfo = await connection.getAccountInfo(recurringPDA)
    if (!accountInfo) return null
    return accountInfo
  } catch (error) {
    return null
  }
}

export async function getAllUserRecurringPayments(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          dataSize: 200
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
    console.error('Error fetching recurring payments:', error)
    return []
  }
}
