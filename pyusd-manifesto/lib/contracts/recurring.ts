import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA } from './anchor-setup'
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export async function createRecurringPayment(
  connection: Connection,
  wallet: any,
  amount: number,
  recipient: PublicKey,
  intervalSeconds: number,
  totalPayments: number,
  description: string
): Promise<{ recurringPDA: PublicKey; signature: string }> {
  const program = getProgram(connection, wallet)

  const timestamp = Math.floor(Date.now() / 1000)
  const [recurringPDA] = getPDA([
    Buffer.from('recurring'),
    wallet.publicKey.toBuffer(),
    Buffer.from(new BN(timestamp).toArray('le', 8))
  ])

  const tx = await program.methods
    .createRecurringPayment(
      new BN(amount * 1e6), // Convert to 6 decimals
      recipient,
      new BN(intervalSeconds),
      new BN(totalPayments),
      description
    )
    .accounts({
      recurringPayment: recurringPDA,
      payer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { recurringPDA, signature: tx }
}

export async function executeRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey,
  recipientAddress: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const payerTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const recipientTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    recipientAddress,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .executeRecurringPayment()
    .accounts({
      recurringPayment: recurringPDA,
      payerTokenAccount,
      recipientTokenAccount,
      payer: wallet.publicKey,
      recipient: recipientAddress,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

export async function cancelRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const tx = await program.methods
    .cancelRecurringPayment()
    .accounts({
      recurringPayment: recurringPDA,
      payer: wallet.publicKey,
    })
    .rpc()

  return tx
}

export async function getRecurringPayment(
  connection: Connection,
  wallet: any,
  recurringPDA: PublicKey
): Promise<any | null> {
  const program = getProgram(connection, wallet)

  try {
    const recurring = await program.account.recurringPayment.fetch(recurringPDA)
    return recurring
  } catch (error) {
    return null
  }
}

export async function getAllUserRecurringPayments(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  const program = getProgram(connection, wallet)

  try {
    const payments = await program.account.recurringPayment.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: wallet.publicKey.toBase58(),
        }
      }
    ])
    return payments
  } catch (error) {
    console.error('Error fetching recurring payments:', error)
    return []
  }
}

export async function getRecurringPaymentPDA(
  wallet: PublicKey,
  createdAt: number
): Promise<[PublicKey, number]> {
  return getPDA([
    Buffer.from('recurring'),
    wallet.toBuffer(),
    Buffer.from(new BN(createdAt).toArray('le', 8))
  ])
}
