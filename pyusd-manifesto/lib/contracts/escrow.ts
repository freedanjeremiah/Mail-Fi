import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA } from './anchor-setup'
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export async function createEscrow(
  connection: Connection,
  wallet: any,
  amount: number,
  recipient: PublicKey,
  expiryDays: number,
  description: string
): Promise<{ escrowPDA: PublicKey; signature: string }> {
  const program = getProgram(connection, wallet)

  const escrowId = Date.now().toString()
  const [escrowPDA] = getPDA([
    Buffer.from('escrow'),
    wallet.publicKey.toBuffer(),
    Buffer.from(escrowId)
  ])

  const expiryTime = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)

  const tx = await program.methods
    .createEscrow(
      new BN(amount * 1e6), // Convert to 6 decimals
      recipient,
      new BN(expiryTime),
      description
    )
    .accounts({
      escrow: escrowPDA,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { escrowPDA, signature: tx }
}

export async function fundEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const escrowTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    escrowPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const creatorTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .fundEscrow()
    .accounts({
      escrow: escrowPDA,
      creator: wallet.publicKey,
      escrowTokenAccount,
      creatorTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function claimEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const escrowTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    escrowPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const recipientTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .claimEscrow()
    .accounts({
      escrow: escrowPDA,
      recipient: wallet.publicKey,
      escrowTokenAccount,
      recipientTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function cancelEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<string> {
  const program = getProgram(connection, wallet)

  const escrowTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    escrowPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const creatorTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .cancelEscrow()
    .accounts({
      escrow: escrowPDA,
      creator: wallet.publicKey,
      escrowTokenAccount,
      creatorTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function getEscrow(
  connection: Connection,
  wallet: any,
  escrowPDA: PublicKey
): Promise<any | null> {
  const program = getProgram(connection, wallet)

  try {
    const escrow = await program.account.escrow.fetch(escrowPDA)
    return escrow
  } catch (error) {
    return null
  }
}

export async function getAllUserEscrows(
  connection: Connection,
  wallet: any
): Promise<any[]> {
  const program = getProgram(connection, wallet)

  try {
    const escrows = await program.account.escrow.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: wallet.publicKey.toBase58(),
        }
      }
    ])
    return escrows
  } catch (error) {
    console.error('Error fetching escrows:', error)
    return []
  }
}
