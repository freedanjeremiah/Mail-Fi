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
pub enum PaymentInterval {
    Daily,
    Weekly,
    Monthly,
}

impl PaymentInterval {
    pub fn to_seconds(&self) -> i64 {
        match self {
            PaymentInterval::Daily => 24 * 60 * 60,
            PaymentInterval::Weekly => 7 * 24 * 60 * 60,
            PaymentInterval::Monthly => 30 * 24 * 60 * 60,
        }
    }
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct RecurringPayment {
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount_per_payment: u64,
    pub interval: PaymentInterval,
    pub total_payments: u64,
    pub payments_made: u64,
    pub last_payment_time: i64,
    pub is_active: bool,
    pub created_at: i64,
    pub description: String,
    pub bump: u8,
}

impl RecurringPayment {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1 + 8 + 8 + 8 + 1 + 8 + 4 + 100 + 1; // ~210 bytes
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CreateRecurringPaymentArgs {
    pub recipient: Pubkey,
    pub amount_per_payment: u64,
    pub interval: PaymentInterval,
    pub total_payments: u64,
    pub description: String,
}

pub fn process_create_recurring_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let recurring_payment_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    let args = CreateRecurringPaymentArgs::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    // Validate args
    if args.total_payments == 0 {
        msg!("Total payments must be greater than 0");
        return Err(ProgramError::InvalidArgument);
    }

    if args.amount_per_payment == 0 {
        msg!("Amount per payment must be greater than 0");
        return Err(ProgramError::InvalidArgument);
    }

    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Derive PDA
    let (payment_pda, bump) = Pubkey::find_program_address(
        &[
            b"recurring_payment",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
        ],
        program_id,
    );

    if payment_pda != *recurring_payment_account.key {
        msg!("Invalid recurring payment PDA");
        return Err(ProgramError::InvalidArgument);
    }

    // Create recurring payment account
    let rent = Rent::get()?;
    let space = RecurringPayment::MAX_SIZE;
    let lamports = rent.minimum_balance(space);

    invoke_signed(
        &system_instruction::create_account(
            creator.key,
            recurring_payment_account.key,
            lamports,
            space as u64,
            program_id,
        ),
        &[creator.clone(), recurring_payment_account.clone(), system_program.clone()],
        &[&[
            b"recurring_payment",
            creator.key.as_ref(),
            &current_time.to_le_bytes(),
            &[bump],
        ]],
    )?;

    // Initialize recurring payment data
    let payment_data = RecurringPayment {
        creator: *creator.key,
        recipient: args.recipient,
        amount_per_payment: args.amount_per_payment,
        interval: args.interval,
        total_payments: args.total_payments,
        payments_made: 0,
        last_payment_time: 0, // No payments made yet
        is_active: true,
        created_at: current_time,
        description: args.description,
        bump,
    };

    payment_data.serialize(&mut &mut recurring_payment_account.data.borrow_mut()[..])?;

    msg!("Recurring payment created successfully!");
    msg!("Payment PDA: {}", recurring_payment_account.key);
    msg!("Recipient: {}", args.recipient);
    msg!("Amount per payment: {}", args.amount_per_payment);
    msg!("Total payments: {}", args.total_payments);

    Ok(())
}

pub fn process_execute_recurring_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let recurring_payment_account = next_account_info(accounts_iter)?;
    let creator_token_account = next_account_info(accounts_iter)?;
    let recipient_token_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load payment data
    let mut payment_data = RecurringPayment::try_from_slice(&recurring_payment_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if payment_data.creator != *creator.key {
        msg!("Only creator can execute payment");
        return Err(ProgramError::InvalidAccountData);
    }

    if !payment_data.is_active {
        msg!("Recurring payment is not active");
        return Err(ProgramError::InvalidAccountData);
    }

    if payment_data.payments_made >= payment_data.total_payments {
        msg!("All payments have been made");
        return Err(ProgramError::InvalidAccountData);
    }

    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Check if enough time has passed since last payment
    if payment_data.last_payment_time > 0 {
        let time_since_last = current_time - payment_data.last_payment_time;
        let interval_seconds = payment_data.interval.to_seconds();

        if time_since_last < interval_seconds {
            msg!("Payment interval not reached yet");
            msg!("Time since last payment: {} seconds", time_since_last);
            msg!("Required interval: {} seconds", interval_seconds);
            return Err(ProgramError::InvalidAccountData);
        }
    }

    // Execute payment transfer
    let transfer_instruction = spl_token_2022::instruction::transfer_checked(
        token_program.key,
        creator_token_account.key,
        &spl_token_2022::id(),
        recipient_token_account.key,
        creator.key,
        &[],
        payment_data.amount_per_payment,
        6, // PYUSD decimals
    )?;

    invoke(
        &transfer_instruction,
        &[
            creator_token_account.clone(),
            recipient_token_account.clone(),
            creator.clone(),
            token_program.clone(),
        ],
    )?;

    // Update payment data
    payment_data.payments_made += 1;
    payment_data.last_payment_time = current_time;

    // Deactivate if all payments completed
    if payment_data.payments_made >= payment_data.total_payments {
        payment_data.is_active = false;
        msg!("All recurring payments completed!");
    }

    payment_data.serialize(&mut &mut recurring_payment_account.data.borrow_mut()[..])?;

    msg!("Recurring payment executed successfully!");
    msg!("Payments made: {}/{}", payment_data.payments_made, payment_data.total_payments);
    msg!("Amount transferred: {}", payment_data.amount_per_payment);

    Ok(())
}

pub fn process_cancel_recurring_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let recurring_payment_account = next_account_info(accounts_iter)?;
    let creator = next_account_info(accounts_iter)?;

    if !creator.is_signer {
        msg!("Creator must be a signer");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Load payment data
    let mut payment_data = RecurringPayment::try_from_slice(&recurring_payment_account.data.borrow())
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if payment_data.creator != *creator.key {
        msg!("Only creator can cancel payment");
        return Err(ProgramError::InvalidAccountData);
    }

    if !payment_data.is_active {
        msg!("Recurring payment is already inactive");
        return Err(ProgramError::InvalidAccountData);
    }

    // Deactivate the recurring payment
    payment_data.is_active = false;
    payment_data.serialize(&mut &mut recurring_payment_account.data.borrow_mut()[..])?;

    msg!("Recurring payment cancelled successfully!");
    msg!("Payments made before cancellation: {}/{}", payment_data.payments_made, payment_data.total_payments);

    Ok(())
}
