import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA } from './anchor-setup'
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export async function createMultisig(
  connection: Connection,
  wallet: any,
  owners: PublicKey[],
  threshold: number
): Promise<{ multisigPDA: PublicKey; signature: string }> {
  const program = getProgram(connection, wallet)

  const timestamp = Math.floor(Date.now() / 1000)
  const [multisigPDA] = getPDA([
    Buffer.from('multisig'),
    wallet.publicKey.toBuffer(),
    Buffer.from(new BN(timestamp).toArray('le', 8))
  ])

  const tx = await program.methods
    .createMultisig(owners, new BN(threshold))
    .accounts({
      multisig: multisigPDA,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { multisigPDA, signature: tx }
}

export async function proposeTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  amount: number,
  recipient: PublicKey,
  description: string
): Promise<{ transactionPDA: PublicKey; signature: string }> {
  const program = getProgram(connection, wallet)

  // Get multisig account to find transaction count
  const multisig = await program.account.multisig.fetch(multisigPDA)

  const [transactionPDA] = getPDA([
    Buffer.from('transaction'),
    multisigPDA.toBuffer(),
    Buffer.from(new BN(multisig.transactionCount).toArray('le', 8))
  ])

  const tx = await program.methods
    .proposeTransaction(
      new BN(amount * 1e6), // Convert to 6 decimals
      recipient,
      description
    )
    .accounts({
      multisig: multisigPDA,
      transaction: transactionPDA,
      proposer: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { transactionPDA, signature: tx }
}

export async function approveTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const tx = await program.methods
    .approveTransaction()
    .accounts({
      multisig: multisigPDA,
      transaction: transactionPDA,
      owner: wallet.publicKey,
    })
    .rpc()

  return tx
}

export async function executeTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey,
  recipientAddress: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const multisigTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    multisigPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const recipientTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    recipientAddress,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .executeTransaction()
    .accounts({
      multisig: multisigPDA,
      transaction: transactionPDA,
      multisigTokenAccount,
      recipientTokenAccount,
      executor: wallet.publicKey,
      recipient: recipientAddress,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

export async function rejectTransaction(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey,
  transactionPDA: PublicKey,
  proposer: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const tx = await program.methods
    .rejectTransaction()
    .accounts({
      transaction: transactionPDA,
      multisig: multisigPDA,
      proposer,
      owner: wallet.publicKey,
    })
    .rpc()

  return tx
}

export async function getMultisig(
  connection: Connection,
  wallet: any,
  multisigPDA: PublicKey
): Promise<any | null> {
  const program = getProgram(connection, wallet)

  try {
    const multisig = await program.account.multisig.fetch(multisigPDA)
    return multisig
  } catch (error) {
    return null
  }
}

export async function getMultisigTransaction(
  connection: Connection,
  wallet: any,
  transactionPDA: PublicKey
): Promise<any | null> {
  const program = getProgram(connection, wallet)

  try {
    const transaction = await program.account.multisigTransaction.fetch(transactionPDA)
    return transaction
  } catch (error) {
    return null
  }
}

export async function getAllUserMultisigs(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  const program = getProgram(connection, wallet)

  try {
    const multisigs = await program.account.multisig.all()
    // Filter for multisigs where user is an owner
    return multisigs.filter(m =>
      m.account.owners.some((owner: PublicKey) => owner.equals(wallet.publicKey))
    )
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
  const program = getProgram(connection, wallet)

  try {
    const transactions = await program.account.multisigTransaction.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: multisigPDA.toBase58(),
        }
      }
    ])
    return transactions
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
