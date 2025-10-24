use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

use crate::ErrorCode;

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.creator.as_ref(), &escrow_account.created_at.to_le_bytes()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.creator.as_ref(), &escrow_account.created_at.to_le_bytes()],
        bump = escrow_account.bump,
        close = creator
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    /// CHECK: This is the creator account for refunds
    #[account(mut)]
    pub creator: SystemAccount<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow_account.creator.as_ref(), &escrow_account.created_at.to_le_bytes()],
        bump = escrow_account.bump,
        close = creator
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = escrow_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = creator,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub created_at: i64,
    pub expiry_time: i64,
    pub is_funded: bool,
    #[max_len(200)]
    pub description: String,
    pub bump: u8,
}

pub fn create_escrow(
    ctx: Context<CreateEscrow>,
    amount: u64,
    recipient: Pubkey,
    expiry_time: i64,
    description: String,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;
    let clock = Clock::get()?;

    escrow.creator = ctx.accounts.creator.key();
    escrow.recipient = recipient;
    escrow.amount = amount;
    escrow.created_at = clock.unix_timestamp;
    escrow.expiry_time = expiry_time;
    escrow.is_funded = false;
    escrow.description = description;
    escrow.bump = *ctx.bumps.get("escrow_account").unwrap();

    msg!("Escrow created: {} tokens for {}", amount, recipient);
    Ok(())
}

pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow_account;

    require!(!escrow.is_funded, ErrorCode::AlreadyFunded);

    let clock = Clock::get()?;
    require!(clock.unix_timestamp < escrow.expiry_time, ErrorCode::EscrowExpired);

    // Transfer tokens from creator to escrow
    let cpi_accounts = Transfer {
        from: ctx.accounts.creator_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, escrow.amount)?;

    escrow.is_funded = true;

    msg!("Escrow funded with {} tokens", escrow.amount);
    Ok(())
}

pub fn claim_escrow(ctx: Context<ClaimEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_account;

    require!(escrow.is_funded, ErrorCode::NotFunded);
    require!(
        ctx.accounts.recipient.key() == escrow.recipient,
        ErrorCode::Unauthorized
    );

    let clock = Clock::get()?;
    require!(clock.unix_timestamp < escrow.expiry_time, ErrorCode::EscrowExpired);

    // Transfer tokens from escrow to recipient
    let seeds = &[
        b"escrow",
        escrow.creator.as_ref(),
        &escrow.created_at.to_le_bytes(),
        &[escrow.bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.escrow_account.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, escrow.amount)?;

    msg!("Escrow claimed by recipient: {} tokens", escrow.amount);
    Ok(())
}

pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow_account;

    require!(
        ctx.accounts.creator.key() == escrow.creator,
        ErrorCode::Unauthorized
    );

    let clock = Clock::get()?;
    require!(clock.unix_timestamp >= escrow.expiry_time, ErrorCode::EscrowNotExpired);

    if escrow.is_funded {
        // Refund tokens to creator
        let seeds = &[
            b"escrow",
            escrow.creator.as_ref(),
            &escrow.created_at.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, escrow.amount)?;
    }

    msg!("Escrow cancelled and refunded");
    Ok(())
}
