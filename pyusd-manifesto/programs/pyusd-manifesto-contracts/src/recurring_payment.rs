use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

use crate::ErrorCode;

#[derive(Accounts)]
pub struct CreateRecurringPayment<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + RecurringPayment::INIT_SPACE,
        seeds = [b"recurring", payer.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub recurring_payment: Account<'info, RecurringPayment>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteRecurringPayment<'info> {
    #[account(
        mut,
        seeds = [b"recurring", recurring_payment.payer.as_ref(), &recurring_payment.created_at.to_le_bytes()],
        bump = recurring_payment.bump
    )]
    pub recurring_payment: Account<'info, RecurringPayment>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the recipient of the recurring payment
    pub recipient: SystemAccount<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelRecurringPayment<'info> {
    #[account(
        mut,
        seeds = [b"recurring", recurring_payment.payer.as_ref(), &recurring_payment.created_at.to_le_bytes()],
        bump = recurring_payment.bump,
        close = payer
    )]
    pub recurring_payment: Account<'info, RecurringPayment>,

    #[account(mut)]
    pub payer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct RecurringPayment {
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub interval_seconds: i64,
    pub total_payments: u64,
    pub payments_made: u64,
    pub created_at: i64,
    pub last_payment_at: i64,
    pub is_active: bool,
    #[max_len(200)]
    pub description: String,
    pub bump: u8,
}

pub fn create_recurring_payment(
    ctx: Context<CreateRecurringPayment>,
    amount: u64,
    recipient: Pubkey,
    interval_seconds: i64,
    total_payments: u64,
    description: String,
) -> Result<()> {
    let recurring = &mut ctx.accounts.recurring_payment;
    let clock = Clock::get()?;

    recurring.payer = ctx.accounts.payer.key();
    recurring.recipient = recipient;
    recurring.amount = amount;
    recurring.interval_seconds = interval_seconds;
    recurring.total_payments = total_payments;
    recurring.payments_made = 0;
    recurring.created_at = clock.unix_timestamp;
    recurring.last_payment_at = 0;
    recurring.is_active = true;
    recurring.description = description;
    recurring.bump = ctx.bumps.recurring_payment;

    msg!(
        "Recurring payment created: {} tokens every {} seconds to {}",
        amount,
        interval_seconds,
        recipient
    );
    Ok(())
}

pub fn execute_recurring_payment(ctx: Context<ExecuteRecurringPayment>) -> Result<()> {
    let recurring = &mut ctx.accounts.recurring_payment;
    let clock = Clock::get()?;

    require!(
        ctx.accounts.payer.key() == recurring.payer,
        ErrorCode::Unauthorized
    );

    require!(recurring.is_active, ErrorCode::AllPaymentsCompleted);
    require!(
        recurring.payments_made < recurring.total_payments,
        ErrorCode::AllPaymentsCompleted
    );

    // Check if enough time has passed since last payment
    if recurring.payments_made > 0 {
        let time_since_last = clock.unix_timestamp - recurring.last_payment_at;
        require!(
            time_since_last >= recurring.interval_seconds,
            ErrorCode::PaymentNotDue
        );
    }

    // Transfer tokens from payer to recipient
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, recurring.amount)?;

    recurring.payments_made += 1;
    recurring.last_payment_at = clock.unix_timestamp;

    // Deactivate if all payments completed
    if recurring.payments_made >= recurring.total_payments {
        recurring.is_active = false;
    }

    msg!(
        "Recurring payment executed: {} of {} payments",
        recurring.payments_made,
        recurring.total_payments
    );
    Ok(())
}

pub fn cancel_recurring_payment(ctx: Context<CancelRecurringPayment>) -> Result<()> {
    let recurring = &ctx.accounts.recurring_payment;

    require!(
        ctx.accounts.payer.key() == recurring.payer,
        ErrorCode::Unauthorized
    );

    msg!("Recurring payment cancelled");
    Ok(())
}
