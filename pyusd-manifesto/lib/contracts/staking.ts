import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor'
import { getProgram, getPDA } from './anchor-setup'
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token'

export type LockPeriod = 'None' | 'ThirtyDays' | 'NinetyDays' | 'OneEightyDays'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export async function initializeStakingPool(
  connection: Connection,
  wallet: any,
  rewardRatePerSecond: number
): Promise<string> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const rewardVault = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .initializeStakingPool(new BN(rewardRatePerSecond))
    .accounts({
      stakingPool: stakingPoolPDA,
      authority: wallet.publicKey,
      rewardVault,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return tx
}

export async function stake(
  connection: Connection,
  wallet: any,
  amount: number,
  lockPeriod: LockPeriod
): Promise<string> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const [userStakePDA] = getPDA([
    Buffer.from('user_stake'),
    stakingPoolPDA.toBuffer(),
    wallet.publicKey.toBuffer()
  ])

  const userTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const poolTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  // Check if pool token account exists, create if not
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

  // Convert lock period string to enum
  const lockPeriodEnum = { [lockPeriod.toLowerCase()]: {} }

  transaction.add(
    await program.methods
      .stake(new BN(amount * 1e6), lockPeriodEnum) // Assuming 6 decimals for PYUSD
      .accounts({
        stakingPool: stakingPoolPDA,
        userStake: userStakePDA,
        user: wallet.publicKey,
        userTokenAccount,
        poolTokenAccount,
        mint: PYUSD_MINT,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
  )

  const tx = await wallet.sendTransaction(transaction, connection)
  await connection.confirmTransaction(tx)

  return tx
}

export async function claimRewards(
  connection: Connection,
  wallet: any
): Promise<string> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const [userStakePDA] = getPDA([
    Buffer.from('user_stake'),
    stakingPoolPDA.toBuffer(),
    wallet.publicKey.toBuffer()
  ])

  const rewardVault = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const userTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .claimRewards()
    .accounts({
      stakingPool: stakingPoolPDA,
      userStake: userStakePDA,
      user: wallet.publicKey,
      rewardVault,
      userTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function unstake(
  connection: Connection,
  wallet: any,
  amount: number
): Promise<string> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const [userStakePDA] = getPDA([
    Buffer.from('user_stake'),
    stakingPoolPDA.toBuffer(),
    wallet.publicKey.toBuffer()
  ])

  const poolTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const userTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .unstake(new BN(amount * 1e6))
    .accounts({
      stakingPool: stakingPoolPDA,
      userStake: userStakePDA,
      user: wallet.publicKey,
      poolTokenAccount,
      userTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function compoundRewards(
  connection: Connection,
  wallet: any
): Promise<string> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  const [userStakePDA] = getPDA([
    Buffer.from('user_stake'),
    stakingPoolPDA.toBuffer(),
    wallet.publicKey.toBuffer()
  ])

  const rewardVault = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const poolTokenAccount = await getAssociatedTokenAddress(
    PYUSD_MINT,
    stakingPoolPDA,
    true,
    TOKEN_2022_PROGRAM_ID
  )

  const tx = await program.methods
    .compoundRewards()
    .accounts({
      stakingPool: stakingPoolPDA,
      userStake: userStakePDA,
      user: wallet.publicKey,
      rewardVault,
      poolTokenAccount,
      mint: PYUSD_MINT,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc()

  return tx
}

export async function getUserStake(
  connection: Connection,
  wallet: any
): Promise<any | null> {
  const program = getProgram(connection, wallet)

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
    const userStake = await program.account.userStake.fetch(userStakePDA)
    return userStake
  } catch (error) {
    return null
  }
}

export async function getStakingPool(
  connection: Connection,
  wallet: any
): Promise<any | null> {
  const program = getProgram(connection, wallet)

  const [stakingPoolPDA] = getPDA([
    Buffer.from('staking_pool'),
    PYUSD_MINT.toBuffer()
  ])

  try {
    const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA)
    return stakingPool
  } catch (error) {
    return null
  }
}
