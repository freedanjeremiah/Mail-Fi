'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import Link from 'next/link'
import { stakingManager, StakeData, LockPeriod } from '@/lib/staking-manager'

const PYUSD_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM')

export default function StakingPage() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const [pyusdBalance, setPyusdBalance] = useState<number>(0)
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<LockPeriod>('none')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' }>()
  const [userStake, setUserStake] = useState<StakeData | null>(null)
  const [poolStats, setPoolStats] = useState({
    totalStaked: 0,
    totalStakers: 0,
    averageAPY: 22,
  })

  useEffect(() => {
    if (publicKey) {
      loadStakingData()
      loadPYUSDBalance()
    }
  }, [publicKey])

  const loadPYUSDBalance = async () => {
    if (!publicKey) return
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: PYUSD_MINT,
        programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
      })
      if (tokenAccounts.value.length > 0) {
        const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
        setPyusdBalance(balance || 0)
      }
    } catch (error) {
      console.error('Error loading PYUSD balance:', error)
    }
  }

  const loadStakingData = () => {
    if (!publicKey) return
    const stake = stakingManager.getUserStake(publicKey)
    setUserStake(stake)

    const stats = stakingManager.getPoolStats()
    setPoolStats(stats)
  }

  const getTierName = (amount: number): string => {
    if (amount >= 50000) return '💎 Diamond'
    if (amount >= 10000) return '🏆 Gold'
    if (amount >= 1000) return '🥈 Silver'
    return '🥉 Bronze'
  }

  const getTierAPY = (amount: number): number => {
    if (amount >= 50000) return 40
    if (amount >= 10000) return 25
    if (amount >= 1000) return 15
    return 8
  }

  const getLockMultiplier = (lockPeriod: LockPeriod): number => {
    switch (lockPeriod) {
      case '180days': return 2.5
      case '90days': return 1.7
      case '30days': return 1.3
      default: return 1.0
    }
  }

  const calculateEstimatedAPY = (): number => {
    const amount = parseFloat(stakeAmount) || 0
    const baseAPY = getTierAPY(amount)
    const multiplier = getLockMultiplier(selectedLockPeriod)
    return baseAPY * multiplier
  }

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey || !stakeAmount) return

    setLoading(true)
    setStatus({ message: 'Creating stake...', type: 'info' })

    try {
      const amount = parseFloat(stakeAmount)
      await stakingManager.stake(publicKey, amount, selectedLockPeriod)

      setStatus({
        message: `Successfully staked ${amount} PYUSD!`,
        type: 'success'
      })

      setStakeAmount('')
      loadStakingData()
      loadPYUSDBalance()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimRewards = async () => {
    if (!publicKey || !userStake) return

    setLoading(true)
    setStatus({ message: 'Claiming rewards...', type: 'info' })

    try {
      await stakingManager.claimRewards(publicKey)
      setStatus({
        message: `Successfully claimed ${userStake.pendingRewards.toFixed(2)} PYUSD!`,
        type: 'success'
      })
      loadStakingData()
      loadPYUSDBalance()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCompound = async () => {
    if (!publicKey) return

    setLoading(true)
    setStatus({ message: 'Compounding rewards...', type: 'info' })

    try {
      await stakingManager.compound(publicKey)
      setStatus({
        message: 'Successfully compounded rewards into your stake!',
        type: 'success'
      })
      loadStakingData()
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!publicKey || !userStake) return

    if (confirm('Are you sure you want to unstake all your PYUSD?')) {
      setLoading(true)
      setStatus({ message: 'Unstaking...', type: 'info' })

      try {
        await stakingManager.unstake(publicKey, userStake.amountStaked)
        setStatus({
          message: `Successfully unstaked ${userStake.amountStaked} PYUSD!`,
          type: 'success'
        })
        loadStakingData()
        loadPYUSDBalance()
      } catch (error: any) {
        setStatus({ message: error.message, type: 'error' })
      } finally {
        setLoading(false)
      }
    }
  }

  const getLockPeriodDisplay = (lockPeriod: LockPeriod): string => {
    switch (lockPeriod) {
      case '30days': return '30 Days'
      case '90days': return '90 Days'
      case '180days': return '180 Days'
      default: return 'Flexible'
    }
  }

  const getDaysRemaining = (lockEndTime: number): number => {
    const remaining = lockEndTime - Date.now()
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">💰 PYUSD Manifesto - Staking</h1>
          <p className="text-xl text-purple-200">Stake PYUSD and earn passive rewards</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Send PYUSD
            </Link>
            <Link href="/escrow" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Escrow
            </Link>
            <Link href="/recurring" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Recurring
            </Link>
            <Link href="/multisig" className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Multisig
            </Link>
            <Link href="/staking" className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Staking
            </Link>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex justify-center">
            <WalletMultiButton />
          </div>
        </div>

        {publicKey && (
          <>
            {/* Pool Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl p-6 text-white">
                <div className="text-sm opacity-80 mb-2">Total Value Locked</div>
                <div className="text-3xl font-bold">${(poolStats.totalStaked * 1).toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
                <div className="text-sm opacity-80 mb-2">Total Stakers</div>
                <div className="text-3xl font-bold">{poolStats.totalStakers.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-2xl p-6 text-white">
                <div className="text-sm opacity-80 mb-2">Average APY</div>
                <div className="text-3xl font-bold">{poolStats.averageAPY}%</div>
              </div>
            </div>

            {/* User Staking Overview */}
            {userStake && (
              <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
                <h2 className="text-2xl font-bold mb-6">📊 Your Staking Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-sm text-gray-600 mb-2">Staked Amount</div>
                    <div className="text-3xl font-bold text-purple-600">{userStake.amountStaked.toFixed(2)} PYUSD</div>
                    <div className="text-sm text-gray-600 mt-2">{getTierName(userStake.amountStaked)} Tier</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-sm text-gray-600 mb-2">Current APY</div>
                    <div className="text-3xl font-bold text-green-600">{userStake.currentAPY.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 mt-2">{getLockPeriodDisplay(userStake.lockPeriod)} Lock</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-sm text-gray-600 mb-2">Pending Rewards</div>
                    <div className="text-3xl font-bold text-yellow-600">{userStake.pendingRewards.toFixed(4)} PYUSD</div>
                    <div className="text-sm text-gray-600 mt-2">H ${(userStake.pendingRewards * 1).toFixed(2)}</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="text-sm text-gray-600 mb-2">Total Claimed</div>
                    <div className="text-3xl font-bold text-blue-600">{userStake.totalClaimed.toFixed(2)} PYUSD</div>
                    {userStake.lockEndTime > Date.now() && (
                      <div className="text-sm text-orange-600 mt-2">
                        = Unlocks in {getDaysRemaining(userStake.lockEndTime)} days
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={handleClaimRewards}
                    disabled={loading || userStake.pendingRewards === 0}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Claim Rewards
                  </button>
                  <button
                    onClick={handleCompound}
                    disabled={loading || userStake.pendingRewards === 0}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold py-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Compound
                  </button>
                  <button
                    onClick={handleUnstake}
                    disabled={loading || (userStake.lockEndTime > Date.now())}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {userStake.lockEndTime > Date.now() ? '🔒  Locked' : 'Unstake'}
                  </button>
                </div>
              </div>
            )}

            {/* Staking Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6">🔒 Stake PYUSD</h2>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="text-sm text-blue-800">
                  <strong>Your PYUSD Balance:</strong> {pyusdBalance.toFixed(2)} PYUSD
                </div>
              </div>

              <form onSubmit={handleStake}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Select Lock Period</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedLockPeriod('none')}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedLockPeriod === 'none'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">Flexible</div>
                      <div className="text-sm text-gray-600">Withdraw anytime</div>
                      <div className="text-lg font-bold text-purple-600 mt-2">1.0x</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLockPeriod('30days')}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedLockPeriod === '30days'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">30 Days</div>
                      <div className="text-sm text-gray-600">+30% Boost</div>
                      <div className="text-lg font-bold text-purple-600 mt-2">1.3x</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLockPeriod('90days')}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedLockPeriod === '90days'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">90 Days</div>
                      <div className="text-sm text-gray-600">+70% Boost</div>
                      <div className="text-lg font-bold text-purple-600 mt-2">1.7x</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedLockPeriod('180days')}
                      className={`p-4 rounded-lg border-2 transition ${
                        selectedLockPeriod === '180days'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">180 Days</div>
                      <div className="text-sm text-gray-600">+150% Boost</div>
                      <div className="text-lg font-bold text-purple-600 mt-2">2.5x</div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Amount to Stake (PYUSD)</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="100"
                    required
                  />
                  <div className="text-sm text-gray-600 mt-2">
                    Minimum: 100 PYUSD
                  </div>
                </div>

                {stakeAmount && parseFloat(stakeAmount) >= 100 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold mb-4">Estimated Returns</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Tier</div>
                        <div className="text-lg font-bold text-purple-600">
                          {getTierName(parseFloat(stakeAmount))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Estimated APY</div>
                        <div className="text-lg font-bold text-green-600">
                          {calculateEstimatedAPY().toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Monthly Rewards</div>
                        <div className="text-lg font-bold text-yellow-600">
                          {((parseFloat(stakeAmount) * calculateEstimatedAPY() / 100) / 12).toFixed(2)} PYUSD
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Yearly Rewards</div>
                        <div className="text-lg font-bold text-blue-600">
                          {(parseFloat(stakeAmount) * calculateEstimatedAPY() / 100).toFixed(2)} PYUSD
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Processing...' : 'Stake PYUSD'}
                </button>
              </form>

              {status && (
                <div className={`mt-6 p-4 rounded-lg ${
                  status.type === 'success' ? 'bg-green-100 text-green-800' :
                  status.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {status.message}
                </div>
              )}
            </div>

            {/* Tier Information */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">🏅 Staking Tiers & Rewards</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-6">
                  <div className="text-2xl mb-2">🥉</div>
                  <div className="font-bold text-lg mb-2">Bronze</div>
                  <div className="text-sm text-gray-700 mb-4">100 - 999 PYUSD</div>
                  <div className="text-2xl font-bold text-orange-700">8% APY</div>
                </div>

                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-6">
                  <div className="text-2xl mb-2">🥈</div>
                  <div className="font-bold text-lg mb-2">Silver</div>
                  <div className="text-sm text-gray-700 mb-4">1,000 - 9,999 PYUSD</div>
                  <div className="text-2xl font-bold text-gray-700">15% APY</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-6">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-bold text-lg mb-2">Gold</div>
                  <div className="text-sm text-gray-700 mb-4">10,000 - 49,999 PYUSD</div>
                  <div className="text-2xl font-bold text-yellow-700">25% APY</div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-purple-200 rounded-xl p-6">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="font-bold text-lg mb-2">Diamond</div>
                  <div className="text-sm text-gray-700 mb-4">50,000+ PYUSD</div>
                  <div className="text-2xl font-bold text-purple-700">40% APY</div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">How Staking Works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Choose your staking amount and lock period</li>
                  <li>Higher amounts unlock better tier rewards (Bronze to Diamond)</li>
                  <li>Longer lock periods provide bonus multipliers (up to 2.5x)</li>
                  <li>Rewards are calculated and distributed continuously</li>
                  <li>Claim anytime or auto-compound to increase your stake</li>
                  <li>Unstake after lock period ends (or anytime if flexible)</li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
