use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

use crate::ErrorCode;

// Staking tiers
pub const TIER_BRONZE_MIN: u64 = 100_000_000;      // 100 PYUSD (6 decimals)
pub const TIER_SILVER_MIN: u64 = 1_000_000_000;    // 1,000 PYUSD
pub const TIER_GOLD_MIN: u64 = 10_000_000_000;     // 10,000 PYUSD
pub const TIER_DIAMOND_MIN: u64 = 50_000_000_000;  // 50,000 PYUSD

// APY rates (basis points: 800 = 8%)
pub const BRONZE_APY: u64 = 800;    // 8%
pub const SILVER_APY: u64 = 1500;   // 15%
pub const GOLD_APY: u64 = 2500;     // 25%
pub const DIAMOND_APY: u64 = 4000;  // 40%

// Lock period multipliers (basis points: 1000 = 1.0x)
pub const NO_LOCK_MULTIPLIER: u64 = 1000;      // 1.0x
pub const LOCK_30_MULTIPLIER: u64 = 1300;      // 1.3x
pub const LOCK_90_MULTIPLIER: u64 = 1700;      // 1.7x
pub const LOCK_180_MULTIPLIER: u64 = 2500;     // 2.5x

// Lock durations in seconds
pub const LOCK_30_DAYS: i64 = 30 * 24 * 60 * 60;
pub const LOCK_90_DAYS: i64 = 90 * 24 * 60 * 60;
pub const LOCK_180_DAYS: i64 = 180 * 24 * 60 * 60;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum StakingTier {
    Bronze,
    Silver,
    Gold,
    Diamond,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum LockPeriod {
    None,
    ThirtyDays,
    NinetyDays,
    OneEightyDays,
}

// ==================== INITIALIZE STAKING POOL ====================

#[derive(Accounts)]
pub struct InitializeStakingPool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"staking_pool", reward_mint.key().as_ref()],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub reward_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

// ==================== STAKE TOKENS ====================

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.reward_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        associated_token::mint = stake_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = stake_mint,
        associated_token::authority = staking_pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub stake_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ==================== CLAIM REWARDS ====================

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.reward_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = staking_pool,
    )]
    pub pool_reward_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub reward_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ==================== UNSTAKE TOKENS ====================

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.reward_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump,
        close = user
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        associated_token::mint = stake_mint,
        associated_token::authority = staking_pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = stake_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub stake_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

// ==================== COMPOUND REWARDS ====================

#[derive(Accounts)]
pub struct CompoundRewards<'info> {
    #[account(
        mut,
        seeds = [b"staking_pool", staking_pool.reward_mint.as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", staking_pool.key().as_ref(), user.key().as_ref()],
        bump = user_stake.bump
    )]
    pub user_stake: Account<'info, UserStake>,

    pub user: Signer<'info>,
}

// ==================== ACCOUNT STRUCTS ====================

#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub total_staked: u64,
    pub total_rewards_distributed: u64,
    pub reward_rate_per_second: u64,  // Rewards per second (scaled by 1e9)
    pub created_at: i64,
    pub last_update: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserStake {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount_staked: u64,
    pub pending_rewards: u64,
    pub rewards_claimed: u64,
    pub stake_timestamp: i64,
    pub last_claim_timestamp: i64,
    pub lock_end_time: i64,
    pub lock_period: LockPeriod,
    pub tier: StakingTier,
    pub bump: u8,
}

// ==================== HELPER FUNCTIONS ====================

impl UserStake {
    pub fn calculate_tier(amount: u64) -> StakingTier {
        if amount >= TIER_DIAMOND_MIN {
            StakingTier::Diamond
        } else if amount >= TIER_GOLD_MIN {
            StakingTier::Gold
        } else if amount >= TIER_SILVER_MIN {
            StakingTier::Silver
        } else {
            StakingTier::Bronze
        }
    }

    pub fn get_base_apy(&self) -> u64 {
        match self.tier {
            StakingTier::Bronze => BRONZE_APY,
            StakingTier::Silver => SILVER_APY,
            StakingTier::Gold => GOLD_APY,
            StakingTier::Diamond => DIAMOND_APY,
        }
    }

