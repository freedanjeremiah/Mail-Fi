use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

pub mod escrow;
pub mod recurring_payment;
pub mod multisig;
pub mod staking;

pub use escrow::*;
pub use recurring_payment::*;
pub use multisig::*;
pub use staking::*;

#[program]
pub mod pyusd_manifesto_contracts {
    use super::*;

    // ==================== ESCROW/PAYMENT REQUEST ====================

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        recipient: Pubkey,
        expiry_time: i64,
        description: String,
    ) -> Result<()> {
        escrow::create_escrow(ctx, amount, recipient, expiry_time, description)
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        escrow::fund_escrow(ctx)
    }

    pub fn claim_escrow(ctx: Context<ClaimEscrow>) -> Result<()> {
        escrow::claim_escrow(ctx)
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        escrow::cancel_escrow(ctx)
    }

    // ==================== RECURRING PAYMENT ====================

    pub fn create_recurring_payment(
        ctx: Context<CreateRecurringPayment>,
        amount: u64,
        recipient: Pubkey,
        interval_seconds: i64,
        total_payments: u64,
        description: String,
    ) -> Result<()> {
        recurring_payment::create_recurring_payment(
            ctx,
            amount,
            recipient,
            interval_seconds,
            total_payments,
            description,
        )
    }

    pub fn execute_recurring_payment(ctx: Context<ExecuteRecurringPayment>) -> Result<()> {
        recurring_payment::execute_recurring_payment(ctx)
    }

    pub fn cancel_recurring_payment(ctx: Context<CancelRecurringPayment>) -> Result<()> {
        recurring_payment::cancel_recurring_payment(ctx)
    }

    // ==================== MULTISIG WALLET ====================

    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        owners: Vec<Pubkey>,
        threshold: u64,
    ) -> Result<()> {
        multisig::create_multisig(ctx, owners, threshold)
    }

    pub fn propose_transaction(
        ctx: Context<ProposeTransaction>,
        amount: u64,
        recipient: Pubkey,
        description: String,
    ) -> Result<()> {
        multisig::propose_transaction(ctx, amount, recipient, description)
    }

    pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> Result<()> {
        multisig::approve_transaction(ctx)
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
        multisig::execute_transaction(ctx)
    }

    pub fn reject_transaction(ctx: Context<RejectTransaction>) -> Result<()> {
        multisig::reject_transaction(ctx)
    }

    // ==================== STAKING/YIELD FARMING ====================

    pub fn initialize_staking_pool(
        ctx: Context<InitializeStakingPool>,
        reward_rate_per_second: u64,
    ) -> Result<()> {
        staking::initialize_staking_pool(ctx, reward_rate_per_second)
    }

    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_period: LockPeriod,
    ) -> Result<()> {
        staking::stake(ctx, amount, lock_period)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        staking::claim_rewards(ctx)
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        staking::unstake(ctx, amount)
    }

    pub fn compound_rewards(ctx: Context<CompoundRewards>) -> Result<()> {
        staking::compound_rewards(ctx)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Escrow has expired")]
    EscrowExpired,
    #[msg("Escrow has not expired yet")]
    EscrowNotExpired,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Escrow already funded")]
    AlreadyFunded,
    #[msg("Escrow not funded")]
    NotFunded,
    #[msg("Payment not due yet")]
    PaymentNotDue,
    #[msg("All payments completed")]
    AllPaymentsCompleted,
    #[msg("Insufficient approvals")]
    InsufficientApprovals,
    #[msg("Transaction already executed")]
    AlreadyExecuted,
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Too many owners")]
    TooManyOwners,
    #[msg("Owner already approved")]
    AlreadyApproved,
    #[msg("Not an owner")]
    NotAnOwner,
    #[msg("Invalid calculation")]
    InvalidCalculation,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Stake is still locked")]
    StakeStillLocked,
    #[msg("Insufficient stake amount")]
    InsufficientStake,
}
