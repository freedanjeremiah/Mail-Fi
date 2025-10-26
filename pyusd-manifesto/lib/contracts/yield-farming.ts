import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { getProgram, getPDA, PROGRAM_ID } from './anchor-setup'
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { sendAndConfirmTransactionWithLogs } from './transaction-utils'

export type LockPeriod = 'None' | 'ThirtyDays' | 'NinetyDays' | 'OneEightyDays'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

const DISCRIMINATORS = {
  initializeStakingPool: Buffer.from([0x95, 0xc0, 0xa0, 0xfe, 0xf8, 0x6c, 0x5c, 0x9d]),
  stake: Buffer.from([0xf2, 0xc7, 0x7e, 0x4d, 0x7d, 0x5e, 0x5b, 0xa9]),
  claimRewards: Buffer.from([0x62, 0x19, 0x8f, 0x6e, 0x9f, 0x30, 0x8b, 0x1a]),
  unstake: Buffer.from([0x90, 0x95, 0xeb, 0xf9, 0xfe, 0xfd, 0x90, 0x66]),
  compoundRewards: Buffer.from([0x8b, 0x7f, 0xd6, 0x4e, 0xa7, 0x5f, 0x3c, 0x2d])
}

export async function initializeStakingPool(
  connection: Connection,
  wallet: any,
  rewardRatePerSecond: number
): Promise<string> {
  try {
    const [stakingPoolPDA] = getPDA([
      Buffer.from('staking_pool'),
      PYUSD_MINT.toBuffer()
    ])

    const rewardVault = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const instructionData = Buffer.concat([
      DISCRIMINATORS.initializeStakingPool,
      new BN(rewardRatePerSecond).toArrayLike(Buffer, 'le', 8)
    ])

    const keys = [
      { pubkey: stakingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: rewardVault, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
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

    return signature
  } catch (error: any) {
    console.error('=== INITIALIZE STAKING POOL ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to initialize staking pool: ${error?.message || String(error)}`)
  }
}

export async function stake(
  connection: Connection,
  wallet: any,
  amount: number,
  lockPeriod: LockPeriod
): Promise<string> {
  try {
    const [stakingPoolPDA] = getPDA([
      Buffer.from('staking_pool'),
      PYUSD_MINT.toBuffer()
    ])

    const [userStakePDA] = getPDA([
      Buffer.from('user_stake'),
      stakingPoolPDA.toBuffer(),
      wallet.publicKey.toBuffer()
    ])

    const userTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const poolTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const poolAccountInfo = await connection.getAccountInfo(poolTokenAccount)
    const transaction = new Transaction()

    if (!poolAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          poolTokenAccount,
          stakingPoolPDA,
          PYUSD_MINT,
          TOKEN_2022_PROGRAM_ID
        )
      )
    }

    const lockPeriodIndex = ['none', 'thirtydays', 'ninetydays', 'oneeightydays'].indexOf(lockPeriod.toLowerCase())

    const instructionData = Buffer.concat([
      DISCRIMINATORS.stake,
      new BN(amount * 1e6).toArrayLike(Buffer, 'le', 8),
      Buffer.from([lockPeriodIndex])
    ])

    const keys = [
      { pubkey: stakingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    transaction.add(instruction)

    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })
    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== STAKE ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to stake: ${error?.message || String(error)}`)
  }
}

export async function claimRewards(
  connection: Connection,
  wallet: any
): Promise<string> {
  try {
    const [stakingPoolPDA] = getPDA([
      Buffer.from('staking_pool'),
      PYUSD_MINT.toBuffer()
    ])

    const [userStakePDA] = getPDA([
      Buffer.from('user_stake'),
      stakingPoolPDA.toBuffer(),
      wallet.publicKey.toBuffer()
    ])

    const rewardVault = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const userTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: stakingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: rewardVault, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.claimRewards
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== CLAIM REWARDS ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to claim rewards: ${error?.message || String(error)}`)
  }
}

export async function unstake(
  connection: Connection,
  wallet: any,
  amount: number
): Promise<string> {
  try {
    const [stakingPoolPDA] = getPDA([
      Buffer.from('staking_pool'),
      PYUSD_MINT.toBuffer()
    ])

    const [userStakePDA] = getPDA([
      Buffer.from('user_stake'),
      stakingPoolPDA.toBuffer(),
      wallet.publicKey.toBuffer()
    ])

    const poolTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const userTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    )

    const instructionData = Buffer.concat([
      DISCRIMINATORS.unstake,
      new BN(amount * 1e6).toArrayLike(Buffer, 'le', 8)
    ])

    const keys = [
      { pubkey: stakingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: instructionData
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== UNSTAKE ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to unstake: ${error?.message || String(error)}`)
  }
}

export async function compoundRewards(
  connection: Connection,
  wallet: any
): Promise<string> {
  try {
    const [stakingPoolPDA] = getPDA([
      Buffer.from('staking_pool'),
      PYUSD_MINT.toBuffer()
    ])

    const [userStakePDA] = getPDA([
      Buffer.from('user_stake'),
      stakingPoolPDA.toBuffer(),
      wallet.publicKey.toBuffer()
    ])

    const rewardVault = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const poolTokenAccount = getAssociatedTokenAddressSync(
      PYUSD_MINT,
      stakingPoolPDA,
      true,
      TOKEN_2022_PROGRAM_ID
    )

    const keys = [
      { pubkey: stakingPoolPDA, isSigner: false, isWritable: true },
      { pubkey: userStakePDA, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: rewardVault, isSigner: false, isWritable: true },
      { pubkey: poolTokenAccount, isSigner: false, isWritable: true },
      { pubkey: PYUSD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data: DISCRIMINATORS.compoundRewards
    })

    const transaction = new Transaction().add(instruction)
    const signature = await wallet.sendTransaction(transaction, connection, { skipPreflight: true })

    await sendAndConfirmTransactionWithLogs(signature, connection)

    return signature
  } catch (error: any) {
    console.error('=== COMPOUND REWARDS ERROR ===')
    console.error('Error:', error)
    throw new Error(`Failed to compound rewards: ${error?.message || String(error)}`)
  }
}

export async function getUserStake(
  connection: Connection,
  wallet: any
): Promise<any | null> {
  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const [userStakePDA] = getPDA([
    Buffer.from('user_stake'),
    stakingPoolPDA.toBuffer(),
    wallet.publicKey.toBuffer()
  ])

  try {
    const accountInfo = await connection.getAccountInfo(userStakePDA)
    if (!accountInfo) return null
    return accountInfo
  } catch (error) {
    return null
  }
}

export async function getStakingPool(
  connection: Connection,
  wallet: any
): Promise<any | null> {
  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  try {
    const accountInfo = await connection.getAccountInfo(stakingPoolPDA)
    if (!accountInfo) return null
    return accountInfo
  } catch (error) {
    return null
  }
}
