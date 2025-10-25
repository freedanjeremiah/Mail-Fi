use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

use crate::ErrorCode;

const MAX_OWNERS: usize = 10;

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Multisig::INIT_SPACE,
        seeds = [b"multisig", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposeTransaction<'info> {
    #[account(
        mut,
        seeds = [b"multisig", multisig.creator.as_ref(), &multisig.created_at.to_le_bytes()],
        bump = multisig.bump
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(
        init,
        payer = proposer,
        space = 8 + MultisigTransaction::INIT_SPACE,
        seeds = [
            b"transaction",
            multisig.key().as_ref(),
            &multisig.transaction_count.to_le_bytes()
        ],
        bump
    )]
    pub transaction: Account<'info, MultisigTransaction>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveTransaction<'info> {
    #[account(
        seeds = [b"multisig", multisig.creator.as_ref(), &multisig.created_at.to_le_bytes()],
        bump = multisig.bump
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(
        mut,
        seeds = [
            b"transaction",
            multisig.key().as_ref(),
            &transaction.transaction_index.to_le_bytes()
        ],
        bump = transaction.bump
    )]
    pub transaction: Account<'info, MultisigTransaction>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    #[account(
        seeds = [b"multisig", multisig.creator.as_ref(), &multisig.created_at.to_le_bytes()],
        bump = multisig.bump
    )]
    pub multisig: Account<'info, Multisig>,

    #[account(
        mut,
        seeds = [
            b"transaction",
            multisig.key().as_ref(),
            &transaction.transaction_index.to_le_bytes()
        ],
        bump = transaction.bump
    )]
    pub transaction: Account<'info, MultisigTransaction>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = multisig,
    )]
    pub multisig_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = executor,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub executor: Signer<'info>,

    /// CHECK: Recipient of the transaction
    pub recipient: SystemAccount<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RejectTransaction<'info> {
    #[account(
        mut,
        seeds = [
            b"transaction",
            multisig.key().as_ref(),
            &transaction.transaction_index.to_le_bytes()
        ],
        bump = transaction.bump,
        close = proposer
    )]
    pub transaction: Account<'info, MultisigTransaction>,

    #[account(
        seeds = [b"multisig", multisig.creator.as_ref(), &multisig.created_at.to_le_bytes()],
        bump = multisig.bump
    )]
    pub multisig: Account<'info, Multisig>,

    /// CHECK: The proposer who will receive refund
    #[account(mut)]
    pub proposer: SystemAccount<'info>,

    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Multisig {
    pub creator: Pubkey,
    #[max_len(10)]
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub transaction_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct MultisigTransaction {
    pub multisig: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub transaction_index: u64,
    #[max_len(10)]
    pub approvals: Vec<Pubkey>,
    pub executed: bool,
    pub proposer: Pubkey,
    pub created_at: i64,
    #[max_len(200)]
    pub description: String,
    pub bump: u8,
}

pub fn create_multisig(
    ctx: Context<CreateMultisig>,
    owners: Vec<Pubkey>,
    threshold: u64,
) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let clock = Clock::get()?;

    require!(owners.len() <= MAX_OWNERS, ErrorCode::TooManyOwners);
    require!(threshold > 0 && threshold <= owners.len() as u64, ErrorCode::InvalidThreshold);

    multisig.creator = ctx.accounts.creator.key();
    multisig.owners = owners;
    multisig.threshold = threshold;
    multisig.transaction_count = 0;
    multisig.created_at = clock.unix_timestamp;
    multisig.bump = ctx.bumps.multisig;

    msg!("Multisig created with {} owners and threshold {}", multisig.owners.len(), threshold);
    Ok(())
}

pub fn propose_transaction(
    ctx: Context<ProposeTransaction>,
    amount: u64,
    recipient: Pubkey,
    description: String,
) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let transaction = &mut ctx.accounts.transaction;
    let clock = Clock::get()?;

    // Verify proposer is an owner
    require!(
        multisig.owners.contains(&ctx.accounts.proposer.key()),
        ErrorCode::NotAnOwner
    );

    transaction.multisig = multisig.key();
    transaction.recipient = recipient;
    transaction.amount = amount;
    transaction.transaction_index = multisig.transaction_count;
    transaction.approvals = vec![];
    transaction.executed = false;
    transaction.proposer = ctx.accounts.proposer.key();
    transaction.created_at = clock.unix_timestamp;
    transaction.description = description;
    transaction.bump = ctx.bumps.transaction;

    multisig.transaction_count += 1;

    msg!("Transaction proposed: {} tokens to {}", amount, recipient);
    Ok(())
}

pub fn approve_transaction(ctx: Context<ApproveTransaction>) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let transaction = &mut ctx.accounts.transaction;

    require!(
        multisig.owners.contains(&ctx.accounts.owner.key()),
        ErrorCode::NotAnOwner
    );

    require!(!transaction.executed, ErrorCode::AlreadyExecuted);

    require!(
        !transaction.approvals.contains(&ctx.accounts.owner.key()),
        ErrorCode::AlreadyApproved
    );

    transaction.approvals.push(ctx.accounts.owner.key());

    msg!(
        "Transaction approved: {} of {} approvals",
        transaction.approvals.len(),
        multisig.threshold
    );
    Ok(())
}

pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let transaction = &mut ctx.accounts.transaction;

    require!(!transaction.executed, ErrorCode::AlreadyExecuted);

    require!(
        transaction.approvals.len() as u64 >= multisig.threshold,
        ErrorCode::InsufficientApprovals
    );

    // Transfer tokens from multisig to recipient
    let seeds = &[
        b"multisig",
        multisig.creator.as_ref(),
        &multisig.created_at.to_le_bytes(),
        &[multisig.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.multisig_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.multisig.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, transaction.amount)?;

    transaction.executed = true;

    msg!("Transaction executed: {} tokens sent to {}", transaction.amount, transaction.recipient);
    Ok(())
}

pub fn reject_transaction(ctx: Context<RejectTransaction>) -> Result<()> {
    let multisig = &ctx.accounts.multisig;
    let transaction = &ctx.accounts.transaction;

    require!(
        multisig.owners.contains(&ctx.accounts.owner.key()),
        ErrorCode::NotAnOwner
    );

    require!(!transaction.executed, ErrorCode::AlreadyExecuted);

    msg!("Transaction rejected and closed");
    Ok(())
}
