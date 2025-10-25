import { PublicKey } from '@solana/web3.js'

export type LockPeriod = 'none' | '30days' | '90days' | '180days'

export interface StakeData {
  id: string
  owner: string
  amountStaked: number
  pendingRewards: number
  totalClaimed: number
  stakeTimestamp: number
  lastClaimTimestamp: number
  lockEndTime: number
  lockPeriod: LockPeriod
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'
  currentAPY: number
}

export interface PoolStats {
  totalStaked: number
  totalStakers: number
  averageAPY: number
  totalRewardsDistributed: number
}

const PYUSD_MINT = 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM'

// APY rates
const BRONZE_APY = 8
const SILVER_APY = 15
const GOLD_APY = 25
const DIAMOND_APY = 40

// Lock multipliers
const LOCK_MULTIPLIERS = {
  'none': 1.0,
  '30days': 1.3,
  '90days': 1.7,
  '180days': 2.5,
}

// Lock durations in milliseconds
const LOCK_DURATIONS = {
  'none': 0,
  '30days': 30 * 24 * 60 * 60 * 1000,
  '90days': 90 * 24 * 60 * 60 * 1000,
  '180days': 180 * 24 * 60 * 60 * 1000,
}

export class StakingManager {
  private STAKES_STORAGE_KEY = 'pyusd_manifesto_stakes'
  private POOL_STATS_KEY = 'pyusd_manifesto_pool_stats'

