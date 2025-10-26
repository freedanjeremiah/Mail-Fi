use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, Copy, PartialEq)]
pub enum LockPeriod {
    None,
    ThirtyDays,
    NinetyDays,
    OneEightyDays,
}

impl LockPeriod {
    pub fn to_seconds(&self) -> i64 {
        match self {
            LockPeriod::None => 0,
            LockPeriod::ThirtyDays => 30 * 24 * 60 * 60,
            LockPeriod::NinetyDays => 90 * 24 * 60 * 60,
            LockPeriod::OneEightyDays => 180 * 24 * 60 * 60,
        }
    }

    pub fn multiplier(&self) -> u64 {
        match self {
            LockPeriod::None => 100,        // 1.0x (100%)
            LockPeriod::ThirtyDays => 130,  // 1.3x (130%)
            LockPeriod::NinetyDays => 170,  // 1.7x (170%)
            LockPeriod::OneEightyDays => 250, // 2.5x (250%)
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakingPool {
    pub mint: Pubkey,
    pub reward_rate_per_second: u64,
    pub total_staked: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl StakingPool {
    pub const MAX_SIZE: usize = 32 + 8 + 8 + 8 + 1;
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct UserStake {
    pub user: Pubkey,
    pub staking_pool: Pubkey,
    pub amount: u64,
    pub lock_period: LockPeriod,
    pub lock_end_time: i64,
    pub last_claim_time: i64,
    pub total_claimed: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl UserStake {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1 + 8 + 8 + 8 + 8 + 1;

    pub fn calculate_tier_apy(&self) -> u64 {
        // Base APY based on stake amount (in basis points, 1% = 100)
        let base_apy = if self.amount >= 50_000_000_000 {
            // >= 50,000 PYUSD (Diamond)
            4000 // 40%
        } else if self.amount >= 10_000_000_000 {
            // >= 10,000 PYUSD (Gold)
            2500 // 25%
        } else if self.amount >= 1_000_000_000 {
            // >= 1,000 PYUSD (Silver)
            1500 // 15%
        } else if self.amount >= 100_000_000 {
            // >= 100 PYUSD (Bronze)
            800 // 8%
        } else {
            0
        };

        // Apply lock period multiplier
        (base_apy * self.lock_period.multiplier()) / 100
    }

    pub fn calculate_pending_rewards(&self, current_time: i64) -> u64 {
        if self.amount == 0 {
            return 0;
        }

        let time_elapsed = current_time.saturating_sub(self.last_claim_time);
        if time_elapsed <= 0 {
            return 0;
        }

        let apy = self.calculate_tier_apy();

        // Calculate rewards: (amount * APY * time_elapsed) / (365 days * 10000)
        // APY is in basis points (1% = 100)
        let seconds_per_year = 365 * 24 * 60 * 60;
        let rewards = (self.amount as u128)
            .saturating_mul(apy as u128)
            .saturating_mul(time_elapsed as u128)
            / (seconds_per_year as u128 * 10000);

        rewards as u64
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InitializeStakingPoolArgs {
    pub reward_rate_per_second: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakeArgs {
    pub amount: u64,
    pub lock_period: LockPeriod,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct UnstakeArgs {
    pub amount: u64,
}

pub fn process_initialize_staking_pool(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_pool_account = next_account_info(accounts_iter)?;
    let mint_account = next_account_info(accounts_iter)?;
    let authority = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !authority.is_signer {
        msg!("Authority must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = InitializeStakingPoolArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let clock = Clock::get()?;

    // Derive PDA
    let (pool_pda, bump) = Pubkey::find_program_address(
        &[b"staking_pool", mint_account.key.as_ref()],
        program_id,
    );

    if pool_pda != *staking_pool_account.key {
        msg!("Invalid staking pool PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Create staking pool account
    let rent = Rent::get()?;
    let space = StakingPool::MAX_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            authority.key,
            staking_pool_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[authority.clone(), staking_pool_account.clone(), system_program.clone()],
        &[&[b"staking_pool", mint_account.key.as_ref(), &[bump]]],
    )?;

    // Initialize pool data
    let pool_data = StakingPool {
        mint: *mint_account.key,
        reward_rate_per_second: args.reward_rate_per_second,
        total_staked: 0,
        created_at: clock.unix_timestamp,
        bump,
    };

    pool_data.serialize(&mut &mut staking_pool_account.data.borrow_mut()[..])?;

    msg!("Staking pool initialized successfully!");

    Ok(())
}

pub fn process_stake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_pool_account = next_account_info(accounts_iter)?;
    let user_stake_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let pool_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !user.is_signer {
        msg!("User must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = StakeArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let clock = Clock::get()?;

    // Load or create pool
    let mut pool_data = StakingPool::try_from_slice(&staking_pool_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Derive user stake PDA
    let (stake_pda, bump) = Pubkey::find_program_address(
        &[
            b"user_stake",
            staking_pool_account.key.as_ref(),
            user.key.as_ref(),
        ],
        program_id,
    );

    if stake_pda != *user_stake_account.key {
        msg!("Invalid user stake PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Check if stake account exists
    let is_new_stake = user_stake_account.data_len() == 0;

    if is_new_stake {
        // Create new stake account
        let rent = Rent::get()?;
        let space = UserStake::MAX_SIZE;
        let lamports = rent.minimum_balance(space);

        invoke_signed(
            &system_instruction::create_account(
                user.key,
                user_stake_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[user.clone(), user_stake_account.clone(), system_program.clone()],
            &[&[
                b"user_stake",
                staking_pool_account.key.as_ref(),
                user.key.as_ref(),
                &[bump],
            ]],
        )?;

        // Initialize stake data
        let lock_end_time = clock.unix_timestamp + args.lock_period.to_seconds();

        let stake_data = UserStake {
            user: *user.key,
            staking_pool: *staking_pool_account.key,
            amount: args.amount,
            lock_period: args.lock_period,
            lock_end_time,
            last_claim_time: clock.unix_timestamp,
            total_claimed: 0,
            created_at: clock.unix_timestamp,
            bump,
        };

        stake_data.serialize(&mut &mut user_stake_account.data.borrow_mut()[..])?;
    } else {
        // Update existing stake
        let mut stake_data = UserStake::try_from_slice(&user_stake_account.data.borrow())
            .map_err(|_| ProgramError::InvalidAccountData)?;

        // Claim any pending rewards first
        let pending = stake_data.calculate_pending_rewards(clock.unix_timestamp);
        if pending > 0 {
            stake_data.total_claimed = stake_data.total_claimed.saturating_add(pending);
        }

        // Update stake
        stake_data.amount = stake_data.amount.saturating_add(args.amount);
        stake_data.lock_period = args.lock_period;
        stake_data.lock_end_time = clock.unix_timestamp + args.lock_period.to_seconds();
        stake_data.last_claim_time = clock.unix_timestamp;

        stake_data.serialize(&mut &mut user_stake_account.data.borrow_mut()[..])?;
    }

    // Transfer tokens to pool
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        user_token_account.key,
        &spl_token_2022::id(),
        pool_token_account.key,
        user.key,
        &[],
        args.amount,
        6,
    )?;

    invoke(
        &transfer_instruction,
        &[
            user_token_account.clone(),
            pool_token_account.clone(),
            user.clone(),
            token_program.clone(),
        ],
    )?;

    // Update pool total
    pool_data.total_staked = pool_data.total_staked.saturating_add(args.amount);
    pool_data.serialize(&mut &mut staking_pool_account.data.borrow_mut()[..])?;

    msg!("Staked successfully!");

    Ok(())
}

pub fn process_claim_rewards(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_pool_account = next_account_info(accounts_iter)?;
    let user_stake_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;
    let pool_token_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !user.is_signer {
        msg!("User must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let clock = Clock::get()?;

    // Load pool
    let pool_data = StakingPool::try_from_slice(&staking_pool_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Load stake
    let mut stake_data = UserStake::try_from_slice(&user_stake_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if stake_data.user != *user.key {
        msg!("Invalid user for stake account");
        return Err(ProgramError::InvalidAccountData);
    }

    // Calculate rewards
    let rewards = stake_data.calculate_pending_rewards(clock.unix_timestamp);

    if rewards == 0 {
        msg!("No rewards to claim");
        return Err(ProgramError::InvalidAccountData);
    }

    // Transfer rewards using pool PDA
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        pool_token_account.key,
        &spl_token_2022::id(),
        user_token_account.key,
        staking_pool_account.key, // PDA authority
        &[],
        rewards,
        6,
    )?;

    invoke_signed(
        &transfer_instruction,
        &[
            pool_token_account.clone(),
            user_token_account.clone(),
            staking_pool_account.clone(),
            token_program.clone(),
        ],
        &[&[b"staking_pool", pool_data.mint.as_ref(), &[pool_data.bump]]],
    )?;

    // Update stake
    stake_data.total_claimed = stake_data.total_claimed.saturating_add(rewards);
    stake_data.last_claim_time = clock.unix_timestamp;
    stake_data.serialize(&mut &mut user_stake_account.data.borrow_mut()[..])?;

    msg!("Rewards claimed: {}", rewards);

    Ok(())
}

pub fn process_unstake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_pool_account = next_account_info(accounts_iter)?;
    let user_stake_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;
    let pool_token_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !user.is_signer {
        msg!("User must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = UnstakeArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    let clock = Clock::get()?;

    // Load pool
    let mut pool_data = StakingPool::try_from_slice(&staking_pool_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Load stake
    let mut stake_data = UserStake::try_from_slice(&user_stake_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if stake_data.user != *user.key {
        msg!("Invalid user for stake account");
        return Err(ProgramError::InvalidAccountData);
    }

    // Check lock period
    if clock.unix_timestamp < stake_data.lock_end_time {
        msg!("Stake is still locked");
        return Err(ProgramError::InvalidAccountData);
    }

    if args.amount > stake_data.amount {
        msg!("Insufficient staked amount");
        return Err(ProgramError::InsufficientFunds);
    }

    // Transfer staked tokens back
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        pool_token_account.key,
        &spl_token_2022::id(),
        user_token_account.key,
        staking_pool_account.key,
        &[],
        args.amount,
        6,
    )?;

    invoke_signed(
        &transfer_instruction,
        &[
            pool_token_account.clone(),
            user_token_account.clone(),
            staking_pool_account.clone(),
            token_program.clone(),
        ],
        &[&[b"staking_pool", pool_data.mint.as_ref(), &[pool_data.bump]]],
    )?;

    // Update stake
    stake_data.amount = stake_data.amount.saturating_sub(args.amount);
    stake_data.serialize(&mut &mut user_stake_account.data.borrow_mut()[..])?;

    // Update pool
    pool_data.total_staked = pool_data.total_staked.saturating_sub(args.amount);
    pool_data.serialize(&mut &mut staking_pool_account.data.borrow_mut()[..])?;

    msg!("Unstaked successfully: {}", args.amount);

    Ok(())
}

pub fn process_compound_rewards(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_pool_account = next_account_info(accounts_iter)?;
    let user_stake_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;

    if !user.is_signer {
        msg!("User must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let clock = Clock::get()?;

    // Load pool
    let mut pool_data = StakingPool::try_from_slice(&staking_pool_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Load stake
    let mut stake_data = UserStake::try_from_slice(&user_stake_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if stake_data.user != *user.key {
        msg!("Invalid user for stake account");
        return Err(ProgramError::InvalidAccountData);
    }

    // Calculate rewards
    let rewards = stake_data.calculate_pending_rewards(clock.unix_timestamp);

    if rewards == 0 {
        msg!("No rewards to compound");
        return Err(ProgramError::InvalidAccountData);
    }

    // Add rewards to stake amount
    stake_data.amount = stake_data.amount.saturating_add(rewards);
    stake_data.total_claimed = stake_data.total_claimed.saturating_add(rewards);
    stake_data.last_claim_time = clock.unix_timestamp;
    stake_data.serialize(&mut &mut user_stake_account.data.borrow_mut()[..])?;

    msg!("Rewards compounded: {}", rewards);
    msg!("New stake amount: {}", stake_data.amount);

    Ok(())
}