    pub fn get_lock_multiplier(&self) -> u64 {
        match self.lock_period {
            LockPeriod::None => NO_LOCK_MULTIPLIER,
            LockPeriod::ThirtyDays => LOCK_30_MULTIPLIER,
            LockPeriod::NinetyDays => LOCK_90_MULTIPLIER,
            LockPeriod::OneEightyDays => LOCK_180_MULTIPLIER,
        }
    }

    pub fn calculate_pending_rewards(&self, current_time: i64) -> Result<u64> {
        let time_elapsed = current_time
            .checked_sub(self.last_claim_timestamp)
            .ok_or(ErrorCode::InvalidCalculation)?;

        if time_elapsed <= 0 {
            return Ok(0);
        }

        // Calculate base rewards: (amount * apy * time) / (365 days * 10000)
        let base_apy = self.get_base_apy();
        let multiplier = self.get_lock_multiplier();

        // Effective APY = base_apy * multiplier / 1000
        let effective_apy = base_apy
            .checked_mul(multiplier)
            .ok_or(ErrorCode::InvalidCalculation)?
            .checked_div(1000)
            .ok_or(ErrorCode::InvalidCalculation)?;

        let annual_reward = self.amount_staked
            .checked_mul(effective_apy)
            .ok_or(ErrorCode::InvalidCalculation)?
            .checked_div(10000)
            .ok_or(ErrorCode::InvalidCalculation)?;

        let seconds_per_year = 365 * 24 * 60 * 60;
        let rewards = annual_reward
            .checked_mul(time_elapsed as u64)
            .ok_or(ErrorCode::InvalidCalculation)?
            .checked_div(seconds_per_year)
            .ok_or(ErrorCode::InvalidCalculation)?;

        Ok(rewards)
    }
}

// ==================== INSTRUCTION HANDLERS ====================

pub fn initialize_staking_pool(
    ctx: Context<InitializeStakingPool>,
    reward_rate_per_second: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.staking_pool;
    let clock = Clock::get()?;

    pool.authority = ctx.accounts.authority.key();
    pool.reward_mint = ctx.accounts.reward_mint.key();
    pool.total_staked = 0;
    pool.total_rewards_distributed = 0;
    pool.reward_rate_per_second = reward_rate_per_second;
    pool.created_at = clock.unix_timestamp;
    pool.last_update = clock.unix_timestamp;
    pool.bump = ctx.bumps.staking_pool;

    msg!("Staking pool initialized with reward rate: {} per second", reward_rate_per_second);
    Ok(())
}