  private getStakes(): StakeData[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.STAKES_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveStakes(stakes: StakeData[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STAKES_STORAGE_KEY, JSON.stringify(stakes))
  }

  private getPoolStatsData(): PoolStats {
    if (typeof window === 'undefined') {
      return { totalStaked: 0, totalStakers: 0, averageAPY: 22, totalRewardsDistributed: 0 }
    }
    const data = localStorage.getItem(this.POOL_STATS_KEY)
    return data ? JSON.parse(data) : { totalStaked: 0, totalStakers: 0, averageAPY: 22, totalRewardsDistributed: 0 }
  }

  private savePoolStats(stats: PoolStats) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.POOL_STATS_KEY, JSON.stringify(stats))
  }

  private calculateTier(amount: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' {
    if (amount >= 50000) return 'Diamond'
    if (amount >= 10000) return 'Gold'
    if (amount >= 1000) return 'Silver'
    return 'Bronze'
  }

  private getBaseAPY(tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'): number {
    switch (tier) {
      case 'Diamond': return DIAMOND_APY
      case 'Gold': return GOLD_APY
      case 'Silver': return SILVER_APY
      default: return BRONZE_APY
    }
  }

  private calculateEffectiveAPY(amount: number, lockPeriod: LockPeriod): number {
    const tier = this.calculateTier(amount)
    const baseAPY = this.getBaseAPY(tier)
    const multiplier = LOCK_MULTIPLIERS[lockPeriod]
    return baseAPY * multiplier
  }

  private calculatePendingRewards(stake: StakeData): number {
    const now = Date.now()
    const timeElapsed = (now - stake.lastClaimTimestamp) / 1000 // seconds
    const secondsPerYear = 365 * 24 * 60 * 60

    const annualReward = stake.amountStaked * (stake.currentAPY / 100)
    const rewards = (annualReward * timeElapsed) / secondsPerYear

    return rewards
  }

  async stake(
    userPubkey: PublicKey,
    amount: number,
    lockPeriod: LockPeriod
  ): Promise<string> {
    if (amount < 100) {
      throw new Error('Minimum stake amount is 100 PYUSD')
    }

    const stakes = this.getStakes()
    const userAddress = userPubkey.toString()
    const existingStake = stakes.find(s => s.owner === userAddress)

    const now = Date.now()
    const tier = this.calculateTier(amount)
    const effectiveAPY = this.calculateEffectiveAPY(amount, lockPeriod)

    if (existingStake) {
      // Update existing stake
      const pending = this.calculatePendingRewards(existingStake)
      existingStake.pendingRewards += pending
      existingStake.amountStaked += amount
      existingStake.tier = this.calculateTier(existingStake.amountStaked)
      existingStake.currentAPY = this.calculateEffectiveAPY(existingStake.amountStaked, lockPeriod)
      existingStake.lockPeriod = lockPeriod
      existingStake.lockEndTime = lockPeriod === 'none' ? 0 : now + LOCK_DURATIONS[lockPeriod]
      existingStake.lastClaimTimestamp = now
    } else {
      // Create new stake
      const stakeId = `stake_${now}_${Math.random().toString(36).substr(2, 9)}`
      const newStake: StakeData = {
        id: stakeId,
        owner: userAddress,
        amountStaked: amount,
        pendingRewards: 0,
        totalClaimed: 0,
        stakeTimestamp: now,
        lastClaimTimestamp: now,
        lockEndTime: lockPeriod === 'none' ? 0 : now + LOCK_DURATIONS[lockPeriod],
        lockPeriod,
        tier,
        currentAPY: effectiveAPY,
      }
      stakes.push(newStake)
    }

    this.saveStakes(stakes)

    // Update pool stats
    const poolStats = this.getPoolStatsData()
    poolStats.totalStaked += amount
    if (!existingStake) {
      poolStats.totalStakers += 1
    }
    this.savePoolStats(poolStats)

    return existingStake?.id || stakes[stakes.length - 1].id
  }

  async claimRewards(userPubkey: PublicKey): Promise<number> {
    const stakes = this.getStakes()
    const userAddress = userPubkey.toString()
    const stake = stakes.find(s => s.owner === userAddress)

    if (!stake) {
      throw new Error('No active stake found')
    }

    const pending = this.calculatePendingRewards(stake)
    const totalRewards = stake.pendingRewards + pending

    if (totalRewards === 0) {
      throw new Error('No rewards to claim')
    }

    stake.totalClaimed += totalRewards
    stake.pendingRewards = 0
    stake.lastClaimTimestamp = Date.now()

    this.saveStakes(stakes)

    // Update pool stats
    const poolStats = this.getPoolStatsData()
    poolStats.totalRewardsDistributed += totalRewards
    this.savePoolStats(poolStats)

    return totalRewards
  }

  async unstake(userPubkey: PublicKey, amount: number): Promise<void> {
    const stakes = this.getStakes()
    const userAddress = userPubkey.toString()
    const stakeIndex = stakes.findIndex(s => s.owner === userAddress)

    if (stakeIndex === -1) {
      throw new Error('No active stake found')
    }

    const stake = stakes[stakeIndex]

    // Check lock period
    if (stake.lockEndTime > 0 && Date.now() < stake.lockEndTime) {
      const daysRemaining = Math.ceil((stake.lockEndTime - Date.now()) / (24 * 60 * 60 * 1000))
      throw new Error(`Stake is locked for ${daysRemaining} more days`)
    }

    if (amount > stake.amountStaked) {
      throw new Error('Insufficient staked amount')
    }

    // Update stake or remove if fully unstaked
    if (amount >= stake.amountStaked) {
      stakes.splice(stakeIndex, 1)

      // Update pool stats
      const poolStats = this.getPoolStatsData()
      poolStats.totalStaked -= stake.amountStaked
      poolStats.totalStakers -= 1
      this.savePoolStats(poolStats)
    } else {
      stake.amountStaked -= amount
      stake.tier = this.calculateTier(stake.amountStaked)
      stake.currentAPY = this.calculateEffectiveAPY(stake.amountStaked, stake.lockPeriod)

      // Update pool stats
      const poolStats = this.getPoolStatsData()
      poolStats.totalStaked -= amount
      this.savePoolStats(poolStats)
    }

    this.saveStakes(stakes)
  }

  async compound(userPubkey: PublicKey): Promise<void> {
    const stakes = this.getStakes()
    const userAddress = userPubkey.toString()
    const stake = stakes.find(s => s.owner === userAddress)

    if (!stake) {
      throw new Error('No active stake found')
    }

    const pending = this.calculatePendingRewards(stake)
    const totalRewards = stake.pendingRewards + pending

    if (totalRewards === 0) {
      throw new Error('No rewards to compound')
    }

    // Add rewards to staked amount
    stake.amountStaked += totalRewards
    stake.tier = this.calculateTier(stake.amountStaked)
    stake.currentAPY = this.calculateEffectiveAPY(stake.amountStaked, stake.lockPeriod)
    stake.pendingRewards = 0
    stake.lastClaimTimestamp = Date.now()

    this.saveStakes(stakes)

    // Update pool stats
    const poolStats = this.getPoolStatsData()
    poolStats.totalStaked += totalRewards
    this.savePoolStats(poolStats)
  }

  getUserStake(userPubkey: PublicKey): StakeData | null {
    const stakes = this.getStakes()
    const userAddress = userPubkey.toString()
    const stake = stakes.find(s => s.owner === userAddress)

    if (!stake) return null

    // Calculate current pending rewards
    const pending = this.calculatePendingRewards(stake)
    return {
      ...stake,
      pendingRewards: stake.pendingRewards + pending,
    }
  }

  getPoolStats(): PoolStats {
    return this.getPoolStatsData()
  }

  getAllStakes(): StakeData[] {
    return this.getStakes().map(stake => ({
      ...stake,
      pendingRewards: stake.pendingRewards + this.calculatePendingRewards(stake),
    }))
  }
}

export const stakingManager = new StakingManager()