pub fn stake(
    ctx: Context<Stake>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake;
    let pool = &mut ctx.accounts.staking_pool;
    let clock = Clock::get()?;

    // If first time staking, initialize
    if user_stake.amount_staked == 0 {
        user_stake.owner = ctx.accounts.user.key();
        user_stake.pool = pool.key();
        user_stake.stake_timestamp = clock.unix_timestamp;
        user_stake.last_claim_timestamp = clock.unix_timestamp;
        user_stake.rewards_claimed = 0;
        user_stake.pending_rewards = 0;
        user_stake.bump = ctx.bumps.user_stake;
    } else {
        // Calculate and add pending rewards before increasing stake
        let pending = user_stake.calculate_pending_rewards(clock.unix_timestamp)?;
        user_stake.pending_rewards = user_stake.pending_rewards
            .checked_add(pending)
            .ok_or(ErrorCode::InvalidCalculation)?;
    }

    // Update stake amount
    user_stake.amount_staked = user_stake.amount_staked
        .checked_add(amount)
        .ok_or(ErrorCode::InvalidCalculation)?;

    // Update tier based on new amount
    user_stake.tier = UserStake::calculate_tier(user_stake.amount_staked);

    // Set lock period
    user_stake.lock_period = lock_period;
    user_stake.lock_end_time = match lock_period {
        LockPeriod::None => 0,
        LockPeriod::ThirtyDays => clock.unix_timestamp + LOCK_30_DAYS,
        LockPeriod::NinetyDays => clock.unix_timestamp + LOCK_90_DAYS,
        LockPeriod::OneEightyDays => clock.unix_timestamp + LOCK_180_DAYS,
    };

    user_stake.last_claim_timestamp = clock.unix_timestamp;

    // Transfer tokens from user to pool
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.pool_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Update pool stats
    pool.total_staked = pool.total_staked
        .checked_add(amount)
        .ok_or(ErrorCode::InvalidCalculation)?;
    pool.last_update = clock.unix_timestamp;

    msg!(
        "Staked {} tokens. New tier: {:?}. Lock period: {:?}",
        amount,
        user_stake.tier,
        user_stake.lock_period
    );
    Ok(())
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake;
    let pool = &mut ctx.accounts.staking_pool;
    let clock = Clock::get()?;

    // Calculate total claimable rewards
    let pending = user_stake.calculate_pending_rewards(clock.unix_timestamp)?;
    let total_rewards = user_stake.pending_rewards
        .checked_add(pending)
        .ok_or(ErrorCode::InvalidCalculation)?;

    require!(total_rewards > 0, ErrorCode::NoRewardsToClaim);

    // Transfer rewards from pool to user
    let seeds = &[
        b"staking_pool",
        pool.reward_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_reward_account.to_account_info(),
        to: ctx.accounts.user_reward_account.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, total_rewards)?;

    // Update user stake
    user_stake.rewards_claimed = user_stake.rewards_claimed
        .checked_add(total_rewards)
        .ok_or(ErrorCode::InvalidCalculation)?;
    user_stake.pending_rewards = 0;
    user_stake.last_claim_timestamp = clock.unix_timestamp;

    // Update pool stats
    pool.total_rewards_distributed = pool.total_rewards_distributed
        .checked_add(total_rewards)
        .ok_or(ErrorCode::InvalidCalculation)?;
    pool.last_update = clock.unix_timestamp;

    msg!("Claimed {} reward tokens", total_rewards);
    Ok(())
}

pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
    let user_stake = &ctx.accounts.user_stake;
    let pool = &mut ctx.accounts.staking_pool;
    let clock = Clock::get()?;

    // Check if lock period has ended
    if user_stake.lock_end_time > 0 {
        require!(
            clock.unix_timestamp >= user_stake.lock_end_time,
            ErrorCode::StakeStillLocked
        );
    }

    require!(
        amount <= user_stake.amount_staked,
        ErrorCode::InsufficientStake
    );

    // Transfer staked tokens back to user
    let seeds = &[
        b"staking_pool",
        pool.reward_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.pool_token_account.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    // Update pool stats
    pool.total_staked = pool.total_staked
        .checked_sub(amount)
        .ok_or(ErrorCode::InvalidCalculation)?;
    pool.last_update = clock.unix_timestamp;

    msg!("Unstaked {} tokens", amount);
    Ok(())
}

pub fn compound_rewards(ctx: Context<CompoundRewards>) -> Result<()> {
    let user_stake = &mut ctx.accounts.user_stake;
    let clock = Clock::get()?;

    // Calculate pending rewards
    let pending = user_stake.calculate_pending_rewards(clock.unix_timestamp)?;
    let total_rewards = user_stake.pending_rewards
        .checked_add(pending)
        .ok_or(ErrorCode::InvalidCalculation)?;

    require!(total_rewards > 0, ErrorCode::NoRewardsToClaim);

    // Add rewards to staked amount
    user_stake.amount_staked = user_stake.amount_staked
        .checked_add(total_rewards)
        .ok_or(ErrorCode::InvalidCalculation)?;

    // Update tier if needed
    user_stake.tier = UserStake::calculate_tier(user_stake.amount_staked);

    // Reset pending rewards
    user_stake.pending_rewards = 0;
    user_stake.last_claim_timestamp = clock.unix_timestamp;

    msg!("Compounded {} reward tokens into stake", total_rewards);
    Ok(())
}
